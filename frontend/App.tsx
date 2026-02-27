import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ServicesPage from './pages/ServicesPage';
import { Dashboard } from './pages/Dashboard';
import VerifyEmail from './pages/VerifyEmail';
import ProviderProfile from './pages/ProviderProfile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import BookingModal from './components/BookingModal';
import AuthModal from './components/AuthModal';
import { PageView, ServiceProvider, UserRole, User, Notification } from './types';
import { Language, translations } from './translations';
import { notificationsAPI, authAPI } from './api';

const PAGE_VIEW_PATHS: Record<PageView, string> = {
  [PageView.HOME]: '/',
  [PageView.GARAGE]: '/garage',
  [PageView.PARTS]: '/parts',
  [PageView.TOWING]: '/towing',
  [PageView.DASHBOARD]: '/dashboard',
  [PageView.LOGIN]: '/',
};

const PATH_TO_VIEW: Record<string, PageView> = {
  '/': PageView.HOME,
  '/garage': PageView.GARAGE,
  '/parts': PageView.PARTS,
  '/towing': PageView.TOWING,
  '/dashboard': PageView.DASHBOARD,
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = PATH_TO_VIEW[location.pathname] || PageView.HOME;

  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // Auth & User State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Socket.io ref for real-time notifications
  const socketRef = useRef<Socket | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Password reset token from email link
  const [resetToken, setResetToken] = useState<string | undefined>(undefined);
  const [resetEmail, setResetEmail] = useState<string | undefined>(undefined);

  // Dark Mode State - Default to true
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Language State - Default to English
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];

  // Apply Dark Mode Class to HTML tag
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Check URL for password reset token and auto-open modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('resetToken');
    const email = params.get('email');
    if (token && email) {
      setResetToken(token);
      setResetEmail(email);
      setIsAuthModalOpen(true);
      // Clean URL params without reloading
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);
  
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
            avatar: userData.avatar,
            isEmailVerified: userData.isEmailVerified
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
            createdAt: new Date(n.createdAt)
          })));
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
        }
      }
    };
    checkAuth();
  }, []);

  // Helper to map raw notification data to typed Notification
  const mapNotification = useCallback((n: any): Notification => ({
    id: n._id,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: n.isRead,
    createdAt: new Date(n.createdAt)
  }), []);

  // Fetch all notifications from the API
  const fetchNotifications = useCallback(async () => {
    try {
      const notifs = await notificationsAPI.getAll();
      setNotifications(notifs.map(mapNotification));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [mapNotification]);

  // Real-time notifications: Socket.io with polling fallback
  useEffect(() => {
    if (!user) {
      // Disconnect socket and stop polling when logged out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    // Determine socket URL: strip /api suffix from the backend base URL
    const backendUrl = (import.meta.env.VITE_REACT_APP_BACKEND_BASEURL || '').replace(/\/api\/?$/, '');

    let socketConnected = false;

    if (backendUrl) {
      const socket = io(backendUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
      });

      socket.on('connect', () => {
        socketConnected = true;
        // Stop polling — we have a live connection
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      });

      socket.on('notification', (data: any) => {
        setNotifications(prev => [mapNotification(data), ...prev]);
      });

      socket.on('disconnect', () => {
        socketConnected = false;
        // Start polling as fallback
        if (!pollIntervalRef.current) {
          pollIntervalRef.current = setInterval(fetchNotifications, 30000);
        }
      });

      socket.on('connect_error', () => {
        // Socket failed (e.g. serverless) — fall back to polling
        if (!pollIntervalRef.current) {
          pollIntervalRef.current = setInterval(fetchNotifications, 30000);
        }
      });

      socketRef.current = socket;
    } else {
      // No backend URL for sockets — use polling only
      pollIntervalRef.current = setInterval(fetchNotifications, 30000);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [user, mapNotification, fetchNotifications]);

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

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const handleViewChange = (view: PageView) => {
    navigate(PAGE_VIEW_PATHS[view]);
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
    await fetchNotifications();

    // Redirect logic could be here, but sticking to current view or Dashboard if pro
    if (loggedInUser.role !== UserRole.CLIENT) {
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    setNotifications([]);
    navigate('/');
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
        <Routes>
          <Route path="/" element={<Home onChangeView={handleViewChange} language={language} />} />
          <Route path="/garage" element={
            <ServicesPage key="garage" type={UserRole.MECHANIC} title={t.garageServicesTitle} subtitle={t.garageServicesDesc} userLocation={userLocation} onBook={handleBook} language={language} />
          } />
          <Route path="/parts" element={
            <ServicesPage key="parts" type={UserRole.PARTS_SHOP} title={t.sparePartsTitle} subtitle={t.sparePartsDesc} userLocation={userLocation} onBook={handleBook} language={language} />
          } />
          <Route path="/towing" element={
            <ServicesPage key="towing" type={UserRole.TOWING} title={t.roadsideTitle} subtitle={t.roadsideDesc} userLocation={userLocation} onBook={handleBook} language={language} />
          } />
          <Route path="/search" element={
            <ServicesPage key="search" title={t.searchResults} subtitle={t.allServices} userLocation={userLocation} onBook={handleBook} language={language} />
          } />
          <Route path="/dashboard" element={
            user ? <Dashboard user={user} onLogout={handleLogout} onUserUpdate={setUser} language={language} /> : <Navigate to="/" replace />
          } />
          <Route path="/provider/:id" element={
            <ProviderProfile language={language} userLocation={userLocation} onBook={handleBook} />
          } />
          <Route path="/verify-email" element={
            <VerifyEmail language={language} onOpenLogin={() => { setAuthInitialMode('LOGIN'); setIsAuthModalOpen(true); }} />
          } />
          <Route path="/privacy" element={<PrivacyPolicy language={language} />} />
          <Route path="/terms" element={<TermsOfService language={language} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {currentView !== PageView.DASHBOARD && <Footer language={language} onChangeView={handleViewChange} />}

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
        onClose={() => { setIsAuthModalOpen(false); setResetToken(undefined); setResetEmail(undefined); }}
        initialMode={authInitialMode}
        onLoginSuccess={handleLoginSuccess}
        language={language}
        resetToken={resetToken}
        resetEmail={resetEmail}
      />
    </div>
  );
};

export default App;