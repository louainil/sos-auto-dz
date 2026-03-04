import React from 'react';
import { Link } from 'react-router-dom';
import { Language, translations } from '../translations';

interface NotFoundProps {
  language?: Language;
}

const NotFound: React.FC<NotFoundProps> = ({ language = 'en' }) => {
  const t = translations[language];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-extrabold text-blue-600 dark:text-blue-400 leading-none select-none">
        404
      </p>
      <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
        {t.notFoundTitle}
      </h1>
      <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-sm">
        {t.notFoundMessage}
      </p>
      <Link
        to="/"
        className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/20"
      >
        {t.backToHome}
      </Link>
    </div>
  );
};

export default NotFound;
