import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Crown, Sparkles, Car } from 'lucide-react';
import { Language, translations } from '../translations';

interface PricingProps {
  language: Language;
}

const Pricing: React.FC<PricingProps> = ({ language }) => {
  const t = translations[language];
  const isRTL = language === 'ar';

  const plans = [
    {
      title: t.pricingFreeTitle,
      price: t.pricingFreePrice,
      desc: t.pricingFreeDesc,
      features: [t.pricingFreeFeat1, t.pricingFreeFeat2, t.pricingFreeFeat3, t.pricingFreeFeat4],
      cta: t.pricingFreeCta,
      popular: false,
      style: {
        card: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
        badge: '',
        price: 'text-slate-900 dark:text-white',
        button: 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white',
        check: 'text-slate-600 dark:text-slate-400',
      },
    },
    {
      title: t.pricingProTitle,
      price: t.pricingProPrice,
      desc: t.pricingProDesc,
      features: [t.pricingProFeat1, t.pricingProFeat2, t.pricingProFeat3, t.pricingProFeat4, t.pricingProFeat5],
      cta: t.pricingProCta,
      popular: true,
      style: {
        card: 'bg-red-600 text-white border-2 border-red-500 shadow-2xl shadow-red-600/20 scale-[1.03] md:scale-105',
        badge: 'bg-white text-red-600',
        price: 'text-white',
        button: 'bg-white hover:bg-red-50 text-red-600 font-bold',
        check: 'text-red-200',
      },
    },
    {
      title: t.pricingPremiumTitle,
      price: t.pricingPremiumPrice,
      desc: t.pricingPremiumDesc,
      features: [t.pricingPremiumFeat1, t.pricingPremiumFeat2, t.pricingPremiumFeat3, t.pricingPremiumFeat4, t.pricingPremiumFeat5, t.pricingPremiumFeat6],
      cta: t.pricingPremiumCta,
      popular: false,
      style: {
        card: 'bg-slate-900 dark:bg-slate-800 text-white border border-slate-700',
        badge: '',
        price: 'text-white',
        button: 'bg-red-600 hover:bg-red-700 text-white',
        check: 'text-slate-400',
      },
    },
  ];

  return (
    <div className={`min-h-screen bg-white dark:bg-slate-950 ${isRTL ? 'rtl' : ''}`}>
      {/* Header */}
      <section className="bg-slate-50 dark:bg-slate-900 pt-10 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 mb-10 transition-colors text-sm">
            <ArrowLeft size={16} />
            <span>{t.backToHome}</span>
          </Link>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles size={16} />
              {t.pricing}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-5">
              {t.pricingTitle}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              {t.pricingSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`rounded-2xl p-8 transition-all relative ${plan.style.card}`}
            >
              {plan.popular && (
                <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold ${plan.style.badge} flex items-center gap-1`}>
                  <Crown size={12} />
                  {t.pricingMostPopular}
                </div>
              )}

              <h3 className={`text-xl font-bold mb-2 ${plan.popular ? '' : 'text-slate-900 dark:text-white'}`}>
                {plan.title}
              </h3>
              <p className={`text-sm mb-6 ${plan.popular ? 'text-red-100' : 'text-slate-500 dark:text-slate-400'}`}>
                {plan.desc}
              </p>

              <div className={`mb-8 ${plan.style.price}`}>
                <span className="text-4xl font-extrabold">{plan.price}</span>
                {plan.price !== t.pricingFreePrice && (
                  <span className={`text-sm ml-1 ${plan.popular ? 'text-red-200' : 'text-slate-500 dark:text-slate-400'}`}>
                    {t.pricingPerMonth}
                  </span>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <Check size={18} className={`mt-0.5 shrink-0 ${plan.popular ? 'text-red-200' : plan.style.check}`} />
                    <span className={plan.popular ? 'text-white/90' : ''}>{feat}</span>
                  </li>
                ))}
              </ul>

              <button className={`w-full py-3.5 rounded-xl font-semibold transition-colors text-sm ${plan.style.button}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Drivers Note */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 md:p-10 text-center border border-slate-100 dark:border-slate-700">
            <Car className="mx-auto text-red-600 dark:text-red-400 mb-4" size={36} />
            <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
              {t.pricingDriversNote}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
