import mongoose from 'mongoose';

const serviceProviderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['MECHANIC', 'PARTS_SHOP', 'TOWING'],
    required: true
  },
  garageType: {
    type: String,
    enum: ['MECHANIC', 'ELECTRICIAN', 'AUTO_BODY']
  },
  wilayaId: {
    type: Number,
    required: true
  },
  commune: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  phone: {
    type: String,
    required: true
  },
  specialty: [{
    type: String
  }],
  image: {
    type: String,
    default: ''
  },
  images: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true }
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  workingDays: [{
    type: Number,
    min: 0,
    max: 6
  }],
  workingHours: {
    start: {
      type: String,
      default: '08:00'
    },
    end: {
      type: String,
      default: '17:00'
    }
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Text index for search by name/description
serviceProviderSchema.index({ name: 'text', description: 'text' });
// Compound index: common filter pattern (service type + location)
serviceProviderSchema.index({ role: 1, wilayaId: 1 });
// Unique index: one ServiceProvider document per user account
serviceProviderSchema.index({ userId: 1 }, { unique: true });
// Index to speed up admin/verified listing queries
serviceProviderSchema.index({ isVerified: 1, rating: -1 });

const ServiceProvider = mongoose.model('ServiceProvider', serviceProviderSchema);

export default ServiceProvider;
