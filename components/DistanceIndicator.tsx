import React from 'react';
import { MapPin } from 'lucide-react';

interface DistanceIndicatorProps {
  userLat?: number;
  userLng?: number;
  targetLat: number;
  targetLng: number;
}

const DistanceIndicator: React.FC<DistanceIndicatorProps> = ({ userLat, userLng, targetLat, targetLng }) => {
  if (!userLat || !userLng) {
    return (
      <div className="flex items-center text-slate-400 text-xs">
        <MapPin size={14} className="mr-1" />
        <span>Distance unknown</span>
      </div>
    );
  }

  // Haversine formula for rough distance in km
  const R = 6371; // Radius of earth in km
  const dLat = (targetLat - userLat) * Math.PI / 180;
  const dLon = (targetLng - userLng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(userLat * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km

  let colorClass = 'bg-green-500';
  let text = 'Near you';

  if (distance > 50) {
    colorClass = 'bg-yellow-500';
    text = 'Moderate distance';
  }
  if (distance > 150) {
    colorClass = 'bg-red-500';
    text = 'Far location';
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colorClass} animate-pulse`}></div>
      <span className="text-xs text-slate-600 font-medium">
        {distance.toFixed(1)} km ({text})
      </span>
    </div>
  );
};

export default DistanceIndicator;
