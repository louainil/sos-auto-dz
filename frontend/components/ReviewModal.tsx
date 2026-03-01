import React, { useState } from 'react';
import { X, Star, CheckCircle } from 'lucide-react';
import { Booking } from '../types';
import { reviewsAPI } from '../api';
import { Language, translations } from '../translations';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  language?: Language;
  onReviewSubmitted?: (bookingId: string) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, booking, language = 'en', onReviewSubmitted }) => {
  const t = translations[language];
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    setError('');

    try {
      await reviewsAPI.create({
        bookingId: booking.id,
        providerId: booking.providerId,
        rating,
        comment: comment.trim() || undefined
      });
      setSuccess(true);
      onReviewSubmitted?.(booking.id);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setComment('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white">{t.reviewModalTitle}</h3>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            /* Success State */
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t.reviewSuccess}</h4>
              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    size={24}
                    className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-600'}
                  />
                ))}
              </div>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            /* Review Form */
            <form onSubmit={handleSubmit}>
              {/* Provider info */}
              <div className="text-center mb-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                  {t.reviewForProvider}
                </p>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{booking.providerName}</h4>
                <p className="text-xs text-slate-400 mt-1">{booking.date} — {booking.issue}</p>
              </div>

              {/* Star Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 text-center">
                  {t.yourRating}
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        size={36}
                        className={`transition-colors ${
                          star <= (hoveredRating || rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating === 0 && (
                  <p className="text-xs text-slate-400 text-center mt-2">{t.tapToRate}</p>
                )}
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.yourReview}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t.reviewPlaceholder}
                  maxLength={1000}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none transition-all"
                />
                <p className="text-xs text-slate-400 text-right mt-1">{comment.length}/1000</p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className="w-full py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t.submittingReview : t.submitReview}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
