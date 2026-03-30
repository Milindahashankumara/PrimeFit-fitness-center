const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Please provide a subject']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['coach', 'facility', 'booking', 'billing', 'other']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description']
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  response: {
    type: String
  },
  responseDate: {
    type: Date
  },
  resolvedBy: {
    type: String
  }
}, {
  timestamps: true
});

// Create indexes for efficient queries
complaintSchema.index({ customerEmail: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ createdAt: -1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
