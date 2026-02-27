import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { authAPI } from '../api';
import { Language, translations } from '../translations';

interface VerifyEmailProps {
  language?: Language;
  onOpenLogin?: () => void;
}

const VerifyEmail: React.FC<VerifyEmailProps> = ({ language = 'en', onOpenLogin }) => {
  const t = translations[language];
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    const verify = async () => {
      if (!token || !email) {
        setStatus('error');
        setMessage(t.verifyEmailExpired);
        return;
      }

      try {
        const data = await authAPI.verifyEmail(token, email);
        setStatus('success');
        setMessage(data.message || t.verifyEmailSuccessDesc);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || t.verifyEmailExpired);
      }
    };

    verify();
  }, [token, email]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="text-blue-600 dark:text-blue-400 animate-spin" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t.verifyEmailVerifying}</h2>
          </div>
        )}

        {status === 'success' && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600 dark:text-green-400" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t.verifyEmailSuccess}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{t.verifyEmailSuccessDesc}</p>
            <button
              onClick={() => {
                if (onOpenLogin) onOpenLogin();
                navigate('/');
              }}
              className="w-full py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-600/20"
            >
              {t.goToLogin}
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="text-red-600 dark:text-red-400" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t.verifyEmailFailed}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-600/20"
            >
              {t.home}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
