const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title']
  },
  content: {
    type: String,
    required: [true, 'Please provide content']
  },
  type: {
    type: String,
    enum: ['general', 'maintenance', 'event', 'promotion', 'urgent'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'customers', 'coaches'],
    default: 'all'
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByName: {
    type: String
  }
}, {
  timestamps: true
});

// Create indexes for efficient queries
announcementSchema.index({ status: 1, publishDate: -1 });
announcementSchema.index({ targetAudience: 1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
