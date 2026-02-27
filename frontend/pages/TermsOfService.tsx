import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Language, translations } from '../translations';

interface TermsOfServiceProps {
  language: Language;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ language }) => {
  const t = translations[language];
  const isRTL = language === 'ar';

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 py-12 ${isRTL ? 'rtl' : ''}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 transition-colors">
          <ArrowLeft size={18} />
          <span>{t.backToHome}</span>
        </Link>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-xl">
              <FileText className="text-blue-600 dark:text-blue-400" size={28} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t.termsOfService}</h1>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">{t.lastUpdated}: {t.termsLastUpdated}</p>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{t.termsAcceptanceTitle}</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t.termsAcceptanceText}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{t.termsDescriptionTitle}</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t.termsDescriptionText}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{t.termsAccountsTitle}</h2>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1.5">
                <li>{t.termsAccountsItem1}</li>
                <li>{t.termsAccountsItem2}</li>
                <li>{t.termsAccountsItem3}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{t.termsBookingsTitle}</h2>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1.5">
                <li>{t.termsBookingsItem1}</li>
                <li>{t.termsBookingsItem2}</li>
                <li>{t.termsBookingsItem3}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{t.termsProvidersTitle}</h2>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1.5">
                <li>{t.termsProvidersItem1}</li>
                <li>{t.termsProvidersItem2}</li>
                <li>{t.termsProvidersItem3}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{t.termsLiabilityTitle}</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t.termsLiabilityText}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{t.termsChangesTitle}</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{t.termsChangesText}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{t.termsContactTitle}</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {t.termsContactText} <a href="mailto:nedjari088@gmail.com" className="text-blue-600 hover:underline">nedjari088@gmail.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
