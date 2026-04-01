const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['workout-plan', 'nutrition-guide', 'exercise-tutorial', 'wellness-tip', 'article', 'video', 'other']
  },
  fileUrl: {
    type: String
  },
  imageUrl: {
    type: String
  },
  videoUrl: {
    type: String
  },
  content: {
    type: String
  },
  tags: [{
    type: String
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all-levels'],
    default: 'all-levels'
  },
  duration: {
    type: String
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
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
resourceSchema.index({ category: 1, status: 1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ createdAt: -1 });

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;
