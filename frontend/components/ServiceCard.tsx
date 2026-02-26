import React from 'react';
import { Star, Phone, MapPin, Wrench, Truck, Clock, MessageCircle } from 'lucide-react';
import { ServiceProvider, UserRole } from '../types';
import { Language, translations } from '../translations';
import DistanceIndicator from './DistanceIndicator';
import { WILAYAS } from '../constants';

interface ServiceCardProps {
  provider: ServiceProvider;
  userLocation: { lat: number; lng: number } | null;
  onBook: (provider: ServiceProvider) => void;
  language: Language;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ provider, userLocation, onBook, language }) => {
  const providerWilaya = WILAYAS.find(w => w.id === provider.wilayaId);
  const t = translations[language];

  // Helper to check if open
  const getStatus = () => {
    if (!provider.isAvailable) return { text: t.unavailable, color: 'bg-red-500', isBookable: false };
    
    // Check Schedule
    if (!provider.workingDays || !provider.workingHours) return { text: t.unavailable, color: 'bg-slate-400', isBookable: true };

    const now = new Date();
    const currentDay = now.getDay(); // 0=Sun
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeValue = currentHour * 60 + currentMinute;

    const [startH, startM] = provider.workingHours.start.split(':').map(Number);
    const [endH, endM] = provider.workingHours.end.split(':').map(Number);
    const startValue = startH * 60 + startM;
    const endValue = endH * 60 + endM;

    // Check if today is a working day
    if (!provider.workingDays.includes(currentDay)) return { text: t.closedToday, color: 'bg-slate-500', isBookable: true };

    // Check time range
    if (currentTimeValue >= startValue && currentTimeValue <= endValue) {
      return { text: t.openNow, color: 'bg-green-500', isBookable: true };
    }

    return { text: t.closedNow, color: 'bg-slate-500', isBookable: true };
  };

  const status = getStatus();
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-700 overflow-hidden group">
      
      {/* Conditionally render Image or Placeholder for Towing */}
      {provider.role === UserRole.TOWING ? (
        <div className="relative h-32 bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center overflow-hidden">
           <div className="absolute inset-0 bg-white/10 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 10%, transparent 10%)', backgroundSize: '10px 10px' }}></div>
           <Truck size={48} className="text-white drop-shadow-lg" />
           
           {/* Dynamic Status Badge for Towing */}
           <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm flex items-center backdrop-blur-md ${status.color}`}>
             {status.text}
           </div>
        </div>
      ) : (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={provider.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&size=400&background=0f172a&color=f8fafc&bold=true`} 
            alt={provider.name} 
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute top-3 right-3 flex gap-2">
            {/* Rating Badge */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-slate-800 dark:text-white shadow-sm flex items-center">
                <Star size={12} className="text-yellow-400 mr-1 fill-yellow-400" />
                {provider.rating}
            </div>
          </div>
          
          {/* Status Badge Over Image */}
          <div className={`absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm flex items-center backdrop-blur-md border border-white/20 ${status.color}`}>
             {status.text}
          </div>

          {!status.isBookable && (
            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-[1px]">
              <span className="text-white font-bold text-lg px-4 py-2 border-2 border-white rounded-lg">{t.currentlyUnavailable}</span>
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 inline-block ${
              provider.role === UserRole.TOWING ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 
              provider.role === UserRole.PARTS_SHOP ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
            }`}>
              {provider.role.replace('_', ' ')}
            </span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{provider.name}</h3>
          </div>
        </div>

        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">{provider.description}</p>
        
        {/* Hours Summary */}
        <div className="flex items-center gap-2 mb-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
            <Clock size={14} className="text-slate-400" />
            <span>
                {provider.workingHours 
                 ? `${provider.workingHours.start} - ${provider.workingHours.end}` 
                 : t.hoursNotSet}
            </span>
            <span className="text-slate-300">|</span>
            <span>
               {provider.workingDays?.length === 7 ? t.everyDay : 
                provider.workingDays?.length === 6 && !provider.workingDays.includes(5) ? t.satThu : 
                t.customSchedule}
            </span>
        </div>

        {provider.specialty && (
          <div className="flex flex-wrap gap-1 mb-4">
            {provider.specialty.map((spec, i) => (
              <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">
                {spec}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-slate-600 dark:text-slate-400 text-sm">
            <MapPin size={14} className="mr-2 text-slate-400 dark:text-slate-500" />
            <span>{provider.commune}, {providerWilaya?.name}</span>
          </div>
          {providerWilaya && (
             <div className="ml-6">
               <DistanceIndicator 
                 userLat={userLocation?.lat} 
                 userLng={userLocation?.lng}
                 targetLat={providerWilaya.latitude}
                 targetLng={providerWilaya.longitude}
                 language={language}
               />
             </div>
          )}
        </div>

        <div className="flex gap-2 mt-auto">
          {provider.role === UserRole.TOWING || provider.role === UserRole.PARTS_SHOP ? (
            // For towing and spare parts: only show call and WhatsApp buttons
            <>
              <a href={`tel:${provider.phone}`} className="flex-1 bg-slate-900 dark:bg-blue-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
                <Phone size={18} />
                {t.callNow}
              </a>
              <a href={`https://wa.me/${(() => { const d = provider.phone.replace(/\D/g, ''); return d.startsWith('0') ? '213' + d.slice(1) : d; })()}`} target="_blank" rel="noopener noreferrer" className="w-10 flex items-center justify-center border border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 transition-colors">
                <MessageCircle size={18} />
              </a>
            </>
          ) : (
            // For mechanic services: show book button and phone
            <>
              <button 
                onClick={() => onBook(provider)}
                disabled={!status.isBookable}
                className="flex-1 bg-slate-900 dark:bg-blue-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Wrench size={16} />
                {t.bookNow}
              </button>
              <a href={`tel:${provider.phone}`} className="w-10 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">
                <Phone size={18} />
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;