import React from 'react';
import { ArrowRight, Search, Map, Shield, Calendar, Wrench, Settings, Truck } from 'lucide-react';
import { PageView } from '../types';
import { Language, translations } from '../translations';

interface HomeProps {
  onChangeView: (view: PageView) => void;
  language: Language;
}

const Home: React.FC<HomeProps> = ({ onChangeView, language }) => {
  const t = translations[language];
  
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0 bg-slate-900 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-slate-900/90 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
            alt="Mechanical background" 
            className="w-full h-full object-cover opacity-30"
          />
        </div>

        <div className="relative z-20 container mx-auto px-4 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-semibold mb-6 backdrop-blur-sm animate-fade-in">
            {t.heroTagline}
          </span>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight animate-fade-in">
            {t.heroTitle1} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{t.heroTitle2}</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 animate-fade-in delay-100">
            {t.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in delay-200">
            <button 
              onClick={() => onChangeView(PageView.GARAGE)}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <Search size={20} />
              {t.findGarage}
            </button>
            <button 
              onClick={() => onChangeView(PageView.TOWING)}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
            >
              <Truck size={20} />
              {t.emergencyTowing}
            </button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">{t.servicesTitle}</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">{t.servicesSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div 
              onClick={() => onChangeView(PageView.GARAGE)}
              className="group p-8 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-blue-100 dark:hover:border-blue-900 hover:shadow-xl hover:shadow-blue-900/5 transition-all cursor-pointer"
            >
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Wrench size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t.garageServicesTitle}</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">{t.garageServicesDesc}</p>
              <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                {t.browseGarages} <ArrowRight size={16} />
              </span>
            </div>

            <div 
              onClick={() => onChangeView(PageView.PARTS)}
              className="group p-8 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-emerald-100 dark:hover:border-emerald-900 hover:shadow-xl hover:shadow-emerald-900/5 transition-all cursor-pointer"
            >
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Settings size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t.sparePartsTitle}</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">{t.sparePartsDesc}</p>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                {t.findParts} <ArrowRight size={16} />
              </span>
            </div>

            <div 
              onClick={() => onChangeView(PageView.TOWING)}
              className="group p-8 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-orange-100 dark:hover:border-orange-900 hover:shadow-xl hover:shadow-orange-900/5 transition-all cursor-pointer"
            >
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Truck size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t.roadsideTitle}</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">{t.roadsideDesc}</p>
              <span className="text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                {t.getHelpNow} <ArrowRight size={16} />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features/Stats Section */}
      <section className="py-24 bg-slate-900 dark:bg-slate-950 text-white relative overflow-hidden border-t border-slate-800">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/10 transform skew-x-12"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t.whyChooseTitle}</h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
                    <Map size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-1">{t.smartGeoTitle}</h3>
                    <p className="text-slate-400">{t.smartGeoDesc}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-1">{t.verifiedProsTitle}</h3>
                    <p className="text-slate-400">{t.verifiedProsDesc}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-1">{t.instantBookingTitle}</h3>
                    <p className="text-slate-400">{t.instantBookingDesc}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800 dark:bg-slate-900 p-8 rounded-3xl border border-slate-700">
              <div className="grid grid-cols-2 gap-6">
                 <div className="text-center p-6 bg-slate-900/50 rounded-2xl">
                   <div className="text-4xl font-bold text-blue-400 mb-2">58</div>
                   <div className="text-sm text-slate-400">{t.wilayasCovered}</div>
                 </div>
                 <div className="text-center p-6 bg-slate-900/50 rounded-2xl">
                   <div className="text-4xl font-bold text-emerald-400 mb-2">2k+</div>
                   <div className="text-sm text-slate-400">{t.activeMechanics}</div>
                 </div>
                 <div className="text-center p-6 bg-slate-900/50 rounded-2xl">
                   <div className="text-4xl font-bold text-orange-400 mb-2">15m</div>
                   <div className="text-sm text-slate-400">{t.avgResponseTime}</div>
                 </div>
                 <div className="text-center p-6 bg-slate-900/50 rounded-2xl">
                   <div className="text-4xl font-bold text-purple-400 mb-2">5.0</div>
                   <div className="text-sm text-slate-400">{t.userRating}</div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;