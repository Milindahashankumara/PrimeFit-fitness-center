const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
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
    type: String
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    required: [true, 'Please provide feedback'],
    maxlength: 500
  },
  submittedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedDate: {
    type: Date
  },
  reviewedBy: {
    type: String
  },
  rejectionReason: {
    type: String
  }
}, {
  timestamps: true
});

// Create indexes for efficient queries
feedbackSchema.index({ coachId: 1 });
feedbackSchema.index({ customerId: 1 });
feedbackSchema.index({ status: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
