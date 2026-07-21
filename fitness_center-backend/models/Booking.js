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
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled', 'rescheduled', 'pending_reschedule'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
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
  },
  // Reschedule request fields (pending approval)
  rescheduleRequest: {
    requestedDate: String,
    requestedTime: String,
    requestReason: String,
    requestedAt: Date,
    requestedBy: {
      type: String,
      enum: ['customer', 'coach']
    }
  },
  // Cancellation fields
  cancellationReason: String,
  cancelledAt: Date,
  cancelledBy: {
    type: String,
    enum: ['customer', 'coach', 'admin']
  },
  // Rejection fields
  rejectionReason: String
}, {
  timestamps: true
});

// Create indexes for efficient queries
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ coachId: 1, status: 1 });
bookingSchema.index({ date: 1, coachId: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
