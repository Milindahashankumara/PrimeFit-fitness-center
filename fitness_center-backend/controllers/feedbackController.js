const Feedback = require("../models/Feedback");
const User = require("../models/User");
const Booking = require("../models/Booking");

// Get all feedback
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

    // If user is customer, and they are not querying a specific coach's reviews, only show their feedback
    if (req.user.role === "customer" && !req.query.coachId) {
      query.customerId = req.user.id;
    }

    // If user is coach, and they are not querying a specific coach's reviews, only show feedback for them
    if (req.user.role === "coach" && !req.query.coachId) {
      query.coachId = req.user.id;
    }

    const feedback = await Feedback.find(query)
      .populate("customerId", "name email")
      .populate("coachId", "name specializations")
      .sort({ submittedDate: -1 });

    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get approved testimonials for the public homepage
exports.getApprovedTestimonials = async (req, res) => {
  try {
    const testimonials = await Feedback.find({ status: "approved" })
      .select("customerName rating feedback submittedDate coachName")
      .sort({ submittedDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single feedback
exports.getFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate("customerId", "name email")
      .populate("coachId", "name specializations");

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      feedback.customerId._id.toString() !== req.user.id &&
      feedback.coachId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this feedback",
      });
    }

    res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create feedback
exports.createFeedback = async (req, res) => {
  try {
    const {
      sessionId,
      coachId,
      coachName,
      rating,
      feedback: feedbackText,
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID (sessionId) is required",
      });
    }

    if (!coachId) {
      return res.status(400).json({
        success: false,
        message: "Coach ID is required",
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rating between 1 and 5",
      });
    }

    if (!feedbackText) {
      return res.status(400).json({
        success: false,
        message: "Feedback text is required",
      });
    }

    // Verify coach exists
    const coach = await User.findById(coachId);
    if (!coach || coach.role !== "coach") {
      return res.status(404).json({
        success: false,
        message: "Coach not found",
      });
    }

    // Verify booking exists
    const booking = await Booking.findById(sessionId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Verify booking belongs to customer
    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to rate this booking",
      });
    }

    // Verify booking status is Completed
    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "You can only rate completed bookings",
      });
    }

    // Verify booking has not already been reviewed
    const existingFeedback = await Feedback.findOne({ sessionId });
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: "This booking has already been reviewed",
      });
    }

    // Create feedback (auto-approved so it updates stats immediately and is visible)
    const newFeedback = await Feedback.create({
      sessionId,
      coachId,
      coachName: coachName || coach.name,
      customerId: req.user.id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      rating,
      feedback: feedbackText,
      status: "approved",
      submittedDate: new Date(),
    });

    // Update coach statistics dynamically from all approved reviews
    const approvedReviews = await Feedback.find({ coachId, status: "approved" });
    const count = approvedReviews.length;
    const avg = count > 0 ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

    coach.reviewCount = count;
    coach.rating = avg;
    await coach.save();

    res.status(201).json({
      success: true,
      data: newFeedback,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update feedback status (Admin only - for moderation)
exports.updateFeedback = async (req, res) => {
  try {
    let feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
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
    if (status === "approved") {
      const coach = await User.findById(feedback.coachId);
      if (coach) {
        const totalRating = coach.rating * coach.reviewCount + feedback.rating;
        coach.reviewCount += 1;
        coach.rating = totalRating / coach.reviewCount;
        await coach.save();
      }
    }

    await feedback.save();

    res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete feedback
exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      feedback.customerId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this feedback",
      });
    }

    await feedback.deleteOne();

    res.status(200).json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
