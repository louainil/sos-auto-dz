import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Car, LogIn, Moon, Sun, Bell, User as UserIcon, LayoutDashboard, LogOut, Languages } from 'lucide-react';
import { NAV_LINKS } from '../constants';
import { PageView, User, Notification } from '../types';
import { Language, translations } from '../translations';
import NotificationDropdown from './NotificationDropdown';

interface NavbarProps {
  currentView: PageView;
  onChangeView: (view: PageView) => void;
  onLoginClick: () => void;
  onProClick: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  user: User | null;
  onLogout: () => void;
  notifications: Notification[];
  onMarkNotificationRead: (id: string) => void;
  onClearNotifications: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  currentView, 
  onChangeView, 
  onLoginClick, 
  onProClick, 
  isDarkMode, 
  toggleTheme,
  language,
  onLanguageChange,
  user, 
  onLogout,
  notifications,
  onMarkNotificationRead,
  onClearNotifications
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const t = translations[language];

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div 
            className="flex-shrink-0 flex items-center gap-2 cursor-pointer group" 
            onClick={() => onChangeView(PageView.HOME)}
          >
            <div className="bg-blue-600 p-1.5 rounded-lg text-white group-hover:bg-blue-500 transition-colors">
              <Car size={24} />
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">SOS Auto <span className="text-blue-600 dark:text-blue-400">DZ</span></span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => onChangeView(PageView.HOME)}
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                currentView === PageView.HOME
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.home}
            </button>
            <button
              onClick={() => onChangeView(PageView.GARAGE)}
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                currentView === PageView.GARAGE
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.garage}
            </button>
            <button
              onClick={() => onChangeView(PageView.PARTS)}
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                currentView === PageView.PARTS
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.spareParts}
            </button>
            <button
              onClick={() => onChangeView(PageView.TOWING)}
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                currentView === PageView.TOWING
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.towing}
            </button>
            {user && (
              <button
                onClick={() => onChangeView(PageView.DASHBOARD)}
                className={`text-sm font-medium transition-colors whitespace-nowrap ${
                  currentView === PageView.DASHBOARD 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.dashboard}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Languages size={20} />
              </button>
              {isLangMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsLangMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-20 animate-fade-in">
                    <button
                      onClick={() => { onLanguageChange('en'); setIsLangMenuOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 ${
                        language === 'en' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {t.english}
                    </button>
                    <button
                      onClick={() => { onLanguageChange('fr'); setIsLangMenuOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 ${
                        language === 'fr' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {t.french}
                    </button>
                    <button
                      onClick={() => { onLanguageChange('ar'); setIsLangMenuOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 ${
                        language === 'ar' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {t.arabic}
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button 
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
                    )}
                  </button>
                  {isNotifOpen && (
                    <NotificationDropdown 
                      notifications={notifications} 
                      onMarkAsRead={onMarkNotificationRead}
                      onClearAll={onClearNotifications}
                      onClose={() => setIsNotifOpen(false)}
                      language={language}
                    />
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                   <button 
                     onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                     className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                   >
                     <div className="w-7 h-7 bg-blue-600 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                       {user.avatar?.url
                         ? <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
                         : user.name.charAt(0)}
                     </div>
                     <span className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[100px] truncate">{user.name}</span>
                   </button>
                   
                   {isUserMenuOpen && (
                     <>
                     <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)}></div>
                     <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-20 animate-fade-in">
                       <button 
                         onClick={() => { onChangeView(PageView.DASHBOARD); setIsUserMenuOpen(false); }}
                         className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                       >
                         <LayoutDashboard size={16} /> {t.dashboard}
                       </button>
                       <button 
                         onClick={() => { onLogout(); setIsUserMenuOpen(false); }}
                         className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                       >
                         <LogOut size={16} /> {t.signOut}
                       </button>
                     </div>
                     </>
                   )}
                </div>
              </>
            ) : (
              <button 
                onClick={onLoginClick}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
              >
                <LogIn size={18} />
                {t.signIn}
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
             {/* Language Selector Mobile */}
             <div className="relative">
               <button
                 onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                 className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
               >
                 <Languages size={20} />
               </button>
               {isLangMenuOpen && (
                 <>
                   <div className="fixed inset-0 z-10" onClick={() => setIsLangMenuOpen(false)}></div>
                   <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-20 animate-fade-in">
                     <button
                       onClick={() => { onLanguageChange('en'); setIsLangMenuOpen(false); }}
                       className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                         language === 'en' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                       }`}
                     >
                       {t.english}
                     </button>
                     <button
                       onClick={() => { onLanguageChange('fr'); setIsLangMenuOpen(false); }}
                       className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                         language === 'fr' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                       }`}
                     >
                       {t.french}
                     </button>
                     <button
                       onClick={() => { onLanguageChange('ar'); setIsLangMenuOpen(false); }}
                       className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                         language === 'ar' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                       }`}
                     >
                       {t.arabic}
                     </button>
                   </div>
                 </>
               )}
             </div>
             <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {user && (
              <div className="relative">
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
                  )}
                </button>
                {isNotifOpen && (
                  <NotificationDropdown 
                    notifications={notifications} 
                    onMarkAsRead={onMarkNotificationRead}
                    onClearAll={onClearNotifications}
                    onClose={() => setIsNotifOpen(false)}
                    language={language}
                  />
                )}
              </div>
            )}
            {user && (
              <button 
                 onClick={() => { onChangeView(PageView.DASHBOARD); setIsMobileMenuOpen(false); }}
                 className="p-2 rounded-full text-slate-500 dark:text-slate-400"
              >
                <LayoutDashboard size={20} />
              </button>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 animate-fade-in shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button
              onClick={() => {
                onChangeView(PageView.HOME);
                setIsMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                currentView === PageView.HOME
                  ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.home}
            </button>
            <button
              onClick={() => {
                onChangeView(PageView.GARAGE);
                setIsMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                currentView === PageView.GARAGE
                  ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.garage}
            </button>
            <button
              onClick={() => {
                onChangeView(PageView.PARTS);
                setIsMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                currentView === PageView.PARTS
                  ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.spareParts}
            </button>
            <button
              onClick={() => {
                onChangeView(PageView.TOWING);
                setIsMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                currentView === PageView.TOWING
                  ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.towing}
            </button>
            {user && (
              <button
                onClick={() => { onChangeView(PageView.DASHBOARD); setIsMobileMenuOpen(false); }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  currentView === PageView.DASHBOARD
                    ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {t.dashboard}
              </button>
            )}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3 space-y-2">
              {user ? (
                <>
                  {/* User info row */}
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-10 h-10 rounded-full bg-blue-600 overflow-hidden flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {user.avatar?.url
                        ? <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
                        : user.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <LogOut size={18} />
                    {t.signOut}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => {
                     onLoginClick();
                     setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  <LogIn size={18} />
                  {t.signIn}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;