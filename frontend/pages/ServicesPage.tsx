import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, Filter, AlertTriangle, Navigation, Wrench, Zap, PaintBucket, Car, X, ChevronDown } from 'lucide-react';
import { MOCK_PROVIDERS, WILAYAS, COMMUNES, CAR_BRANDS } from '../constants';
import { ServiceProvider, UserRole, GarageType } from '../types';
import { Language, translations } from '../translations';
import ServiceCard from '../components/ServiceCard';

interface ServicesPageProps {
  type: UserRole;
  title: string;
  subtitle: string;
  userLocation: { lat: number; lng: number } | null;
  onBook: (provider: ServiceProvider) => void;
  language: Language;
}

const ServicesPage: React.FC<ServicesPageProps> = ({ type, title, subtitle, userLocation, onBook, language }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState<number | 'all'>('all');
  const [selectedCommune, setSelectedCommune] = useState<string>('all');
  const [selectedGarageType, setSelectedGarageType] = useState<GarageType | 'all'>('all');
  
  const t = translations[language];
  
  // Brand Search State
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [showBrandList, setShowBrandList] = useState(false);

  // Reset commune when wilaya changes
  useEffect(() => {
    setSelectedCommune('all');
  }, [selectedWilaya]);

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand);
    setBrandSearchTerm(brand);
    setShowBrandList(false);
  };

  const clearBrandSearch = () => {
    setSelectedBrand('all');
    setBrandSearchTerm('');
    setShowBrandList(false);
  };

  const filteredProviders = useMemo(() => {
    return MOCK_PROVIDERS.filter(p => {
      // 1. Filter by User Role
      if (p.role !== type) return false;

      // 2. Filter by Wilaya
      if (selectedWilaya !== 'all' && p.wilayaId !== selectedWilaya) return false;

      // 3. Filter by Commune
      if (selectedCommune !== 'all' && p.commune !== selectedCommune) return false;

      // 4. Filter by Garage Type (Only for Mechanic Role)
      if (type === UserRole.MECHANIC && selectedGarageType !== 'all') {
        if (p.garageType !== selectedGarageType) return false;
      }

      // 5. Filter by Car Brand (Specialty)
      // Only apply if NOT Towing, as Towing doesn't filter by brand usually, or if the filter is hidden we shouldn't apply it implicitly if state persists
      if (type !== UserRole.TOWING && selectedBrand !== 'all') {
        // If provider has no specialty listed, we assume they might handle it or we exclude them.
        if (!p.specialty || !p.specialty.includes(selectedBrand)) return false;
      }

      // 6. Filter by Search Term (Name or Description)
      if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !p.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [type, selectedWilaya, selectedCommune, selectedGarageType, selectedBrand, searchTerm]);

  const availableCommunes = selectedWilaya !== 'all' ? COMMUNES[selectedWilaya] || [] : [];

  const filteredBrands = CAR_BRANDS.filter(brand => 
    brand.toLowerCase().includes(brandSearchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-300">
      {/* Header Section */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white py-16 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4 text-blue-400">
             {type === UserRole.TOWING ? <AlertTriangle /> : <Filter />}
             <span className="uppercase tracking-widest text-xs font-bold">{title}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
          <p className="text-slate-400 text-lg max-w-2xl">{subtitle}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-16 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          
          {/* Top Row Filters */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Text Search */}
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder={`Search ${title.toLowerCase()}...`}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Wilaya Filter */}
            <div className="md:col-span-4 relative">
              <MapPin className="absolute left-3 top-3 text-slate-400" size={20} />
              <select 
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                value={selectedWilaya}
                onChange={(e) => setSelectedWilaya(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              >
                <option value="all">All Wilayas</option>
                {WILAYAS.map(w => (
                  <option key={w.id} value={w.id}>{w.id} - {w.name}</option>
                ))}
              </select>
            </div>

            {/* Commune Filter */}
            <div className="md:col-span-3 relative">
              <Navigation className="absolute left-3 top-3 text-slate-400" size={20} />
              <select 
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                value={selectedCommune}
                onChange={(e) => setSelectedCommune(e.target.value)}
                disabled={selectedWilaya === 'all'}
              >
                <option value="all">{selectedWilaya === 'all' ? 'Select Wilaya First' : 'All Communes'}</option>
                {availableCommunes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bottom Row Filters (Garage Type & Brand) */}
          {type !== UserRole.TOWING && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              {type === UserRole.MECHANIC && (
                <div className="md:col-span-6 relative">
                  <Wrench className="absolute left-3 top-3 text-slate-400" size={20} />
                  <select 
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                      value={selectedGarageType}
                      onChange={(e) => setSelectedGarageType(e.target.value as GarageType | 'all')}
                  >
                      <option value="all">All Garage Types</option>
                      <option value="MECHANIC">Mechanic</option>
                      <option value="ELECTRICIAN">Electrician</option>
                      <option value="AUTO_BODY">Auto Body</option>
                  </select>
                </div>
              )}

              {/* Car Brand Filter - Searchable Autocomplete */}
              <div className={`${type === UserRole.MECHANIC ? 'md:col-span-6' : 'md:col-span-12'} relative z-20`}>
                <Car className="absolute left-3 top-3 text-slate-400" size={20} />
                
                <div className="relative">
                  <input 
                      type="text"
                      placeholder="Search Car Brand..."
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all"
                      value={brandSearchTerm}
                      onChange={(e) => {
                          setBrandSearchTerm(e.target.value);
                          setShowBrandList(true);
                          if(e.target.value === '') setSelectedBrand('all');
                          else setSelectedBrand('all'); 
                      }}
                      onFocus={() => setShowBrandList(true)}
                  />
                  
                  {/* Clear/Dropdown Icon */}
                  <div className="absolute right-3 top-2.5 text-slate-400 cursor-pointer">
                      {brandSearchTerm ? (
                          <X size={20} onClick={clearBrandSearch} className="hover:text-slate-600 dark:hover:text-slate-200" />
                      ) : (
                          <ChevronDown size={20} onClick={() => setShowBrandList(!showBrandList)} />
                      )}
                  </div>

                  {/* Dropdown List */}
                  {showBrandList && (
                      <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowBrandList(false)}></div>
                      <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                          <div 
                              className={`px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-200 ${selectedBrand === 'all' ? 'bg-blue-50 dark:bg-slate-700/50' : ''}`}
                              onClick={() => {
                                  setSelectedBrand('all');
                                  setBrandSearchTerm('');
                                  setShowBrandList(false);
                              }}
                          >
                              All Brands
                          </div>
                          {filteredBrands.map(brand => (
                              <div 
                                  key={brand}
                                  className={`px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-200 ${selectedBrand === brand ? 'bg-blue-50 dark:bg-slate-700/50 text-blue-600 dark:text-blue-400' : ''}`}
                                  onClick={() => handleBrandSelect(brand)}
                              >
                                  {brand}
                              </div>
                          ))}
                          {filteredBrands.length === 0 && (
                              <div className="px-4 py-3 text-slate-400 text-sm text-center italic">
                                  No brands found matching "{brandSearchTerm}"
                              </div>
                          )}
                      </div>
                      </>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Results Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {filteredProviders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProviders.map(provider => (
              <ServiceCard 
                key={provider.id} 
                provider={provider} 
                userLocation={userLocation}
                onBook={onBook}
                language={language}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
             <div className="bg-slate-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 dark:text-slate-500">
               <Search size={32} />
             </div>
             <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">{t.noResultsFound}</h3>
             <p className="text-slate-500 dark:text-slate-400">{t.noResultsDesc}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;