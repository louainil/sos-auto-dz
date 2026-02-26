import React, { useState, useMemo } from 'react';
import { X, Mail, Lock, User as UserIcon, Briefcase, Phone, MapPin, Check, ChevronRight, Shield, Wrench, Truck, ShoppingBag, Navigation, Settings, FileText, Clock, Calendar } from 'lucide-react';
import { UserRole, GarageType, User } from '../types';
import { WILAYAS, COMMUNES, CAR_BRANDS } from '../constants';
import { authAPI } from '../api';
import { Language, translations } from '../translations';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'LOGIN' | 'SIGNUP';
  onLoginSuccess: (user: User) => void;
  language?: Language;
  resetToken?: string;
  resetEmail?: string;
}

const DAYS = [
  { id: 0, label: 'Sun' },
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
];

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'LOGIN', onLoginSuccess, language = 'en', resetToken, resetEmail }) => {
  const t = translations[language];
  const [isLogin, setIsLogin] = useState(initialMode === 'LOGIN');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.CLIENT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Forgot / Reset password state
  type ModalView = 'AUTH' | 'FORGOT_PASSWORD' | 'FORGOT_SUCCESS' | 'RESET_PASSWORD' | 'RESET_SUCCESS';
  const [view, setView] = useState<ModalView>(resetToken ? 'RESET_PASSWORD' : 'AUTH');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  // Professional Registration State
  const [selectedWilaya, setSelectedWilaya] = useState<number | ''>('');
  const [selectedCommune, setSelectedCommune] = useState<string>('');
  const [selectedGarageType, setSelectedGarageType] = useState<GarageType | ''>('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brandSearch, setBrandSearch] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  
  // Schedule State
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 6]); // Default Sun-Thu + Sat
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');

  if (!isOpen) return null;

  const handleModeSwitch = (login: boolean) => {
    setIsLogin(login);
    setError('');
    setView('AUTH');
    if (login) setSelectedRole(UserRole.CLIENT); // Reset role on switch to login
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        // Login
        const data = await authAPI.login(email, password);
        const user: User = {
          id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          phone: data.phone,
          garageType: data.garageType,
          wilayaId: data.wilayaId,
          commune: data.commune,
          isAvailable: data.isAvailable,
          avatar: data.avatar
        };
        onLoginSuccess(user);
        onClose();
      } else {
        // Register
        const isPro = selectedRole !== UserRole.CLIENT && selectedRole !== UserRole.ADMIN;
        const userData = {
          name,
          email,
          password,
          role: selectedRole,
          phone: isPro ? phone : undefined,
          garageType: selectedRole === UserRole.MECHANIC ? selectedGarageType : undefined,
          wilayaId: isPro ? selectedWilaya : undefined,
          commune: isPro ? selectedCommune : undefined,
          // Professional-only fields
          description: isPro && description.trim() ? description.trim() : undefined,
          specialty: isPro ? selectedBrands : undefined,
          workingDays: isPro ? selectedDays : undefined,
          workingHours: isPro ? { start: startTime, end: endTime } : undefined
        };
        
        const data = await authAPI.register(userData);
        const user: User = {
          id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          phone: data.phone,
          garageType: data.garageType,
          wilayaId: data.wilayaId,
          commune: data.commune,
          isAvailable: data.isAvailable,
          avatar: data.avatar
        };
        onLoginSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await authAPI.forgotPassword(forgotEmail);
      setView('FORGOT_SUCCESS');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (resetNewPassword.length < 6) {
      setError(t.passwordMinLength);
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setError(t.passwordsDoNotMatch);
      return;
    }
    setIsLoading(true);
    try {
      await authAPI.resetPassword(resetToken || '', resetEmail || '', resetNewPassword);
      setView('RESET_SUCCESS');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return <Shield size={16} />;
      case UserRole.MECHANIC: return <Wrench size={16} />;
      case UserRole.PARTS_SHOP: return <ShoppingBag size={16} />;
      case UserRole.TOWING: return <Truck size={16} />;
      default: return <UserIcon size={16} />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.MECHANIC: return t.roleGarage;
      case UserRole.PARTS_SHOP: return t.rolePartsShop;
      case UserRole.TOWING: return t.roleTowing;
      default: return t.roleClient;
    }
  };

  // Filtered brands logic
  const filteredBrands = CAR_BRANDS.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()));

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const toggleAllBrands = () => {
    if (selectedBrands.length === CAR_BRANDS.length) {
      setSelectedBrands([]);
    } else {
      setSelectedBrands([...CAR_BRANDS]);
    }
  };

  const availableCommunes = selectedWilaya !== '' ? COMMUNES[selectedWilaya as number] || [] : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative border border-slate-200 dark:border-slate-800 my-8 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-20">
             <h3 className="font-bold text-slate-800 dark:text-white">
                {view === 'AUTH' ? (isLogin ? t.signInTitle : t.createAccountTitle) 
                 : view === 'FORGOT_PASSWORD' || view === 'FORGOT_SUCCESS' ? t.forgotPasswordTitle
                 : view === 'RESET_PASSWORD' || view === 'RESET_SUCCESS' ? t.resetPasswordTitle
                 : t.signInTitle}
             </h3>
            <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
                <X size={24} />
            </button>
        </div>

        <div className="overflow-y-auto p-6 md:p-8 flex-1">

        {/* ── Forgot Password: enter email ── */}
        {view === 'FORGOT_PASSWORD' && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-blue-600 dark:text-blue-400" size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t.forgotPasswordTitle}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{t.forgotPasswordSubtitle}</p>
              {error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
            <form className="space-y-4" onSubmit={handleForgotPassword}>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.emailAddress}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <input
                    required
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? t.sendingResetLink : t.sendResetLink} <ChevronRight size={18} />
              </button>
            </form>
            <p
              className="mt-4 text-center text-xs text-slate-400 hover:text-blue-500 cursor-pointer transition-colors"
              onClick={() => { setError(''); setView('AUTH'); setIsLogin(true); }}
            >
              {t.backToLogin}
            </p>
          </div>
        )}

        {/* ── Forgot Password: success / check email ── */}
        {view === 'FORGOT_SUCCESS' && (
          <div className="animate-fade-in text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="text-green-600 dark:text-green-400" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t.resetLinkSent}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{t.resetLinkSentDesc}</p>
            <button
              type="button"
              onClick={() => { setError(''); setView('AUTH'); setIsLogin(true); }}
              className="w-full py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {t.backToLogin} <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ── Reset Password: enter new password (from email link) ── */}
        {view === 'RESET_PASSWORD' && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="text-blue-600 dark:text-blue-400" size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t.resetPasswordTitle}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{t.resetPasswordSubtitle}</p>
              {error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.newPassword}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <input
                    required
                    type="password"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.confirmNewPassword}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <input
                    required
                    type="password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? t.resettingPassword : t.resetPassword} <ChevronRight size={18} />
              </button>
            </form>
          </div>
        )}

        {/* ── Reset Password: success ── */}
        {view === 'RESET_SUCCESS' && (
          <div className="animate-fade-in text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="text-green-600 dark:text-green-400" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t.passwordResetSuccess}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{t.passwordResetSuccessDesc}</p>
            <button
              type="button"
              onClick={() => { setError(''); setView('AUTH'); setIsLogin(true); }}
              className="w-full py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {t.backToLogin} <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ── Normal Auth (Login / Signup) ── */}
        {view === 'AUTH' && (<>
          {/* Tab Switcher */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => handleModeSwitch(true)}
              className={`flex-1 py-3 text-sm font-bold tracking-wide transition-colors ${
                isLogin 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-slate-800' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t.signInTab}
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch(false)}
              className={`flex-1 py-3 text-sm font-bold tracking-wide transition-colors ${
                !isLogin 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-slate-800' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t.signUpTab}
            </button>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {isLogin ? t.welcomeBack : t.joinTitle}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {isLogin 
                ? t.signInSubtitle
                : t.signUpSubtitle}
            </p>
            {error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            
            {/* Unified Sign In doesn't need role selection visually, but Sign Up does */}
            {!isLogin && (
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">{t.iAmA}</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(UserRole)
                    .filter(role => role !== UserRole.ADMIN) // Filter out ADMIN from signup
                    .map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all text-left ${
                        selectedRole === role 
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-600' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className={selectedRole === role ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}>
                        {getRoleIcon(role)}
                      </span>
                      <span>{getRoleLabel(role)}</span>
                      {selectedRole === role && <Check size={14} className="ml-auto text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {!isLogin && selectedRole !== UserRole.CLIENT ? t.businessName : t.fullName}
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <input 
                    required={!isLogin}
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder={!isLogin && selectedRole !== UserRole.CLIENT ? "Auto Repair Pro" : "John Doe"}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.emailAddress}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.password}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Extra Fields for Professionals during Sign Up */}
            {!isLogin && selectedRole !== UserRole.CLIENT && selectedRole !== UserRole.ADMIN && (
              <div className="space-y-4 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 animate-fade-in bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                    <Briefcase size={16} className="text-blue-500" />
                    {t.businessDetails}
                </h4>

                {/* Mechanic Specific: Garage Type */}
                {selectedRole === UserRole.MECHANIC && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.garageType}</label>
                    <div className="relative">
                      <Settings className="absolute left-3 top-2.5 text-slate-400" size={18} />
                      <select 
                        required 
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer"
                        value={selectedGarageType}
                        onChange={(e) => setSelectedGarageType(e.target.value as GarageType)}
                      >
                        <option value="">{t.selectType}</option>
                        <option value="MECHANIC">{t.generalMechanic}</option>
                        <option value="ELECTRICIAN">{t.autoElectrician}</option>
                        <option value="AUTO_BODY">{t.autoBodyPaint}</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Work Schedule - Hide for Towing (24/7) */}
                {selectedRole !== UserRole.TOWING && (
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.workSchedule}</label>
                     
                     {/* Days */}
                     <div className="flex justify-between mb-3">
                       {DAYS.map(day => (
                         <button
                           key={day.id}
                           type="button"
                           onClick={() => toggleDay(day.id)}
                           className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                             selectedDays.includes(day.id) 
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                              : 'bg-white dark:bg-slate-700 text-slate-400 border border-slate-200 dark:border-slate-600'
                           }`}
                         >
                           {day.label[0]}
                         </button>
                       ))}
                     </div>

                     {/* Hours */}
                     <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">{t.startTime}</label>
                          <input 
                            type="time" 
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">{t.endTime}</label>
                          <input 
                            type="time" 
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                          />
                        </div>
                     </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.wilaya}</label>
                        <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <select 
                            required
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer"
                            value={selectedWilaya}
                            onChange={(e) => {
                                setSelectedWilaya(Number(e.target.value));
                                setSelectedCommune(''); // Reset commune
                            }}
                        >
                            <option value="">{t.selectPlaceholder}</option>
                            {WILAYAS.map(w => (
                                <option key={w.id} value={w.id}>{w.id} - {w.name}</option>
                            ))}
                        </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.commune}</label>
                        <div className="relative">
                        <Navigation className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <select 
                            required
                            disabled={!selectedWilaya}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer disabled:opacity-50"
                            value={selectedCommune}
                            onChange={(e) => setSelectedCommune(e.target.value)}
                        >
                        <option value="">{t.selectPlaceholder}</option>
                            {availableCommunes.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.phoneLabel}</label>
                    <div className="relative">
                    <Phone className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                        required
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        placeholder="0550..."
                    />
                    </div>
                </div>

                {/* Optional Description for Professionals */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t.description} <span className="text-slate-400 text-xs font-normal">({t.optional})</span>
                    </label>
                    <div className="relative">
                    <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
                    <textarea 
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none h-20 custom-scrollbar"
                    placeholder={t.descriptionPlaceholder}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    </div>
                </div>

                {/* Mechanic & Spare Parts: Car Brands Multi-Select */}
                {(selectedRole === UserRole.MECHANIC || selectedRole === UserRole.PARTS_SHOP) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.supportedBrands}</label>
                    
                    <div className="mb-2">
                        <input 
                            type="text"
                            placeholder={t.searchBrands}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                            value={brandSearch}
                            onChange={e => setBrandSearch(e.target.value)}
                        />
                    </div>

                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-2 max-h-40 overflow-y-auto bg-white dark:bg-slate-800 custom-scrollbar">
                        <div className="flex flex-wrap gap-2">
                            <button 
                                type="button"
                                onClick={toggleAllBrands}
                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                                    selectedBrands.length === CAR_BRANDS.length 
                                    ? 'bg-blue-600 text-white border-blue-600' 
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                            >
                                {selectedBrands.length === CAR_BRANDS.length ? t.unselectAll : t.selectAll}
                            </button>
                            
                            {filteredBrands.map(brand => (
                                <button
                                    key={brand}
                                    type="button"
                                    onClick={() => toggleBrand(brand)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                        selectedBrands.includes(brand) 
                                        ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700' 
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                                    }`}
                                >
                                    {brand}
                                </button>
                            ))}
                            {filteredBrands.length === 0 && (
                                <p className="text-xs text-slate-400 w-full text-center py-2">{t.noBrandsFoundShort}</p>
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 text-right">
                        {selectedBrands.length} {t.brandsSelected}
                    </p>
                  </div>
                )}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isLoading ? t.processing : (isLogin ? t.signInTitle : t.createAccountTitle)} <ChevronRight size={18} />
            </button>
          </form>

          {isLogin && (
              <p 
                className="mt-4 text-center text-xs text-slate-400 hover:text-blue-500 cursor-pointer transition-colors"
                onClick={() => { setError(''); setView('FORGOT_PASSWORD'); }}
              >
                  {t.forgotPassword}
              </p>
          )}
        </>)}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;