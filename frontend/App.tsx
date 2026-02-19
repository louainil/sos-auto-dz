import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ServicesPage from './pages/ServicesPage';
import { Dashboard } from './pages/Dashboard';
import BookingModal from './components/BookingModal';
import AuthModal from './components/AuthModal';
import { PageView, ServiceProvider, UserRole, User, Notification } from './types';
import { Language, translations } from './translations';
import { notificationsAPI, authAPI } from './api';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<PageView>(PageView.HOME);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // Auth & User State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Dark Mode State - Default to true
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Language State - Default to English
  const [language, setLanguage] = useState<Language>('en');

  // Apply Dark Mode Class to HTML tag
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  // Apply RTL direction for Arabic
  useEffect(() => {
    const root = window.document.documentElement;
    if (language === 'ar') {
      root.setAttribute('dir', 'rtl');
    } else {
      root.setAttribute('dir', 'ltr');
    }
  }, [language]);

  // Check for existing auth token and fetch user data
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authAPI.getCurrentUser();
          const userObj: User = {
            id: userData._id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            phone: userData.phone,
            garageType: userData.garageType,
            wilayaId: userData.wilayaId,
            commune: userData.commune,
            isAvailable: userData.isAvailable,
            avatar: userData.avatar
          };
          setUser(userObj);
          // Fetch notifications
          const notifs = await notificationsAPI.getAll();
          setNotifications(notifs.map((n: any) => ({
            id: n._id,
            title: n.title,
            message: n.message,
            type: n.type,
            isRead: n.isRead,
            timestamp: new Date(n.timestamp)
          })));
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
        }
      }
    };
    checkAuth();
  }, []);

  // Attempt to get user location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("Location access denied or error:", error);
          // Default to Algiers center if permission denied or error
          setUserLocation({ lat: 36.7528, lng: 3.0420 }); 
        }
      );
    }
  }, []);

  const handleViewChange = (view: PageView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBook = (provider: ServiceProvider) => {
    if (!user) {
      setAuthInitialMode('LOGIN');
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedProvider(provider);
  };

  // Unified Login Button Handler
  const handleLoginClick = () => {
    setAuthInitialMode('LOGIN');
    setIsAuthModalOpen(true);
  };

  // "For Mechanics" now just opens Sign Up
  const handleProClick = () => {
    setAuthInitialMode('SIGNUP');
    setIsAuthModalOpen(true);
  };

  // Handle successful login
  const handleLoginSuccess = async (loggedInUser: User) => {
    setUser(loggedInUser);
    
    // Fetch notifications from backend
    try {
      const notifs = await notificationsAPI.getAll();
      setNotifications(notifs.map((n: any) => ({
        id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        timestamp: new Date(n.timestamp)
      })));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }

    // Redirect logic could be here, but sticking to current view or Dashboard if pro
    if (loggedInUser.role !== UserRole.CLIENT) {
      setCurrentView(PageView.DASHBOARD);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    setNotifications([]);
    setCurrentView(PageView.HOME);
  };

  const handleMarkNotifRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await notificationsAPI.clearAll();
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case PageView.HOME:
        return <Home onChangeView={handleViewChange} language={language} />;
      case PageView.GARAGE:
        return (
          <ServicesPage 
            key="garage"
            type={UserRole.MECHANIC} 
            title="Garage Services" 
            subtitle="Find trusted Mechanics, Electricians, and Auto Body Technicians."
            userLocation={userLocation}
            onBook={handleBook}
            language={language}
          />
        );
      case PageView.PARTS:
        return (
          <ServicesPage 
            key="parts"
            type={UserRole.PARTS_SHOP} 
            title="Spare Parts Shops" 
            subtitle="Locate authentic spare parts dealers for all car makes and models."
            userLocation={userLocation}
            onBook={handleBook}
            language={language}
          />
        );
      case PageView.TOWING:
        return (
          <ServicesPage 
            key="towing"
            type={UserRole.TOWING} 
            title="Roadside Assistance" 
            subtitle="24/7 towing and emergency recovery services near you."
            userLocation={userLocation}
            onBook={handleBook}
            language={language}
          />
        );
      case PageView.DASHBOARD:
        return user ? (
           <Dashboard user={user} onLogout={handleLogout} onUserUpdate={setUser} language={language} />
        ) : (
           <Home onChangeView={handleViewChange} language={language} /> // Fallback if manually navigating
        );
      default:
        return <Home onChangeView={handleViewChange} language={language} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <Navbar 
        currentView={currentView} 
        onChangeView={handleViewChange} 
        onLoginClick={handleLoginClick}
        onProClick={handleProClick}
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
        language={language}
        onLanguageChange={setLanguage}
        user={user}
        onLogout={handleLogout}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotifRead}
        onClearNotifications={handleClearNotifications}
      />
      
      <main className="flex-grow">
        {renderContent()}
      </main>

      {currentView !== PageView.DASHBOARD && <Footer language={language} />}

      {/* Booking Modal */}
      {selectedProvider && (
        <BookingModal 
          provider={selectedProvider} 
          onClose={() => setSelectedProvider(null)}
          language={language}
        />
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authInitialMode}
        onLoginSuccess={handleLoginSuccess}
        language={language}
      />
    </div>
  );
};

export default App;