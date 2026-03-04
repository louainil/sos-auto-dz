import React, { useState } from 'react';
import { X, Calendar, MessageCircle, CheckCircle, Car, ChevronDown } from 'lucide-react';
import { ServiceProvider } from '../types';
import { bookingsAPI } from '../api';
import { Language, translations } from '../translations';
import { CAR_BRANDS } from '../constants';

const BREAKDOWN_TYPES = [
  'Flat Tyre',
  'Dead Battery',
  'Engine Problem',
  'Overheating',
  'Accident',
  'Electrical',
  'Body Damage',
  'Other',
] as const;

interface BookingModalProps {
  provider: ServiceProvider;
  onClose: () => void;
  language?: Language;
}

const BookingModal: React.FC<BookingModalProps> = ({ provider, onClose, language = 'en' }) => {
  const t = translations[language];
  const isRTL = language === 'ar';
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    date: '',
    description: '',
    carBrand: '',
    carModel: '',
    breakdownType: '',
  });
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [confirmedSummary, setConfirmedSummary] = useState<{ date: string; providerName: string; issue: string } | null>(null);
  const [dateError, setDateError] = useState('');
  const [descError, setDescError] = useState('');

  const validateDate = (val: string) => val ? '' : t.dateRequired;
  const validateDesc = (val: string) => val.trim().length >= 10 ? '' : t.descTooShort;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dErr = validateDate(formData.date);
    const vErr = validateDesc(formData.description);
    setDateError(dErr);
    setDescError(vErr);
    if (dErr || vErr) return;
    setIsLoading(true);
    setError('');
    
    try {
      const issueParts: string[] = [];
      if (formData.breakdownType) issueParts.push(`[${formData.breakdownType.toUpperCase()}]`);
      if (formData.carBrand || formData.carModel) {
        issueParts.push(`${formData.carBrand} ${formData.carModel}`.trim());
      }
      if (formData.description.trim()) {
        issueParts.push(issueParts.length > 0 ? `— ${formData.description.trim()}` : formData.description.trim());
      }
      const issue = issueParts.join(' ') || formData.description;

      await bookingsAPI.create({
        providerId: provider.id,
        date: formData.date,
        issue
      });
      setConfirmedSummary({ date: formData.date, providerName: provider.name, issue });
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative border border-slate-200 dark:border-slate-800">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X size={24} />
        </button>

        {step === 1 ? (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t.bookService}</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{t.scheduleWith} <span className="font-semibold text-blue-600 dark:text-blue-400">{provider.name}</span></p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.preferredDate}</label>
                <div className="relative">
                  <Calendar className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-2.5 text-slate-400`} size={18} />
                  <input 
                    required
                    type="date" 
                    min={new Date().toISOString().slice(0, 10)}
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 rounded-lg border ${dateError ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'} bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 outline-none transition-all`}
                    value={formData.date}
                    onChange={e => { setFormData({...formData, date: e.target.value}); setDateError(validateDate(e.target.value)); }}
                    onBlur={e => setDateError(validateDate(e.target.value))}
                  />
                </div>
                {dateError && <p className="mt-1 text-xs text-red-500">{dateError}</p>}
              </div>

              {/* Breakdown Type Chips */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.breakdownTypeLabel}</label>
                <div className="flex flex-wrap gap-2">
                  {BREAKDOWN_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({...formData, breakdownType: formData.breakdownType === type ? '' : type})}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        formData.breakdownType === type
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle Info */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.vehicleInfo}</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Car Brand Dropdown */}
                  <div className="relative">
                    <Car className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-2.5 text-slate-400`} size={16} />
                    <input
                      type="text"
                      placeholder={t.searchCarBrand}
                      className={`w-full ${isRTL ? 'pr-9 pl-8' : 'pl-9 pr-8'} py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none`}
                      value={brandSearch}
                      onChange={e => { setBrandSearch(e.target.value); setShowBrandDropdown(true); if (!e.target.value) setFormData({...formData, carBrand: ''}); }}
                      onFocus={() => setShowBrandDropdown(true)}
                    />
                    <ChevronDown className={`absolute ${isRTL ? 'left-2.5' : 'right-2.5'} top-2.5 text-slate-400 pointer-events-none`} size={16} />
                    {showBrandDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowBrandDropdown(false)} />
                        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                          {CAR_BRANDS.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase())).slice(0, 20).map(brand => (
                            <div
                              key={brand}
                              className="px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-200"
                              onClick={() => { setFormData({...formData, carBrand: brand}); setBrandSearch(brand); setShowBrandDropdown(false); }}
                            >
                              {brand}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  {/* Car Model */}
                  <input
                    type="text"
                    placeholder={t.carModelLabel}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={formData.carModel}
                    onChange={e => setFormData({...formData, carModel: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.problemDescription}</label>
                <div className="relative">
                  <MessageCircle className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 text-slate-400`} size={18} />
                  <textarea 
                    required
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 rounded-lg border ${descError ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'} bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 outline-none transition-all h-24 resize-none`}
                    placeholder={t.describeIssue}
                    value={formData.description}
                    onChange={e => { setFormData({...formData, description: e.target.value}); if (e.target.value.length > 0) setDescError(validateDesc(e.target.value)); else setDescError(''); }}
                    onBlur={e => { if (e.target.value.length > 0 || descError) setDescError(validateDesc(e.target.value)); }}
                  ></textarea>
                </div>
                {descError && <p className="mt-1 text-xs text-red-500">{descError}</p>}
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 dark:bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? t.creatingBooking : t.confirmBooking}
              </button>
            </form>
          </div>
        ) : (
          <div className="p-10 flex flex-col items-center text-center animate-fade-in">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{t.bookingConfirmed}</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">{t.bookingConfirmedDesc}</p>

            {confirmedSummary && (
              <div className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-6 text-left space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0 pt-0.5">{t.bookingWith}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{confirmedSummary.providerName}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0 pt-0.5">{t.preferredDate}</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{confirmedSummary.date}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide w-20 shrink-0 pt-0.5">{t.issueLabel.replace(':', '')}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400 break-words min-w-0">{confirmedSummary.issue}</span>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {t.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
