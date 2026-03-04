import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, UserRole, Booking, BookingUpdatePayload, ServiceItem } from '../types';
import { Calendar, MapPin, Phone, Settings, LogOut, CheckCircle, XCircle, AlertCircle, TrendingUp, User as UserIcon, Shield, Wrench, Camera, Clock, Tag, Plus, Trash2, Users, BookOpen, Ban, Search } from 'lucide-react';
import { bookingsAPI, authAPI, providersAPI, adminAPI, reviewsAPI } from '../api';
import { Language, translations } from '../translations';
import ReviewModal from '../components/ReviewModal';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onUserUpdate?: (updatedUser: User) => void;
  language?: Language;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onUserUpdate, language = 'en' }) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BOOKINGS' | 'SETTINGS' | 'PROVIDERS' | 'USERS' | 'ALL_PROVIDERS' | 'ADMIN_BOOKINGS'>('OVERVIEW');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isAvailable, setIsAvailable] = useState(user.isAvailable ?? true);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerRating, setProviderRating] = useState(0);
  const [_providerTotalReviews, setProviderTotalReviews] = useState(0);
  const [availabilityUpdating, setAvailabilityUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState<{ totalUsers: number; totalProviders: number; pendingProviders: number; totalBookings: number; totalReviews: number; bannedUsers: number } | null>(null);
  const [pendingProviders, setPendingProviders] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [adminActionMsg, setAdminActionMsg] = useState<string | null>(null);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  // Admin – Users tab
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersSearch, setUsersSearch] = useState('');
  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [userActionMsg, setUserActionMsg] = useState<string | null>(null);
  const [userActionIsError, setUserActionIsError] = useState(false);
  // Admin – All Providers tab
  const [allProviders, setAllProviders] = useState<any[]>([]);
  const [allProvidersLoading, setAllProvidersLoading] = useState(false);
  const [allProvidersFilter, setAllProvidersFilter] = useState<string>('ALL');
  // Admin – All Bookings tab
  const [adminBookings, setAdminBookings] = useState<any[]>([]);
  const [adminBookingsLoading, setAdminBookingsLoading] = useState(false);
  const [adminBookingsFilter, setAdminBookingsFilter] = useState<string>('');
  const [profilePic, setProfilePic] = useState<string | null>(user.avatar?.url || null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileName, setProfileName] = useState(user.name);
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveMsg, setProfileSaveMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmPw, setDeleteConfirmPw] = useState('');
  const [deleteAccountBusy, setDeleteAccountBusy] = useState(false);
  const [deleteAccountMsg, setDeleteAccountMsg] = useState<string | null>(null);
  const picInputRef = useRef<HTMLInputElement>(null);
  const [shopImage, setShopImage] = useState<string | null>(null);
  const [shopImageUploading, setShopImageUploading] = useState(false);
  const shopImageInputRef = useRef<HTMLInputElement>(null);
  const [galleryImages, setGalleryImages] = useState<{ url: string; publicId: string }[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryDeleting, setGalleryDeleting] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Working schedule state
  const [workingDays, setWorkingDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [workingHoursStart, setWorkingHoursStart] = useState('08:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('17:00');
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Services & Pricing state
  const [providerServices, setProviderServices] = useState<ServiceItem[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [servicesSaving, setServicesSaving] = useState(false);
  const [servicesMsg, setServicesMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Review modal state
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());

  // Decline modal state
  const [declineBooking, setDeclineBooking] = useState<Booking | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  // Client cancel booking
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Sync local state when parent user prop updates (e.g. after avatar upload)
  useEffect(() => {
    setProfilePic(user.avatar?.url || null);
    setProfileName(user.name);
    setProfilePhone(user.phone || '');
  }, [user]);

  // Fetch provider profile to get _id and real isAvailable value
  useEffect(() => {
    if (user.role === UserRole.CLIENT || user.role === UserRole.ADMIN) return;
    const fetchProvider = async () => {
      try {
        const data = await providersAPI.getByUserId(user.id);
        setProviderId(data._id);
        setIsAvailable(data.isAvailable ?? true);
        setProviderRating(data.rating ?? 0);
        setProviderTotalReviews(data.totalReviews ?? 0);
        if (data.profileImage) setShopImage(data.profileImage);
        if (data.images) setGalleryImages(data.images);
        if (data.workingDays) setWorkingDays(data.workingDays);
        if (data.workingHours) {
          if (data.workingHours.start) setWorkingHoursStart(data.workingHours.start);
          if (data.workingHours.end) setWorkingHoursEnd(data.workingHours.end);
        }
        if (data.services) setProviderServices(data.services);
      } catch (err) {
        console.error('Failed to fetch provider profile:', err);
      }
    };
    fetchProvider();
  }, [user.id, user.role]);

  const handlePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Optimistic preview
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePic(ev.target?.result as string);
    reader.readAsDataURL(file);
    // Upload to Cloudinary via backend
    setAvatarUploading(true);
    try {
      const data = await authAPI.uploadAvatar(file);
      setProfilePic(data.avatar.url);
      if (onUserUpdate) {
        onUserUpdate({ ...user, avatar: data.avatar });
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleShopImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !providerId) return;
    // Optimistic preview
    const reader = new FileReader();
    reader.onload = (ev) => setShopImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    // Upload to Cloudinary via backend
    setShopImageUploading(true);
    try {
      const data = await providersAPI.uploadImage(providerId, file);
      setShopImage(data.profileImage);
    } catch (err) {
      console.error('Shop image upload failed:', err);
    } finally {
      setShopImageUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !providerId) return;
    setGalleryUploading(true);
    try {
      const data = await providersAPI.uploadGalleryImages(providerId, Array.from(files));
      setGalleryImages(data.images);
    } catch (err) {
      console.error('Gallery upload failed:', err);
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleGalleryDelete = async (publicId: string) => {
    if (!providerId) return;
    setGalleryDeleting(publicId);
    try {
      const data = await providersAPI.deleteGalleryImage(providerId, publicId);
      setGalleryImages(data.images);
    } catch (err) {
      console.error('Gallery delete failed:', err);
    } finally {
      setGalleryDeleting(null);
    }
  };

  const toggleWorkingDay = (day: number) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleScheduleSave = async () => {
    if (!providerId) return;
    setScheduleSaving(true);
    setScheduleMsg(null);
    try {
      await providersAPI.update(providerId, {
        workingDays,
        workingHours: { start: workingHoursStart, end: workingHoursEnd },
      });
      setScheduleMsg({ text: t.scheduleUpdated, ok: true });
      setTimeout(() => setScheduleMsg(null), 3000);
    } catch (err) {
      console.error('Schedule save failed:', err);
      setScheduleMsg({ text: t.scheduleUpdateFailed, ok: false });
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleAddService = () => {
    const name = newServiceName.trim();
    const price = parseFloat(newServicePrice);
    if (!name || isNaN(price) || price < 0) return;
    setProviderServices(prev => [...prev, { name, price }]);
    setNewServiceName('');
    setNewServicePrice('');
  };

  const handleRemoveService = (index: number) => {
    setProviderServices(prev => prev.filter((_, i) => i !== index));
  };

  const handleServicesSave = async () => {
    if (!providerId) return;
    setServicesSaving(true);
    setServicesMsg(null);
    try {
      await providersAPI.update(providerId, { services: providerServices });
      setServicesMsg({ text: t.servicesSaved, ok: true });
      setTimeout(() => setServicesMsg(null), 3000);
    } catch (err) {
      console.error('Services save failed:', err);
      setServicesMsg({ text: t.servicesSaveFailed, ok: false });
    } finally {
      setServicesSaving(false);
    }
  };

  // Fetch admin stats and pending providers
  useEffect(() => {
    if (user.role !== UserRole.ADMIN) return;
    const fetchAdminData = async () => {
      setAdminLoading(true);
      try {
        const [stats, pending] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getPendingProviders(),
        ]);
        setAdminStats(stats);
        setPendingProviders(pending);
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      } finally {
        setAdminLoading(false);
      }
    };
    fetchAdminData();
  }, [user.role]);

  // Fetch admin users
  useEffect(() => {
    if (user.role !== UserRole.ADMIN) return;
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const data = await adminAPI.getUsers(usersSearch || undefined);
        setAdminUsers(data.data ?? data);
      } catch (err) {
        console.error('Failed to fetch admin users:', err);
      } finally {
        setUsersLoading(false);
      }
    };
    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [user.role, usersSearch]);

  // Fetch all providers (admin)
  useEffect(() => {
    if (user.role !== UserRole.ADMIN) return;
    const fetchAllProviders = async () => {
      setAllProvidersLoading(true);
      try {
        const data = await adminAPI.getAllProviders(allProvidersFilter === 'ALL' ? undefined : allProvidersFilter);
        setAllProviders(data.data ?? data);
      } catch (err) {
        console.error('Failed to fetch all providers:', err);
      } finally {
        setAllProvidersLoading(false);
      }
    };
    fetchAllProviders();
  }, [user.role, allProvidersFilter]);

  // Fetch all bookings (admin)
  useEffect(() => {
    if (user.role !== UserRole.ADMIN) return;
    const fetchAdminBookings = async () => {
      setAdminBookingsLoading(true);
      try {
        const data = await adminAPI.getAllBookings(1, 30, adminBookingsFilter || undefined);
        setAdminBookings(data.data ?? data);
      } catch (err) {
        console.error('Failed to fetch admin bookings:', err);
      } finally {
        setAdminBookingsLoading(false);
      }
    };
    fetchAdminBookings();
  }, [user.role, adminBookingsFilter]);

  const handleApproveProvider = async (id: string) => {
    setApprovingId(id);
    setAdminActionError(null);
    try {
      await adminAPI.approveProvider(id);
      setPendingProviders(prev => prev.filter((p: any) => p._id !== id));
      setAllProviders(prev => prev.map((p: any) => p._id === id ? { ...p, isVerified: 'APPROVED', rejectionReason: '' } : p));
      setAdminStats(prev => prev ? {
        ...prev,
        totalProviders: prev.totalProviders + 1,
        pendingProviders: Math.max(0, prev.pendingProviders - 1),
      } : prev);
      setAdminActionMsg(t.providerApproved);
      setTimeout(() => setAdminActionMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to approve provider:', err);
      setAdminActionError(err?.message || 'Failed to approve provider.');
      setTimeout(() => setAdminActionError(null), 5000);
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectProvider = async (id: string) => {
    if (!rejectReason.trim()) return;
    setRejectSubmitting(true);
    setAdminActionError(null);
    try {
      await adminAPI.rejectProvider(id, rejectReason.trim());
      const wasInPending = pendingProviders.some((p: any) => p._id === id);
      setPendingProviders(prev => prev.filter((p: any) => p._id !== id));
      setAllProviders(prev => prev.map((p: any) => p._id === id ? { ...p, isVerified: 'REJECTED', rejectionReason: rejectReason.trim() } : p));
      setAdminStats(prev => prev ? {
        ...prev,
        pendingProviders: wasInPending ? Math.max(0, prev.pendingProviders - 1) : prev.pendingProviders,
        totalProviders: prev.totalProviders > 0 && !wasInPending ? Math.max(0, prev.totalProviders - 1) : prev.totalProviders,
      } : prev);
      setRejectingId(null);
      setRejectReason('');
      setAdminActionMsg(t.providerRejected);
      setTimeout(() => setAdminActionMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to reject provider:', err);
      setAdminActionError(err?.message || 'Failed to reject provider.');
      setTimeout(() => setAdminActionError(null), 5000);
    } finally {
      setRejectSubmitting(false);
    }
  };

  // Clears rejection state when switching tabs so the inline reject input
  // doesn't bleed through to the All Providers / Pending Approvals tabs.
  const switchTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setRejectingId(null);
    setRejectReason('');
  };

  const handleBanUser = async (id: string, ban: boolean) => {
    setBanningUserId(id);
    setUserActionMsg(null);
    setUserActionIsError(false);
    try {
      const updated = await adminAPI.banUser(id, ban);
      setAdminUsers(prev => prev.map((u: any) => u._id === id ? { ...u, isBanned: updated.isBanned } : u));
      setUserActionIsError(false);
      setUserActionMsg(ban ? t.userBanned : t.userUnbanned);
      setTimeout(() => setUserActionMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to ban/unban user:', err);
      setUserActionIsError(true);
      setUserActionMsg(err?.message || 'Action failed. Please try again.');
      setTimeout(() => { setUserActionMsg(null); setUserActionIsError(false); }, 5000);
    } finally {
      setBanningUserId(null);
    }
  };

  const handleToggleAvailability = async () => {
    if (!providerId || availabilityUpdating) return;
    const next = !isAvailable;
    setIsAvailable(next);
    setAvailabilityUpdating(true);
    try {
      await providersAPI.update(providerId, { isAvailable: next });
    } catch (err) {
      console.error('Failed to update availability:', err);
      setIsAvailable(!next); // revert on failure
    } finally {
      setAvailabilityUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw.length < 6) {
      setPwMsg({ text: 'New password must be at least 6 characters.', ok: false });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ text: 'New passwords do not match.', ok: false });
      return;
    }
    setPwSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: currentPw, newPassword: newPw });
      setPwMsg({ text: t.passwordUpdatedLogout, ok: true });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      // Backend clears all auth cookies on password change — log out the frontend too.
      setTimeout(() => onLogout(), 2000);
    } catch (err: any) {
      setPwMsg({ text: err.message || 'Failed to update password.', ok: false });
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmPw) return;
    setDeleteAccountBusy(true);
    setDeleteAccountMsg(null);
    try {
      await authAPI.deleteAccount(deleteConfirmPw);
      // Account is gone — force full logout on the frontend immediately
      onLogout();
    } catch (err: any) {
      setDeleteAccountMsg(err.message || t.deleteAccountFailed);
      setDeleteAccountBusy(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSaveMsg(null);
    try {
      const data = await authAPI.updateProfile({ name: profileName, phone: profilePhone });
      if (onUserUpdate) {
        onUserUpdate({ ...user, name: data.name, phone: data.phone });
      }
      setProfileSaveMsg({ text: t.changesSaved, ok: true });
      setTimeout(() => setProfileSaveMsg(null), 3000);
    } catch (err) {
      console.error('Profile save failed:', err);
      setProfileSaveMsg({ text: (err instanceof Error ? err.message : null) || t.saveFailed, ok: false });
    } finally {
      setProfileSaving(false);
    }
  };

  // Fetch bookings from API
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const data = await bookingsAPI.getAll();
        // Map backend data to frontend format (API returns { data, total, page, pages })
        const mappedBookings = (data.data ?? data).map((b: any) => ({
          id: b._id,
          providerId: b.providerId,
          providerName: b.providerName,
          providerPhone: b.providerPhone || '',
          clientId: b.clientId,
          clientName: b.clientName,
          clientPhone: b.clientPhone,
          date: b.date ? new Date(b.date).toISOString().slice(0, 10) : b.date,
          issue: b.issue,
          status: b.status,
          price: b.price
        }));
        setBookings(mappedBookings);

        // Check which completed bookings already have reviews
        if (user.role === UserRole.CLIENT) {
          const completedIds = mappedBookings
            .filter((b: Booking) => b.status === 'COMPLETED')
            .map((b: Booking) => b.id);
          const reviewed = new Set<string>();
          await Promise.all(
            completedIds.map(async (id: string) => {
              try {
                const res = await reviewsAPI.checkBooking(id);
                if (res.reviewed) reviewed.add(id);
              } catch { /* ignore */ }
            })
          );
          setReviewedBookingIds(reviewed);
        }
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const handleStatusChange = async (id: string, newStatus: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED', cancellationReason?: string) => {
    try {
      const payload: BookingUpdatePayload = { status: newStatus };
      if (newStatus === 'CANCELLED' && cancellationReason) payload.cancellationReason = cancellationReason;
      await bookingsAPI.update(id, payload);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus, cancellationReason: cancellationReason || b.cancellationReason } : b));
    } catch (error) {
      console.error('Failed to update booking status:', error);
    }
  };

  const handleDeclineConfirm = async () => {
    if (!declineBooking) return;
    await handleStatusChange(declineBooking.id, 'CANCELLED', declineReason.trim() || undefined);
    setDeclineBooking(null);
    setDeclineReason('');
  };

  const handleCancelBooking = async (id: string) => {
    setCancellingId(id);
    try {
      await bookingsAPI.delete(id, t.cancelledByClient);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED', cancellationReason: t.cancelledByClient } : b));
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'COMPLETED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // --- SUB-COMPONENTS ---

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
          <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
      </div>
    </div>
  );

  const ClientOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title={t.activeBookings} value={bookings.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED').length} icon={Calendar} color="bg-blue-500" />
        <StatCard title={t.completedServices} value={bookings.filter(b => b.status === 'COMPLETED').length} icon={CheckCircle} color="bg-purple-500" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">{t.recentActivity}</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {loading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-700 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-6 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-full" />
                      <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-full" />
                      <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    </div>
                  </div>
                  <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg shrink-0" />
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 text-blue-500">
                <Wrench size={28} />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-2">{t.clientOnboardingTitle}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6">{t.clientOnboardingMessage}</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/garage" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Wrench size={15} /> {t.findAProvider}
                </Link>
                <Link to="/towing" className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                  <AlertCircle size={15} /> {t.emergencyTowing}
                </Link>
              </div>
            </div>
          ) : bookings.map(booking => (
            <div key={booking.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <Wrench size={20} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white">{booking.providerName}</h4>
                    {(booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && (
                      <Link to={`/provider/${booking.providerId}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        <MapPin size={12} />
                        {t.viewProfile}
                      </Link>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{booking.issue}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {booking.date}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  {booking.status === 'CANCELLED' && booking.cancellationReason && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      {t.cancelledReason}: {booking.cancellationReason}
                    </p>
                  )}
                </div>
              </div>
              {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                <button
                  type="button"
                  disabled={cancellingId === booking.id}
                  onClick={() => handleCancelBooking(booking.id)}
                  className="px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {cancellingId === booking.id ? (
                    <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <XCircle size={16} />
                  )}
                  {t.cancelBooking}
                </button>
              )}
              {booking.status === 'COMPLETED' && (
                reviewedBookingIds.has(booking.id) ? (
                  <span className="px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle size={16} /> {t.reviewed}
                  </span>
                ) : (
                  <button 
                    onClick={() => setReviewBooking(booking)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    {t.leaveReview}
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ProfessionalOverview = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-500/20">
        <div>
          <h2 className="text-2xl font-bold mb-1">{t.welcomePro} {user.name}</h2>
          <p className="text-blue-100 opacity-90">{t.manageGarage}</p>
        </div>
        <div className="flex items-center gap-3 bg-white/10 p-2 rounded-xl backdrop-blur-sm">
           <span className="text-sm font-medium">{isAvailable ? t.online : t.offline}</span>
           <button 
             onClick={handleToggleAvailability}
             disabled={availabilityUpdating || !providerId}
             className={`w-12 h-6 rounded-full p-1 transition-colors ${isAvailable ? 'bg-green-400' : 'bg-slate-400'} disabled:opacity-60`}
           >
             <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-0'}`}></div>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title={t.pendingRequests} value={bookings.filter(b => b.status === 'PENDING').length} icon={AlertCircle} color="bg-yellow-500" />
        <StatCard title={t.todaysJobs} value={bookings.filter(b => b.date === new Date().toISOString().slice(0,10) && (b.status === 'CONFIRMED' || b.status === 'COMPLETED')).length} icon={Calendar} color="bg-blue-500" />
        <StatCard title={t.ratingLabel} value={providerRating > 0 ? providerRating.toFixed(1) : '—'} icon={TrendingUp} color="bg-purple-500" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">{t.incomingRequests}</h3>
          <button onClick={() => setActiveTab('BOOKINGS')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">{t.viewAll}</button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {bookings.filter(b => b.status === 'PENDING').length === 0 ? (
             <div className="p-8 text-center text-slate-400">{t.noPendingRequests}</div>
          ) : (
            bookings.filter(b => b.status === 'PENDING').map(booking => (
              <div key={booking.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400">
                    <UserIcon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">{booking.clientName}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1"><Phone size={14} /> {booking.clientPhone}</span>
                      <span className="flex items-center gap-1"><Calendar size={14} /> {booking.date}</span>
                    </div>
                    <div className="mt-2 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 inline-block">
                      {t.issueLabel} <span className="font-medium">{booking.issue}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => { setDeclineBooking(booking); setDeclineReason(''); }}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <XCircle size={18} /> {t.decline}
                  </button>
                  <button 
                    onClick={() => handleStatusChange(booking.id, 'CONFIRMED')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <CheckCircle size={18} /> {t.acceptJob}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const AdminOverview = () => (
    <div className="space-y-6">
       <div className="bg-slate-900 text-white p-8 rounded-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">{t.adminTitle}</h2>
            <p className="text-slate-400">{t.adminSubtitle}</p>
          </div>
          <Shield className="absolute right-[-20px] bottom-[-40px] text-slate-800 w-48 h-48 opacity-50" />
       </div>

       {adminLoading ? (
         <div className="flex justify-center py-12">
           <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
         </div>
       ) : (
         <>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             <StatCard title={t.totalUsers}      value={adminStats?.totalUsers      ?? '—'} icon={UserIcon}     color="bg-blue-500" />
             <StatCard title={t.verifiedProviders} value={adminStats?.totalProviders ?? '—'} icon={CheckCircle} color="bg-green-500" />
             <StatCard title={t.pendingApprovals}  value={adminStats?.pendingProviders ?? '—'} icon={AlertCircle} color="bg-orange-500" />
             <StatCard title={t.totalBookings}     value={adminStats?.totalBookings   ?? '—'} icon={Calendar}    color="bg-purple-500" />
             <StatCard title={t.totalReviews}      value={adminStats?.totalReviews    ?? '—'} icon={BookOpen}    color="bg-teal-500" />
             <StatCard title={t.bannedUsers}       value={adminStats?.bannedUsers     ?? '—'} icon={Ban}         color="bg-red-500" />
           </div>

           {/* Quick-access cards */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <button
               onClick={() => switchTab('PROVIDERS')}
               className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5 hover:border-orange-400 dark:hover:border-orange-500 transition-colors group"
             >
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                   <Shield size={20} className="text-orange-600 dark:text-orange-400" />
                 </div>
                 <div className="text-left">
                   <p className="font-semibold text-slate-900 dark:text-white">{t.providersTab}</p>
                   <p className="text-sm text-slate-500 dark:text-slate-400">{t.pendingProviderApprovals}</p>
                 </div>
               </div>
               <div className="flex items-center gap-3">
                 {(adminStats?.pendingProviders ?? 0) > 0 && (
                   <span className="px-2.5 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                     {adminStats!.pendingProviders}
                   </span>
                 )}
                 <span className="text-slate-400 group-hover:text-orange-500 transition-colors">→</span>
               </div>
             </button>

             <button
               onClick={() => switchTab('USERS')}
               className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5 hover:border-blue-400 dark:hover:border-blue-500 transition-colors group"
             >
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                   <Users size={20} className="text-blue-600 dark:text-blue-400" />
                 </div>
                 <div className="text-left">
                   <p className="font-semibold text-slate-900 dark:text-white">{t.usersTab}</p>
                   <p className="text-sm text-slate-500 dark:text-slate-400">{adminStats?.totalUsers ?? '—'} {t.totalUsers.toLowerCase()}</p>
                 </div>
               </div>
               <span className="text-slate-400 group-hover:text-blue-500 transition-colors">→</span>
             </button>

             <button
               onClick={() => switchTab('ADMIN_BOOKINGS')}
               className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5 hover:border-purple-400 dark:hover:border-purple-500 transition-colors group"
             >
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                   <BookOpen size={20} className="text-purple-600 dark:text-purple-400" />
                 </div>
                 <div className="text-left">
                   <p className="font-semibold text-slate-900 dark:text-white">{t.adminBookingsTab}</p>
                   <p className="text-sm text-slate-500 dark:text-slate-400">{adminStats?.totalBookings ?? '—'} {t.totalBookings.toLowerCase()}</p>
                 </div>
               </div>
               <span className="text-slate-400 group-hover:text-purple-500 transition-colors">→</span>
             </button>
           </div>
         </>
       )}
    </div>
  );

  const AdminProviders = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6">
        <h3 className="font-bold text-lg mb-1">{t.pendingProviderApprovals}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t.adminSubtitle}</p>
        {adminActionMsg && (
          <p className="mb-4 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm">{adminActionMsg}</p>
        )}
        {adminActionError && (
          <p className="mb-4 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">{adminActionError}</p>
        )}
        {adminLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pendingProviders.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3 text-slate-400">
            <CheckCircle size={40} className="text-green-400" />
            <p className="font-medium">No pending approvals</p>
            <p className="text-sm">All providers have been reviewed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500">
                  <th className="pb-3 pr-4">{t.nameCol}</th>
                  <th className="pb-3 pr-4">{t.typeCol}</th>
                  <th className="pb-3 pr-4">{t.wilayaCol}</th>
                  <th className="pb-3 pr-4">Phone</th>
                  <th className="pb-3 text-right">{t.actionCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {pendingProviders.map((p: any) => (
                  <tr key={p._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-4 pr-4 font-medium">{p.name}</td>
                    <td className="py-4 pr-4 text-sm text-slate-500">{p.role}</td>
                    <td className="py-4 pr-4 text-sm text-slate-500">{p.wilayaId}</td>
                    <td className="py-4 pr-4 text-sm text-slate-500">{p.phone || '—'}</td>
                    <td className="py-4 text-right">
                      {rejectingId === p._id ? (
                        <div className="flex items-center gap-2 justify-end flex-wrap">
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !rejectSubmitting) handleRejectProvider(p._id); }}
                            placeholder={t.rejectionReasonPlaceholder}
                            className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white w-52 focus:outline-none focus:ring-2 focus:ring-red-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleRejectProvider(p._id)}
                            disabled={!rejectReason.trim() || rejectSubmitting}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            {rejectSubmitting && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {t.rejectProvider}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                            disabled={rejectSubmitting}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
                          >
                            {t.cancel}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => handleApproveProvider(p._id)}
                            disabled={approvingId === p._id}
                            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                          >
                            {approvingId === p._id
                              ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : <CheckCircle size={14} />}
                            {t.approveProvider}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRejectingId(p._id); setRejectReason(''); }}
                            className="px-4 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                          >
                            <XCircle size={14} /> {t.rejectProvider}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const statusBadgeColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'REJECTED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'PENDING':  return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default:         return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const AdminUsers = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6">
        <h3 className="font-bold text-lg mb-4">{t.usersTab}</h3>
        {userActionMsg && (
          <p className={`mb-4 px-4 py-2 rounded-lg text-sm ${
            userActionIsError
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
          }`}>{userActionMsg}</p>
        )}
        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={usersSearch}
            onChange={e => setUsersSearch(e.target.value)}
            placeholder={t.searchUsers}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {usersLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : adminUsers.length === 0 ? (
          <div className="text-center py-12 text-slate-400">{t.noUsersFound}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">{t.nameCol}</th>
                  <th className="pb-3 pr-4 font-medium">{t.emailCol}</th>
                  <th className="pb-3 pr-4 font-medium">{t.roleCol}</th>
                  <th className="pb-3 pr-4 font-medium">{t.registeredCol}</th>
                  <th className="pb-3 pr-4 font-medium">{t.statusCol}</th>
                  <th className="pb-3 text-right font-medium">{t.actionCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {adminUsers.map((u: any) => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 pr-4 font-medium">{u.name}</td>
                    <td className="py-3 pr-4 text-slate-500 truncate max-w-[160px]">{u.email}</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">{u.role}</span>
                    </td>
                    <td className="py-3 pr-4 text-slate-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="py-3 pr-4">
                      {u.isBanned ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{t.bannedBadge}</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {u.isBanned ? (
                        <button
                          type="button"
                          disabled={banningUserId === u._id}
                          onClick={() => handleBanUser(u._id, false)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          {banningUserId === u._id
                            ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <CheckCircle size={12} />}
                          {t.unbanUser}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={banningUserId === u._id}
                          onClick={() => handleBanUser(u._id, true)}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          {banningUserId === u._id
                            ? <span className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            : <Ban size={12} />}
                          {t.banUser}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const AdminAllProviders = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{t.allProvidersTab}</h3>
          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(s => (
              <button
                key={s}
                onClick={() => setAllProvidersFilter(s)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  allProvidersFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {s === 'ALL' ? t.allStatuses : s}
              </button>
            ))}
          </div>
        </div>
        {adminActionMsg && (
          <p className="mb-4 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm">{adminActionMsg}</p>
        )}
        {adminActionError && (
          <p className="mb-4 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">{adminActionError}</p>
        )}
        {allProvidersLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : allProviders.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No providers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">{t.nameCol}</th>
                  <th className="pb-3 pr-4 font-medium">{t.typeCol}</th>
                  <th className="pb-3 pr-4 font-medium">{t.wilayaCol}</th>
                  <th className="pb-3 pr-4 font-medium">Phone</th>
                  <th className="pb-3 pr-4 font-medium">{t.statusCol}</th>
                  <th className="pb-3 text-right font-medium">{t.actionCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {allProviders.map((p: any) => (
                  <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 pr-4 font-medium">{p.name}</td>
                    <td className="py-3 pr-4 text-slate-500">{p.role}</td>
                    <td className="py-3 pr-4 text-slate-500">{p.wilayaId}</td>
                    <td className="py-3 pr-4 text-slate-500">{p.phone || '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusBadgeColor(p.isVerified)}`}>{p.isVerified}</span>
                      {p.isVerified === 'REJECTED' && p.rejectionReason && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 max-w-[140px] truncate" title={p.rejectionReason}>{p.rejectionReason}</p>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {rejectingId === p._id ? (
                        <div className="flex items-center gap-2 justify-end flex-wrap">
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !rejectSubmitting) handleRejectProvider(p._id); }}
                            placeholder={t.rejectionReasonPlaceholder}
                            className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white w-44 focus:outline-none focus:ring-2 focus:ring-red-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleRejectProvider(p._id)}
                            disabled={!rejectReason.trim() || rejectSubmitting}
                            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            {rejectSubmitting && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {t.rejectProvider}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                            disabled={rejectSubmitting}
                            className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors"
                          >
                            {t.cancel}
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          {p.isVerified !== 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => handleApproveProvider(p._id)}
                              disabled={approvingId === p._id}
                              className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              {approvingId === p._id
                                ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <CheckCircle size={12} />}
                              {t.approveProvider}
                            </button>
                          )}
                          {p.isVerified !== 'REJECTED' && (
                            <button
                              type="button"
                              onClick={() => { setRejectingId(p._id); setRejectReason(''); }}
                              className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              <XCircle size={12} /> {t.rejectProvider}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const AdminAllBookings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{t.adminBookingsTab}</h3>
          {/* Status filter */}
          <select
            value={adminBookingsFilter}
            onChange={e => setAdminBookingsFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t.allStatuses}</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
        {adminBookingsLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : adminBookings.length === 0 ? (
          <div className="text-center py-12 text-slate-400">{t.noBookingsFound}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">{t.clientCol}</th>
                  <th className="pb-3 pr-4 font-medium">{t.providerCol}</th>
                  <th className="pb-3 pr-4 font-medium">{t.dateCol}</th>
                  <th className="pb-3 pr-4 font-medium">{t.statusCol}</th>
                  <th className="pb-3 pr-4 font-medium">Issue</th>
                  <th className="pb-3 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {adminBookings.map((b: any) => (
                  <tr key={b._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 pr-4 font-medium">{b.clientName || '—'}</td>
                    <td className="py-3 pr-4 text-slate-500">{b.providerName || '—'}</td>
                    <td className="py-3 pr-4 text-slate-500">{b.date ? new Date(b.date).toLocaleDateString() : '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(b.status)}`}>{b.status}</span>
                    </td>
                    <td className="py-3 pr-4 text-slate-500 max-w-[160px] truncate">{b.issue || '—'}</td>
                    <td className="py-3 text-right text-slate-500">{b.price ? `${b.price} DA` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-6 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t.dashboardTitle}</h1>
            <p className="text-slate-500 dark:text-slate-400">{t.manageAccount}</p>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors shadow-sm"
          >
            <LogOut size={18} />
            {t.signOut}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm sticky top-24">
               <nav className="space-y-2">
                 <button
                   onClick={() => switchTab('OVERVIEW')}
                   className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                     activeTab === 'OVERVIEW'
                     ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                     : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                   }`}
                 >
                   <TrendingUp size={20} /> {t.overview}
                 </button>

                 {user.role === UserRole.ADMIN ? (
                   /* Admin nav tabs */
                   <>
                     <button
                       onClick={() => switchTab('PROVIDERS')}
                       className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                         activeTab === 'PROVIDERS'
                         ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                         : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                       }`}
                     >
                       <Shield size={20} />
                       <span className="flex-1 text-left">{t.providersTab}</span>
                       {(adminStats?.pendingProviders ?? 0) > 0 && (
                         <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                           {adminStats!.pendingProviders}
                         </span>
                       )}
                     </button>
                     <button
                       onClick={() => switchTab('ALL_PROVIDERS')}
                       className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                         activeTab === 'ALL_PROVIDERS'
                         ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                         : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                       }`}
                     >
                       <Wrench size={20} />
                       <span className="flex-1 text-left">{t.allProvidersTab}</span>
                     </button>
                     <button
                       onClick={() => switchTab('USERS')}
                       className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                         activeTab === 'USERS'
                         ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                         : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                       }`}
                     >
                       <Users size={20} />
                       <span className="flex-1 text-left">{t.usersTab}</span>
                     </button>
                     <button
                       onClick={() => switchTab('ADMIN_BOOKINGS')}
                       className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                         activeTab === 'ADMIN_BOOKINGS'
                         ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                         : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                       }`}
                     >
                       <BookOpen size={20} />
                       <span className="flex-1 text-left">{t.adminBookingsTab}</span>
                     </button>
                   </>
                 ) : (
                   /* Non-admin: Bookings tab */
                   <button
                     onClick={() => setActiveTab('BOOKINGS')}
                     className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                       activeTab === 'BOOKINGS'
                       ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                       : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                     }`}
                   >
                     <Calendar size={20} />
                     {user.role === UserRole.CLIENT ? t.myBookings : t.requests}
                   </button>
                 )}

                 <button
                   onClick={() => switchTab('SETTINGS')}
                   className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                     activeTab === 'SETTINGS'
                     ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                     : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                   }`}
                 >
                   <Settings size={20} /> {t.settings}
                 </button>
               </nav>

               <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 overflow-hidden flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold flex-shrink-0">
                      {profilePic
                        ? <img src={profilePic} alt="avatar" className="w-full h-full object-cover" />
                        : <span>{user.name.charAt(0)}</span>}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{profileName || user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.role}</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {activeTab === 'OVERVIEW' && (
              <div className="animate-fade-in">
                {user.role === UserRole.CLIENT && ClientOverview()}
                {(user.role === UserRole.MECHANIC || user.role === UserRole.TOWING || user.role === UserRole.PARTS_SHOP) && ProfessionalOverview()}
                {user.role === UserRole.ADMIN && AdminOverview()}
              </div>
            )}

            {activeTab === 'PROVIDERS' && user.role === UserRole.ADMIN && (
              <div className="animate-fade-in">
                {AdminProviders()}
              </div>
            )}

            {activeTab === 'ALL_PROVIDERS' && user.role === UserRole.ADMIN && (
              <div className="animate-fade-in">
                {AdminAllProviders()}
              </div>
            )}

            {activeTab === 'USERS' && user.role === UserRole.ADMIN && (
              <div className="animate-fade-in">
                {AdminUsers()}
              </div>
            )}

            {activeTab === 'ADMIN_BOOKINGS' && user.role === UserRole.ADMIN && (
              <div className="animate-fade-in">
                {AdminAllBookings()}
              </div>
            )}

            {activeTab === 'BOOKINGS' && (
               <div className="animate-fade-in bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 min-h-[400px]">
                 <h2 className="text-xl font-bold mb-6">
                   {user.role === UserRole.CLIENT ? t.bookingHistory : t.serviceRequests}
                 </h2>
                 {/* Reusing the logic from Overview components for simplicity, but expanded */}
                 {loading ? (
                   <div className="space-y-3 animate-pulse">
                     {Array.from({ length: 4 }).map((_, i) => (
                       <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex justify-between items-center gap-3">
                         <div className="flex-1 space-y-2">
                           <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-full" />
                           <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-full" />
                           <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-700 rounded-full" />
                         </div>
                         <div className="h-7 w-20 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0" />
                       </div>
                     ))}
                   </div>
                 ) : bookings.length === 0 ? (
                   user.role === UserRole.CLIENT ? (
                     <div className="py-16 flex flex-col items-center text-center gap-4">
                       <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500"><Wrench size={24} /></div>
                       <h4 className="font-bold text-slate-800 dark:text-white">{t.clientOnboardingTitle}</h4>
                       <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{t.clientOnboardingMessage}</p>
                       <div className="flex flex-wrap gap-3 justify-center">
                         <Link to="/garage" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"><Wrench size={14} /> {t.findAProvider}</Link>
                         <Link to="/towing" className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"><AlertCircle size={14} /> {t.emergencyTowing}</Link>
                       </div>
                     </div>
                   ) : (
                     <div className="text-center py-12 text-slate-400">{t.noBookingsFound}</div>
                   )
                 ) : (
                   <div className="space-y-4">
                     {bookings.map(b => (
                       <div key={b.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                          <div className="flex justify-between items-start gap-3">
                             <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2">
                                 <h4 className="font-bold text-slate-800 dark:text-white">{user.role === UserRole.CLIENT ? b.providerName : b.clientName}</h4>
                                 {user.role === UserRole.CLIENT && (b.status === 'CONFIRMED' || b.status === 'COMPLETED') && (
                                   <Link to={`/provider/${b.providerId}`} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 flex-shrink-0">
                                     <MapPin size={12} />
                                     {t.viewProfile}
                                   </Link>
                                 )}
                               </div>
                               <p className="text-sm text-slate-500">{b.issue}</p>
                               <div className="flex gap-4 mt-2 text-sm text-slate-400">
                                  <span>{b.date}</span>
                                  {b.price && <span>{b.price} DA</span>}
                               </div>
                               {b.status === 'CANCELLED' && b.cancellationReason && (
                                 <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                                   {t.cancelledReason}: {b.cancellationReason}
                                 </p>
                               )}
                             </div>
                             <div className="flex items-center gap-2 flex-shrink-0">
                               {user.role === UserRole.CLIENT && b.status === 'COMPLETED' && (
                                 reviewedBookingIds.has(b.id) ? (
                                   <span className="px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                                     <CheckCircle size={14} /> {t.reviewed}
                                   </span>
                                 ) : (
                                   <button
                                     onClick={() => setReviewBooking(b)}
                                     className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                   >
                                     {t.leaveReview}
                                   </button>
                                 )
                               )}
                               {user.role === UserRole.CLIENT && (b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                                 <button
                                   type="button"
                                   disabled={cancellingId === b.id}
                                   onClick={() => handleCancelBooking(b.id)}
                                   className="px-3 py-1.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60 flex items-center gap-1"
                                 >
                                   {cancellingId === b.id ? (
                                     <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                   ) : (
                                     <XCircle size={13} />
                                   )}
                                   {t.cancelBooking}
                                 </button>
                               )}
                               <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(b.status)}`}>{b.status}</span>
                               {user.role === UserRole.CLIENT && (b.providerPhone || b.clientPhone) && (() => {
                                 const phone = (b.providerPhone || b.clientPhone).replace(/\D/g, '');
                                 const waPhone = phone.startsWith('0') ? '213' + phone.slice(1) : phone;
                                 return (
                                   <>
                                     <a
                                       href={`tel:${b.providerPhone || b.clientPhone}`}
                                       className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
                                       title={`Call ${b.providerName}`}
                                     >
                                       <Phone size={15} />
                                     </a>
                                     <a
                                       href={`https://wa.me/${waPhone}`}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors"
                                       title={`WhatsApp ${b.providerName}`}
                                     >
                                       <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                                         <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                       </svg>
                                     </a>
                                   </>
                                 );
                               })()}
                             </div>
                          </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            )}

            {activeTab === 'SETTINGS' && (
              <div className="animate-fade-in bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-8 min-h-[400px]">
                 <h2 className="text-xl font-bold mb-6">{t.accountSettings}</h2>

                 {/* Profile Picture */}
                 <div className="flex items-center gap-5 mb-6">
                   <div className="relative w-20 h-20 flex-shrink-0">
                     <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 overflow-hidden flex items-center justify-center">
                       {profilePic
                         ? <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                         : <UserIcon size={36} className="text-slate-400" />}
                     </div>
                     <button
                       type="button"
                       onClick={() => picInputRef.current?.click()}
                       disabled={avatarUploading}
                       className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                     >
                       {avatarUploading
                         ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                         : <Camera size={14} />}
                     </button>
                     <input ref={picInputRef} type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-slate-800 dark:text-white">{profileName || user.name}</p>
                     <button type="button" onClick={() => picInputRef.current?.click()} className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 mt-0.5">{t.changeProfilePicture}</button>
                   </div>
                 </div>

                 {/* Shop / Garage Image (Professionals only) */}
                 {providerId && (
                   <div className="mb-6 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                     <p className="text-sm font-semibold text-slate-800 dark:text-white mb-1">{t.changeShopPhoto}</p>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t.shopPhotoDesc}</p>
                     <div className="flex items-center gap-4">
                       <div className="relative w-28 h-20 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center flex-shrink-0">
                         {shopImage
                           ? <img src={shopImage} alt="Shop" className="w-full h-full object-cover" />
                           : <Wrench size={28} className="text-slate-400" />}
                       </div>
                       <button
                         type="button"
                         onClick={() => shopImageInputRef.current?.click()}
                         disabled={shopImageUploading}
                         className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white transition-colors flex items-center gap-2"
                       >
                         {shopImageUploading
                           ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           : <Camera size={14} />}
                         {t.changeShopPhoto}
                       </button>
                       <input ref={shopImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleShopImageChange} />
                     </div>
                   </div>
                 )}

                 {/* Gallery (Professionals only) */}
                 {providerId && (
                   <div className="mb-6 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                     <p className="text-sm font-semibold text-slate-800 dark:text-white mb-1">{t.gallery}</p>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t.galleryDesc}</p>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                       {galleryImages.map((img) => (
                         <div key={img.publicId} className="relative group rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 aspect-[4/3]">
                           <img src={img.url} alt="" className="w-full h-full object-cover" />
                           <button
                             type="button"
                             onClick={() => handleGalleryDelete(img.publicId)}
                             disabled={galleryDeleting === img.publicId}
                             className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-700 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                           >
                             {galleryDeleting === img.publicId
                               ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                               : t.deletePhoto}
                           </button>
                         </div>
                       ))}
                     </div>
                     {galleryImages.length < 8 ? (
                       <button
                         type="button"
                         onClick={() => galleryInputRef.current?.click()}
                         disabled={galleryUploading}
                         className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white transition-colors flex items-center gap-2"
                       >
                         {galleryUploading
                           ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           : <Camera size={14} />}
                         {t.addPhotos}
                       </button>
                     ) : (
                       <p className="text-xs text-slate-500 dark:text-slate-400">{t.galleryFull}</p>
                     )}
                     <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
                   </div>
                 )}

                 {/* Working Schedule (Professionals only) */}
                 {providerId && (
                   <div className="mb-6 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                     <div className="flex items-center gap-2 mb-1">
                       <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                       <p className="text-sm font-semibold text-slate-800 dark:text-white">{t.workSchedule}</p>
                     </div>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t.workDaysDesc}</p>

                     {/* Working Days */}
                     <div className="mb-4">
                       <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">{t.workDaysLabel}</label>
                       <div className="flex flex-wrap gap-2">
                         {t.dayNames.map((name, idx) => (
                           <button
                             key={idx}
                             type="button"
                             onClick={() => toggleWorkingDay(idx)}
                             className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                               workingDays.includes(idx)
                                 ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                                 : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
                             }`}
                           >
                             {name}
                           </button>
                         ))}
                       </div>
                     </div>

                     {/* Working Hours */}
                     <div className="mb-4">
                       <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">{t.workHoursLabel}</label>
                       <div className="flex items-center gap-3 flex-wrap">
                         <div className="flex items-center gap-2">
                           <span className="text-xs text-slate-500 dark:text-slate-400">{t.startTime}</span>
                           <input
                             type="time"
                             value={workingHoursStart}
                             onChange={(e) => setWorkingHoursStart(e.target.value)}
                             className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                           />
                         </div>
                         <span className="text-slate-400">—</span>
                         <div className="flex items-center gap-2">
                           <span className="text-xs text-slate-500 dark:text-slate-400">{t.endTime}</span>
                           <input
                             type="time"
                             value={workingHoursEnd}
                             onChange={(e) => setWorkingHoursEnd(e.target.value)}
                             className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                           />
                         </div>
                       </div>
                     </div>

                     {/* Save Schedule */}
                     <div className="flex items-center gap-4">
                       <button
                         type="button"
                         onClick={handleScheduleSave}
                         disabled={scheduleSaving}
                         className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white transition-colors flex items-center gap-2"
                       >
                         {scheduleSaving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                         {scheduleSaving ? t.saving : t.saveChanges}
                       </button>
                       {scheduleMsg && (
                         <p className={`text-sm ${scheduleMsg.ok ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{scheduleMsg.text}</p>
                       )}
                     </div>
                   </div>
                 )}

                 {/* Services & Pricing (Professionals only) */}
                 {providerId && (
                   <div className="mb-6 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                     <div className="flex items-center gap-2 mb-1">
                       <Tag size={16} className="text-emerald-600 dark:text-emerald-400" />
                       <p className="text-sm font-semibold text-slate-800 dark:text-white">{t.servicesAndPricing}</p>
                     </div>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t.servicesListDesc}</p>

                     {/* Existing services list */}
                     {providerServices.length === 0 ? (
                       <p className="text-sm text-slate-400 dark:text-slate-500 italic mb-3">{t.noServicesListed}</p>
                     ) : (
                       <div className="space-y-2 mb-3">
                         {providerServices.map((svc, idx) => (
                           <div key={idx} className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                             <span className="text-sm text-slate-800 dark:text-white flex-1 truncate">{svc.name}</span>
                             <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">{svc.price.toLocaleString()} DZD</span>
                             <button
                               type="button"
                               onClick={() => handleRemoveService(idx)}
                               className="ml-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors shrink-0"
                               aria-label={t.removeService}
                             >
                               <Trash2 size={14} />
                             </button>
                           </div>
                         ))}
                       </div>
                     )}

                     {/* Add new service row */}
                     <div className="flex flex-wrap gap-2 mb-4">
                       <input
                         type="text"
                         value={newServiceName}
                         onChange={(e) => setNewServiceName(e.target.value)}
                         onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddService(); } }}
                         placeholder={t.serviceNamePlaceholder}
                         className="flex-1 min-w-[160px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                       />
                       <input
                         type="number"
                         value={newServicePrice}
                         onChange={(e) => setNewServicePrice(e.target.value)}
                         onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddService(); } }}
                         placeholder={t.servicePrice}
                         min="0"
                         className="w-32 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                       />
                       <button
                         type="button"
                         onClick={handleAddService}
                         disabled={!newServiceName.trim() || newServicePrice === '' || parseFloat(newServicePrice) < 0}
                         className="px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-1"
                       >
                         <Plus size={14} />
                         {t.addService}
                       </button>
                     </div>

                     {/* Save services */}
                     <div className="flex items-center gap-4">
                       <button
                         type="button"
                         onClick={handleServicesSave}
                         disabled={servicesSaving}
                         className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white transition-colors flex items-center gap-2"
                       >
                         {servicesSaving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                         {servicesSaving ? t.saving : t.saveServices}
                       </button>
                       {servicesMsg && (
                         <p className={`text-sm ${servicesMsg.ok ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{servicesMsg.text}</p>
                       )}
                     </div>
                   </div>
                 )}

                 <form className="space-y-4 max-w-lg" onSubmit={handleProfileSave}>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.fullName}</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.emailLabel}</label>
                      <input type="email" value={user.email} disabled className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 cursor-not-allowed" />
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t.emailCannotChange}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.phoneLabel}</label>
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 transition-colors mt-2 flex items-center gap-2"
                      >
                        {profileSaving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {profileSaving ? t.saving : t.saveChanges}
                      </button>
                      {profileSaveMsg && (
                        <p className={`text-sm mt-2 ${profileSaveMsg.ok ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{profileSaveMsg.text}</p>
                      )}
                    </div>
                 </form>

                 <div className="border-t border-slate-100 dark:border-slate-700 mt-8 pt-8">
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t.changePassword}</h3>
                   <form className="space-y-4 max-w-lg" onSubmit={handlePasswordChange}>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.currentPassword}</label>
                       <input
                         type="password"
                         required
                         placeholder="••••••••"
                         value={currentPw}
                         onChange={(e) => setCurrentPw(e.target.value)}
                         className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.newPassword}</label>
                       <input
                         type="password"
                         required
                         minLength={6}
                         placeholder="••••••••"
                         value={newPw}
                         onChange={(e) => setNewPw(e.target.value)}
                         className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.confirmNewPassword}</label>
                       <input
                         type="password"
                         required
                         minLength={6}
                         placeholder="••••••••"
                         value={confirmPw}
                         onChange={(e) => setConfirmPw(e.target.value)}
                         className={`w-full px-4 py-2 rounded-lg border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white ${
                           confirmPw && confirmPw !== newPw
                             ? 'border-red-400 dark:border-red-600'
                             : 'border-slate-200 dark:border-slate-700'
                         }`}
                       />
                       {confirmPw && confirmPw !== newPw && (
                         <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
                       )}
                     </div>
                     <div className="flex items-center gap-4">
                       <button
                         type="submit"
                         disabled={pwSaving}
                         className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 transition-colors mt-2 flex items-center gap-2"
                       >
                         {pwSaving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                         {pwSaving ? t.saving : t.updatePassword}
                       </button>
                       {pwMsg && (
                         <p className={`text-sm mt-2 ${pwMsg.ok ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                           {pwMsg.text}
                         </p>
                       )}
                     </div>
                   </form>

                   {/* ── Danger Zone ── */}
                   <div className="mt-10 rounded-xl border border-red-200 dark:border-red-900/40 overflow-hidden">
                     <div className="px-4 py-3 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900/40 flex items-center gap-2">
                       <AlertCircle size={16} className="text-red-600 dark:text-red-400 shrink-0" />
                       <span className="text-sm font-bold text-red-700 dark:text-red-400">{t.dangerZone}</span>
                     </div>
                     <div className="p-4 bg-white dark:bg-slate-800">
                       <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t.deleteAccountDesc}</p>
                       {!showDeleteConfirm ? (
                         <button
                           type="button"
                           onClick={() => { setShowDeleteConfirm(true); setDeleteAccountMsg(null); }}
                           className="px-4 py-2 text-sm font-medium rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                         >
                           {t.deleteAccount}
                         </button>
                       ) : (
                         <div className="space-y-3 max-w-sm">
                           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                             {t.deleteAccountConfirmLabel}
                           </label>
                           <input
                             type="password"
                             value={deleteConfirmPw}
                             onChange={(e) => setDeleteConfirmPw(e.target.value)}
                             onKeyDown={(e) => { if (e.key === 'Enter') handleDeleteAccount(); }}
                             autoFocus
                             className="w-full px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                           />
                           {deleteAccountMsg && (
                             <p className="text-sm text-red-600 dark:text-red-400">{deleteAccountMsg}</p>
                           )}
                           <div className="flex gap-3">
                             <button
                               type="button"
                               onClick={handleDeleteAccount}
                               disabled={deleteAccountBusy || !deleteConfirmPw}
                               className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-2"
                             >
                               {deleteAccountBusy && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                               {deleteAccountBusy ? t.deleteAccountDeleting : t.deleteAccountConfirmButton}
                             </button>
                             <button
                               type="button"
                               onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmPw(''); setDeleteAccountMsg(null); }}
                               className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                             >
                               {t.cancel}
                             </button>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewBooking && (
        <ReviewModal
          isOpen={!!reviewBooking}
          onClose={() => setReviewBooking(null)}
          booking={reviewBooking}
          language={language}
          onReviewSubmitted={(bookingId) => {
            setReviewedBookingIds(prev => new Set(prev).add(bookingId));
          }}
        />
      )}

      {/* Decline Modal */}
      {declineBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDeclineBooking(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
              <XCircle size={20} className="text-red-500" /> {t.decline}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {declineBooking.clientName} — {declineBooking.date}
            </p>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.declineReason}
            </label>
            <textarea
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              placeholder={t.declineReasonPlaceholder}
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setDeclineBooking(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDeclineConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                {t.declineConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { Dashboard };

