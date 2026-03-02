import mongoose from 'mongoose';

/**
 * DESIGN DECISION — Denormalized name/phone fields (providerName, providerPhone,
 * clientName, clientPhone) are intentional snapshots captured at booking creation time.
 *
 * Rationale:
 *  - Bookings are contracts: the record should reflect who was involved and how to
 *    reach them *when the booking was made*, regardless of later profile changes.
 *  - Avoids broken references if a user account is deleted or a provider is removed.
 *  - Consistent with standard booking/e-commerce history patterns.
 *
 * If a user later updates their name or phone, past bookings correctly retain the
 * original contact details; only new bookings will capture the updated values.
 */
const bookingSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true
  },
  /** Snapshot of provider name at booking creation time. See design note above. */
  providerName: {
    type: String,
    required: true
  },
  /** Snapshot of provider phone at booking creation time. See design note above. */
  providerPhone: {
    type: String,
    default: ''
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  /** Snapshot of client name at booking creation time. See design note above. */
  clientName: {
    type: String,
    required: true
  },
  /** Snapshot of client phone at booking creation time. See design note above. */
  clientPhone: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  issue: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  price: {
    type: Number
  }
}, {
  timestamps: true
});

// Indexes for the two main booking history query patterns
bookingSchema.index({ clientId: 1, createdAt: -1 });
bookingSchema.index({ providerId: 1, createdAt: -1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
