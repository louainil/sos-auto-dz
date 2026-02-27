import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true
  },
  providerName: {
    type: String,
    required: true
  },
  providerPhone: {
    type: String,
    default: ''
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientName: {
    type: String,
    required: true
  },
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

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
