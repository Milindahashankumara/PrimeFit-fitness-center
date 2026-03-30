const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coachName: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: [true, 'Please provide a booking date']
  },
  time: {
    type: String,
    required: [true, 'Please provide a booking time']
  },
  sessionType: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['personal', 'group', 'online'],
    required: true
  },
  duration: {
    type: Number,
    required: true,
    default: 60
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled', 'rescheduled'],
    default: 'pending'
  },
  message: {
    type: String
  },
  location: {
    type: String
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  // Reschedule fields
  rescheduledBy: {
    type: String,
    enum: ['coach', 'customer', null],
    default: null
  },
  originalDate: {
    type: String
  },
  originalTime: {
    type: String
  },
  rescheduleReason: {
    type: String
  },
  rescheduledAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes for efficient queries
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ coachId: 1, status: 1 });
bookingSchema.index({ date: 1, coachId: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
