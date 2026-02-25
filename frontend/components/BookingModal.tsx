import React, { useState } from 'react';
import { X, Calendar, MessageCircle, CheckCircle } from 'lucide-react';
import { ServiceProvider } from '../types';
import { bookingsAPI } from '../api';
import { Language, translations } from '../translations';

interface BookingModalProps {
  provider: ServiceProvider;
  onClose: () => void;
  language?: Language;
}

const BookingModal: React.FC<BookingModalProps> = ({ provider, onClose, language = 'en' }) => {
  const t = translations[language];
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    date: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await bookingsAPI.create({
        providerId: provider.id,
        date: formData.date,
        issue: formData.description
      });
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-200 dark:border-slate-800">
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
                  <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <input 
                    required
                    type="date" 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.problemDescription}</label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-3 text-slate-400" size={18} />
                  <textarea 
                    required
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all h-24 resize-none"
                    placeholder={t.describeIssue}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>
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
          <div className="p-12 flex flex-col items-center text-center animate-fade-in">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t.bookingConfirmed}</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {t.bookingConfirmedDesc}
            </p>
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
