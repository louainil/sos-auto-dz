import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, CalendarCheck, Star, Gift, Briefcase, Phone, MessageCircle, MapPin, ChevronDown, CheckCircle } from 'lucide-react';
import { Language, translations } from '../translations';
import { WILAYAS } from '../constants';

interface ForProfessionalsProps {
  language: Language;
}

const ForProfessionals: React.FC<ForProfessionalsProps> = ({ language }) => {
  const t = translations[language];
  const isRTL = language === 'ar';

  const [formData, setFormData] = useState({
    businessName: '',
    type: '',
    wilaya: '',
    phone: '',
    whatsapp: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  const benefits = [
    { icon: Users, title: t.proBenefit1Title, desc: t.proBenefit1Desc, color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
    { icon: CalendarCheck, title: t.proBenefit2Title, desc: t.proBenefit2Desc, color: 'bg-slate-900 dark:bg-white/10 text-white' },
    { icon: Star, title: t.proBenefit3Title, desc: t.proBenefit3Desc, color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
    { icon: Gift, title: t.proBenefit4Title, desc: t.proBenefit4Desc, color: 'bg-slate-900 dark:bg-white/10 text-white' },
  ];

  const businessTypes = [
    { value: 'garage', label: t.proTypeGarage },
    { value: 'parts_shop', label: t.proTypePartsShop },
    { value: 'towing', label: t.proTypeTowing },
    { value: 'mechanic', label: t.proTypeMechanic },
  ];

  return (
    <div className={`min-h-screen bg-white dark:bg-slate-950 ${isRTL ? 'rtl' : ''}`}>
      {/* Hero Banner */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-800 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors text-sm">
            <ArrowLeft size={16} />
            <span>{t.backToHome}</span>
          </Link>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-red-600/20 text-red-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Briefcase size={16} />
              {t.forProfessionals}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
              {t.proBannerTitle}
            </h1>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed">
              {t.proBannerSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white text-center mb-14">
            {t.proBenefitsTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((b, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow border border-slate-100 dark:border-slate-700">
                <div className={`p-3 rounded-xl w-fit mb-5 ${b.color}`}>
                  <b.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{b.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {t.proFormTitle}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              {t.proFormSubtitle}
            </p>
          </div>

          {submitted ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-10 text-center">
              <CheckCircle className="mx-auto text-green-600 dark:text-green-400 mb-4" size={48} />
              <p className="text-lg font-semibold text-green-800 dark:text-green-300">{t.proSuccess}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 md:p-10 shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  <Briefcase size={14} className="inline mr-1.5 -mt-0.5" />
                  {t.proFieldBusinessName}
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  placeholder={t.proFieldBusinessName}
                />
              </div>

              {/* Business Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  {t.proFieldType}
                </label>
                <div className="relative">
                  <select
                    required
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none appearance-none transition-all"
                  >
                    <option value="">{t.proSelectType}</option>
                    {businessTypes.map(bt => (
                      <option key={bt.value} value={bt.value}>{bt.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Wilaya */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  <MapPin size={14} className="inline mr-1.5 -mt-0.5" />
                  {t.proFieldWilaya}
                </label>
                <div className="relative">
                  <select
                    required
                    value={formData.wilaya}
                    onChange={e => setFormData({ ...formData, wilaya: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none appearance-none transition-all"
                  >
                    <option value="">{t.proSelectWilaya}</option>
                    {WILAYAS.map(w => (
                      <option key={w.id} value={w.name}>{w.id} - {w.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Phone & WhatsApp row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                    <Phone size={14} className="inline mr-1.5 -mt-0.5" />
                    {t.proFieldPhone}
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                    placeholder="07XX XX XX XX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                    <MessageCircle size={14} className="inline mr-1.5 -mt-0.5" />
                    {t.proFieldWhatsApp}
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                    placeholder="07XX XX XX XX"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-xl text-lg transition-colors shadow-lg shadow-red-600/20"
              >
                {submitting ? t.proSubmitting : t.proSubmit}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default ForProfessionals;
