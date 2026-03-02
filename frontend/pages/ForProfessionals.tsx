import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, CalendarCheck, Star, Gift, Briefcase } from 'lucide-react';
import { Language, translations } from '../translations';

interface ForProfessionalsProps {
  language: Language;
  onOpenSignUp: () => void;
}

const ForProfessionals: React.FC<ForProfessionalsProps> = ({ language, onOpenSignUp }) => {
  const t = translations[language];
  const isRTL = language === 'ar';

  const benefits = [
    { icon: Users, title: t.proBenefit1Title, desc: t.proBenefit1Desc, color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
    { icon: CalendarCheck, title: t.proBenefit2Title, desc: t.proBenefit2Desc, color: 'bg-slate-900 dark:bg-white/10 text-white' },
    { icon: Star, title: t.proBenefit3Title, desc: t.proBenefit3Desc, color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
    { icon: Gift, title: t.proBenefit4Title, desc: t.proBenefit4Desc, color: 'bg-slate-900 dark:bg-white/10 text-white' },
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

      {/* CTA Section */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {t.proFormTitle}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-10">
            {t.proFormSubtitle}
          </p>
          <button
            onClick={onOpenSignUp}
            className="inline-flex items-center gap-3 px-10 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-lg transition-colors shadow-lg shadow-red-600/20"
          >
            <Briefcase size={20} />
            {t.proSubmit}
          </button>
        </div>
      </section>
    </div>
  );
};

export default ForProfessionals;
