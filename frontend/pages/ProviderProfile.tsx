import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Phone, MapPin, Clock, MessageCircle, Wrench, Truck, ArrowLeft, ShieldCheck, Image, X, Edit3 } from 'lucide-react';
import { ServiceProvider, User, UserRole, Booking } from '../types';
import { Language, translations } from '../translations';
import { providersAPI, reviewsAPI, bookingsAPI } from '../api';
import { WILAYAS } from '../constants';
import DistanceIndicator from '../components/DistanceIndicator';
import ReviewModal from '../components/ReviewModal';

const ProviderMap = lazy(() => import('../components/ProviderMap'));

interface Review {
  _id: string;
  rating: number;
  comment?: string;
  clientName: string;
  createdAt: string;
}

interface ProviderProfileProps {
  language: Language;
  userLocation: { lat: number; lng: number } | null;
  onBook: (provider: ServiceProvider) => void;
  user?: User | null;
}

const ProviderProfile: React.FC<ProviderProfileProps> = ({ language, userLocation, onBook, user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = translations[language];
  const isRTL = language === 'ar';

  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [reviewableBooking, setReviewableBooking] = useState<Booking | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const [providerRes, reviewsRes] = await Promise.all([
          providersAPI.getById(id),
          reviewsAPI.getByProvider(id)
        ]);
        setProvider(providerRes);
        setReviews(Array.isArray(reviewsRes) ? reviewsRes : []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Fetch user's completed bookings with this provider to enable reviewing
  useEffect(() => {
    if (!id || !user) return;
    const findReviewableBooking = async () => {
      try {
        const allBookings = await bookingsAPI.getAll();
        // Find a completed booking with this provider that hasn't been reviewed
        const completed = allBookings.filter(
          (b: any) => b.providerId === id && b.status === 'COMPLETED'
        );
        for (const b of completed) {
          try {
            const check = await reviewsAPI.checkBooking(b._id);
            if (!check.reviewed) {
              setReviewableBooking({
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
                price: b.price,
              });
              return;
            }
          } catch { /* ignore */ }
        }
        setReviewableBooking(null);
      } catch { /* not logged in or no bookings */ }
    };
    findReviewableBooking();
  }, [id, user, reviews.length]);

  const handleReviewSubmitted = async () => {
    setShowReviewModal(false);
    setReviewableBooking(null);
    // Refresh reviews list
    if (id) {
      try {
        const reviewsRes = await reviewsAPI.getByProvider(id);
        setReviews(Array.isArray(reviewsRes) ? reviewsRes : []);
      } catch { /* ignore */ }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-slate-600 dark:text-slate-400">{t.providerNotFound}</p>
        <Link to="/" className="text-blue-600 hover:underline flex items-center gap-2">
          <ArrowLeft size={16} />
          {t.backToList}
        </Link>
      </div>
    );
  }

  const providerWilaya = WILAYAS.find(w => w.id === provider.wilayaId);

  const getStatus = () => {
    if (!provider.isAvailable) return { text: t.unavailable, color: 'bg-red-500', isBookable: false };
    if (!provider.workingDays || !provider.workingHours) return { text: t.unavailable, color: 'bg-slate-400', isBookable: true };
    const now = new Date();
    const currentDay = now.getDay();
    const currentTimeValue = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = provider.workingHours.start.split(':').map(Number);
    const [endH, endM] = provider.workingHours.end.split(':').map(Number);
    if (!provider.workingDays.includes(currentDay)) return { text: t.closedToday, color: 'bg-slate-500', isBookable: true };
    if (currentTimeValue >= startH * 60 + startM && currentTimeValue <= endH * 60 + endM) {
      return { text: t.openNow, color: 'bg-green-500', isBookable: true };
    }
    return { text: t.closedNow, color: 'bg-slate-500', isBookable: true };
  };

  const status = getStatus();
  const allDays = [0, 1, 2, 3, 4, 5, 6];

  const formatWhatsApp = (phone: string) => {
    const d = phone.replace(/\D/g, '');
    return d.startsWith('0') ? '213' + d.slice(1) : d;
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Hero / Header */}
      <div className="relative">
        {provider.role === UserRole.TOWING ? (
          <div className="h-56 bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center">
            <Truck size={80} className="text-white/80" />
          </div>
        ) : (
          <div className="h-56 md:h-72 overflow-hidden">
            <img
              src={provider.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&size=800&background=0f172a&color=f8fafc&bold=true`}
              alt={provider.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}
        <div className={`absolute bottom-4 ${isRTL ? 'right-4 md:right-8' : 'left-4 md:left-8'}`}>
          <div className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${status.color}`}>
            {status.text}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 pb-12 -mt-8 relative z-10">
        {/* Back link */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4 mt-2">
          <ArrowLeft size={14} />
          {t.backToList}
        </button>

        {/* Main card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 p-6 md:p-8">
          {/* Name + role badge + rating */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 inline-block ${
                provider.role === UserRole.TOWING ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                provider.role === UserRole.PARTS_SHOP ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
              }`}>
                {provider.role.replace('_', ' ')}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">{provider.name}</h1>
            </div>
            <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-lg">
              <Star size={20} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xl font-bold text-slate-800 dark:text-white">{provider.rating}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">({reviews.length} {t.customerReviews.toLowerCase()})</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">{provider.description}</p>

          {/* Contact + Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <Phone size={18} className="text-blue-500" />
                {t.contactInfo}
              </h2>
              <div className="space-y-2">
                <a href={`tel:${provider.phone}`} className="block text-blue-600 dark:text-blue-400 hover:underline">{provider.phone}</a>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <MapPin size={18} className="text-red-500" />
                {t.location}
              </h2>
              <p className="text-slate-600 dark:text-slate-300">{provider.commune}, {providerWilaya?.name}</p>
              {providerWilaya && (
                <div className="mt-1">
                  <DistanceIndicator
                    userLat={userLocation?.lat}
                    userLng={userLocation?.lng}
                    targetLat={providerWilaya.latitude}
                    targetLng={providerWilaya.longitude}
                    language={language}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Working Schedule */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <Clock size={18} className="text-green-500" />
              {t.workingSchedule}
            </h2>
            {provider.workingHours ? (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                  {provider.workingHours.start} - {provider.workingHours.end}
                </p>
                <div className="flex flex-wrap gap-2">
                  {allDays.map(day => {
                    const isWorking = provider.workingDays?.includes(day);
                    return (
                      <span
                        key={day}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isWorking
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-slate-200 text-slate-400 dark:bg-slate-600 dark:text-slate-500 line-through'
                        }`}
                      >
                        {t.dayNames[day]}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t.hoursNotSet}</p>
            )}
          </div>

          {/* Specialties */}
          {provider.specialty && provider.specialty.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <Wrench size={18} className="text-purple-500" />
                {t.specialties}
              </h2>
              <div className="flex flex-wrap gap-2">
                {provider.specialty.map((spec, i) => (
                  <span key={i} className="text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg">
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Photo Gallery */}
          {provider.images && provider.images.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <Image size={18} className="text-indigo-500" />
                {t.photoGallery}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {provider.images.map((img, i) => (
                  <button
                    key={img.publicId || i}
                    onClick={() => setLightboxImg(img.url)}
                    className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <img src={img.url} alt={`${provider.name} photo ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            {provider.role === UserRole.TOWING || provider.role === UserRole.PARTS_SHOP ? (
              <>
                <a href={`tel:${provider.phone}`} className="flex-1 min-w-[140px] bg-slate-900 dark:bg-blue-600 text-white py-3 rounded-lg font-medium text-sm hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
                  <Phone size={18} />
                  {t.callNow}
                </a>
                <a href={`https://wa.me/${formatWhatsApp(provider.phone)}`} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[140px] bg-green-500 text-white py-3 rounded-lg font-medium text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                  <MessageCircle size={18} />
                  WhatsApp
                </a>
              </>
            ) : (
              <>
                <button
                  onClick={() => onBook(provider)}
                  disabled={!status.isBookable}
                  className="flex-1 min-w-[140px] bg-slate-900 dark:bg-blue-600 text-white py-3 rounded-lg font-medium text-sm hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Wrench size={16} />
                  {t.bookNow}
                </button>
                <a href={`tel:${provider.phone}`} className="min-w-[140px] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-lg font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                  <Phone size={18} />
                  {t.callNow}
                </a>
              </>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="mt-6">
          <Suspense fallback={
            <div className="h-[300px] rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            <ProviderMap
              providers={[provider]}
              userLocation={userLocation}
              language={language}
              singleMode
              height="300px"
            />
          </Suspense>
        </div>

        {/* Reviews Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 p-6 md:p-8 mt-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Star size={20} className="text-yellow-400" />
            {t.customerReviews} ({reviews.length})
          </h2>

          {/* Leave a Review button */}
          {reviewableBooking && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="mb-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Edit3 size={18} />
              {t.leaveReview}
            </button>
          )}

          {reviews.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">{t.noReviewsYet}</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="border-b border-slate-100 dark:border-slate-700 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                      {review.clientName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                      <span className="font-medium text-slate-800 dark:text-white text-sm">{review.clientName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-600'}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-slate-600 dark:text-slate-300 text-sm">{review.comment}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(review.createdAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {reviewableBooking && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          booking={reviewableBooking}
          language={language}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Lightbox overlay */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
          <img
            src={lightboxImg}
            alt=""
            className="max-w-full max-h-[90vh] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ProviderProfile;
