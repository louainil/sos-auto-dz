import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { ServiceProvider, UserRole } from '../types';
import { Language, translations } from '../translations';
import { WILAYAS } from '../constants';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored markers for different provider types
const createIcon = (color: string) =>
  new L.DivIcon({
    className: 'custom-map-marker',
    html: `<div style="
      background: ${color};
      width: 28px; height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    "><div style="
      transform: rotate(45deg);
      text-align: center;
      line-height: 22px;
      font-size: 12px;
      color: white;
      font-weight: bold;
    ">${color === '#ef4444' ? '🚛' : color === '#3b82f6' ? '🔧' : '⚙️'}</div></div>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });

const ICONS: Record<string, L.DivIcon> = {
  [UserRole.MECHANIC]: createIcon('#10b981'),
  [UserRole.PARTS_SHOP]: createIcon('#3b82f6'),
  [UserRole.TOWING]: createIcon('#ef4444'),
};

const USER_ICON = new L.DivIcon({
  className: 'user-location-marker',
  html: `<div style="
    width: 16px; height: 16px;
    background: #3b82f6;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(59,130,246,0.3), 0 2px 4px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Fit bounds to all markers
const FitBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  React.useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [map, positions]);
  return null;
};

interface ProviderMapProps {
  providers: ServiceProvider[];
  userLocation: { lat: number; lng: number } | null;
  language: Language;
  /** If set, centers on a single provider (profile page mode) */
  singleMode?: boolean;
  height?: string;
}

const ProviderMap: React.FC<ProviderMapProps> = ({
  providers,
  userLocation,
  language,
  singleMode = false,
  height = '500px',
}) => {
  const t = translations[language];

  // Build marker data: resolve each provider's lat/lng from their wilaya
  const markers = useMemo(() => {
    return providers
      .map(p => {
        const wilaya = WILAYAS.find(w => w.id === p.wilayaId);
        if (!wilaya) return null;
        return { provider: p, lat: wilaya.latitude, lng: wilaya.longitude };
      })
      .filter(Boolean) as { provider: ServiceProvider; lat: number; lng: number }[];
  }, [providers]);

  // All positions for bounds fitting
  const allPositions = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = markers.map(m => [m.lat, m.lng]);
    if (userLocation) pts.push([userLocation.lat, userLocation.lng]);
    return pts;
  }, [markers, userLocation]);

  // Default Algeria center
  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : singleMode && markers.length > 0
      ? [markers[0].lat, markers[0].lng]
      : [28.0339, 1.6596]; // Algeria center

  const zoom = singleMode ? 10 : 6;

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {!singleMode && allPositions.length > 1 && <FitBounds positions={allPositions} />}

        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={USER_ICON}>
            <Popup>
              <span className="font-medium text-sm">📍 {t.nearYou}</span>
            </Popup>
          </Marker>
        )}

        {/* Provider markers */}
        {markers.map(({ provider, lat, lng }) => (
          <Marker
            key={provider.id}
            position={[lat, lng]}
            icon={ICONS[provider.role] || ICONS[UserRole.MECHANIC]}
          >
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-bold text-sm mb-1">{provider.name}</p>
                <p className="text-xs text-slate-500 mb-1">
                  {provider.commune}, {WILAYAS.find(w => w.id === provider.wilayaId)?.name}
                </p>
                <p className="text-xs mb-1">
                  ⭐ {provider.rating} &nbsp;|&nbsp;
                  <span className={provider.isAvailable ? 'text-green-600' : 'text-red-500'}>
                    {provider.isAvailable ? t.openNow : t.unavailable}
                  </span>
                </p>
                {provider.phone && (
                  <p className="text-xs mb-2">📞 {provider.phone}</p>
                )}
                {!singleMode && (
                  <Link
                    to={`/provider/${provider.id}`}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    {t.viewProfile} →
                  </Link>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ProviderMap;
