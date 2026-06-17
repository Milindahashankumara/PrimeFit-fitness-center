const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number']
  },
  role: {
    type: String,
    enum: ['customer', 'coach', 'admin'],
    default: 'customer'
  },
  // Customer-specific fields
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  address: {
    type: String
  },
  city: {
    type: String
  },
  zipCode: {
    type: String
  },
  emergencyContact: {
    type: String
  },
  emergencyPhone: {
    type: String
  },
  fitnessGoals: [{
    type: String
  }],
  medicalConditions: {
    type: String
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    pushNotifications: {
      type: Boolean,
      default: true
    }
  },
  // Coach-specific fields
  experience: {
    type: Number
  },
  specializations: [{
    type: String
  }],
  certifications: [{
    type: String
  }],
  bio: {
    type: String
  },
  hourlyRate: {
    type: Number
  },
  coachStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  appliedDate: {
    type: Date
  },
  documents: [{
    type: String
  }],
  rating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  activeClients: {
    type: Number,
    default: 0
  },
  availability: [{
    id: String,
    day: String,
    startTime: String,
    endTime: String,
    sessionType: String,
    isRecurring: Boolean
  }],
  blockedDates: [{
    id: {
      type: String,
      required: true
    },
    date: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      required: true
    }
  }],
  isAuthenticated: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
