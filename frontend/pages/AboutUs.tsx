import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Zap, Shield, Eye, Car, Heart } from 'lucide-react';
import { Language, translations } from '../translations';

interface AboutUsProps {
  language: Language;
}

const AboutUs: React.FC<AboutUsProps> = ({ language }) => {
  const t = translations[language];
  const isRTL = language === 'ar';

  return (
    <div className={`min-h-screen bg-white dark:bg-slate-950 ${isRTL ? 'rtl' : ''}`}>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-700 via-red-600 to-red-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-black rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-red-200 hover:text-white mb-8 transition-colors text-sm">
            <ArrowLeft size={16} />
            <span>{t.backToHome}</span>
          </Link>
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
              <Car size={40} />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            {t.aboutHeroTitle}
          </h1>
          <p className="text-lg md:text-xl text-red-100 max-w-2xl mx-auto leading-relaxed">
            {t.aboutHeroSubtitle}
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
              {t.aboutMissionTitle}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
              {t.aboutMissionText}
            </p>
          </div>
          <div className="relative bg-slate-900 dark:bg-slate-800 rounded-2xl p-8 md:p-12 text-center">
            <Heart className="mx-auto text-red-500 mb-4" size={36} />
            <blockquote className="text-2xl md:text-3xl font-bold text-white italic">
              "{t.aboutMissionQuote}"
            </blockquote>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white text-center mb-14">
            {t.aboutOurValues}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Speed */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow border border-slate-100 dark:border-slate-700">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-xl w-fit mb-5">
                <Zap className="text-red-600 dark:text-red-400" size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                {t.aboutValueSpeed}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {t.aboutValueSpeedDesc}
              </p>
            </div>

            {/* Reliability */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow border border-slate-100 dark:border-slate-700">
              <div className="bg-slate-900 dark:bg-white/10 p-3 rounded-xl w-fit mb-5">
                <Shield className="text-white dark:text-white" size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                {t.aboutValueReliability}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {t.aboutValueReliabilityDesc}
              </p>
            </div>

            {/* Transparency */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow border border-slate-100 dark:border-slate-700">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-xl w-fit mb-5">
                <Eye className="text-red-600 dark:text-red-400" size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                {t.aboutValueTransparency}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {t.aboutValueTransparencyDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white text-center mb-12">
            {t.aboutStoryTitle}
          </h2>
          <div className="space-y-6">
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.aboutStoryP1}
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.aboutStoryP2}
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.aboutStoryP3}
            </p>
          </div>

          {/* CTA */}
          <div className="mt-14 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg shadow-red-600/20"
            >
              <Car size={22} />
              {t.findGarage}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
