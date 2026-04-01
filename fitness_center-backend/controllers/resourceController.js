const Resource = require('../models/Resource');

// @desc    Get all resources
// @route   GET /api/resources
// @access  Public
exports.getResources = async (req, res) => {
  try {
    let query = { status: 'published' };

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by difficulty
    if (req.query.difficulty) {
      query.difficulty = req.query.difficulty;
    }

    // Search by title or tags
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { tags: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Admin can see all statuses
    if (req.user && req.user.role === 'admin') {
      if (req.query.status) {
        query.status = req.query.status;
      } else {
        delete query.status;
      }
    }

    const resources = await Resource.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: resources.length,
      data: resources
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Public
exports.getResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Increment view count
    resource.views += 1;
    await resource.save();

    res.status(200).json({
      success: true,
      data: resource
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create resource
// @route   POST /api/resources
// @access  Private (Admin)
exports.createResource = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      fileUrl, 
      imageUrl, 
      videoUrl, 
      content, 
      tags, 
      difficulty, 
      duration, 
      status 
    } = req.body;

    const resource = await Resource.create({
      title,
      description,
      category,
      fileUrl,
      imageUrl,
      videoUrl,
      content,
      tags,
      difficulty: difficulty || 'all-levels',
      duration,
      status: status || 'published',
      createdBy: req.user.id,
      createdByName: req.user.name
    });

    res.status(201).json({
      success: true,
      data: resource
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private (Admin)
exports.updateResource = async (req, res) => {
  try {
    let resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    const allowedUpdates = [
      'title', 'description', 'category', 'fileUrl', 'imageUrl', 'videoUrl', 
      'content', 'tags', 'difficulty', 'duration', 'status'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        resource[field] = req.body[field];
      }
    });

    await resource.save();

    res.status(200).json({
      success: true,
      data: resource
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private (Admin)
exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    await resource.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Increment download count
// @route   PUT /api/resources/:id/download
// @access  Public
exports.incrementDownload = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    resource.downloads += 1;
    await resource.save();

    res.status(200).json({
      success: true,
      data: resource
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
