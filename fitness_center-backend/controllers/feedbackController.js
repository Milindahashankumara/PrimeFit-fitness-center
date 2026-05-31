const Feedback = require('../models/Feedback');
const User = require('../models/User');

// @desc    Get all feedback
// @route   GET /api/feedback
// @access  Private
exports.getAllFeedback = async (req, res) => {
  try {
    let query = {};

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by coach
    if (req.query.coachId) {
      query.coachId = req.query.coachId;
    }

    // If user is customer, only show their feedback
    if (req.user.role === 'customer') {
      query.customerId = req.user.id;
    }

    // If user is coach, only show feedback for them
    if (req.user.role === 'coach') {
      query.coachId = req.user.id;
    }

    const feedback = await Feedback.find(query)
      .populate('customerId', 'name email')
      .populate('coachId', 'name specializations')
      .sort({ submittedDate: -1 });

    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get approved testimonials for the public homepage
// @route   GET /api/feedback/testimonials
// @access  Public
exports.getApprovedTestimonials = async (req, res) => {
  try {
    const testimonials = await Feedback.find({ status: 'approved' })
      .select('customerName rating feedback submittedDate coachName')
      .sort({ submittedDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single feedback
// @route   GET /api/feedback/:id
// @access  Private
exports.getFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('coachId', 'name specializations');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && 
        feedback.customerId._id.toString() !== req.user.id &&
        feedback.coachId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this feedback'
      });
    }

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create feedback
// @route   POST /api/feedback
// @access  Private (Customer)
exports.createFeedback = async (req, res) => {
  try {
    const { sessionId, coachId, coachName, rating, feedback: feedbackText } = req.body;

    // Verify coach exists
    const coach = await User.findById(coachId);
    if (!coach || coach.role !== 'coach') {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    // Create feedback
    const newFeedback = await Feedback.create({
      sessionId,
      coachId,
      coachName: coachName || coach.name,
      customerId: req.user.id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      rating,
      feedback: feedbackText,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: newFeedback
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update feedback status (Admin only - for moderation)
// @route   PUT /api/feedback/:id
// @access  Private (Admin)
exports.updateFeedback = async (req, res) => {
  try {
    let feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    const { status, rejectionReason } = req.body;

    if (status) {
      feedback.status = status;
      feedback.reviewedDate = new Date();
      feedback.reviewedBy = req.user.name;
    }

    if (rejectionReason) {
      feedback.rejectionReason = rejectionReason;
    }

    // If approved, update coach rating
    if (status === 'approved') {
      const coach = await User.findById(feedback.coachId);
      if (coach) {
        const totalRating = (coach.rating * coach.reviewCount) + feedback.rating;
        coach.reviewCount += 1;
        coach.rating = totalRating / coach.reviewCount;
        await coach.save();
      }
    }

    await feedback.save();

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private (Admin or Owner)
exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && feedback.customerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this feedback'
      });
    }

    await feedback.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
