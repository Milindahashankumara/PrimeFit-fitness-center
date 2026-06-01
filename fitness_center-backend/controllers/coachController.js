const User = require("../models/User");

// Get all coaches (with optional filters)
exports.getCoaches = async (req, res) => {
  try {
    let query = { role: "coach" };

    // Filter by approval status (for admin)
    if (req.query.coachStatus) {
      // Explicit filter requested
      query.coachStatus = req.query.coachStatus;
    } else {
      // Default behavior: only show approved coaches unless user is admin
      if (!req.user || req.user.role !== "admin") {
        query.coachStatus = "approved";
      }
    }

    // Search by name or specialization
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { specializations: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Filter by specialization
    if (req.query.specialization) {
      query.specializations = req.query.specialization;
    }

    const coaches = await User.find(query).select("-password");

    res.status(200).json({
      success: true,
      count: coaches.length,
      data: coaches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single coach
exports.getCoach = async (req, res) => {
  try {
    // Validate ObjectId format
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coach ID format",
      });
    }

    const coach = await User.findOne({
      _id: req.params.id,
      role: "coach",
    }).select("-password");

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: "Coach not found",
      });
    }

    res.status(200).json({
      success: true,
      data: coach,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update coach status (Admin only - approve/reject)
exports.updateCoachStatus = async (req, res) => {
  try {
    const { coachStatus, rejectionReason } = req.body;

    // Validate ObjectId format
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coach ID format",
      });
    }

    const coach = await User.findOne({
      _id: req.params.id,
      role: "coach",
    });

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: "Coach not found",
      });
    }

    coach.coachStatus = coachStatus;

    if (rejectionReason) {
      coach.rejectionReason = rejectionReason;
    }

    await coach.save();

    res.status(200).json({
      success: true,
      data: coach,
      message: `Coach application ${coachStatus}`,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update coach profile
exports.updateCoach = async (req, res) => {
  try {
    // Validate ObjectId format
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coach ID format",
      });
    }

    let coach = await User.findOne({
      _id: req.params.id,
      role: "coach",
    });

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: "Coach not found",
      });
    }

    // Check authorization
    if (req.user.role !== "admin" && coach._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this coach profile",
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      "name",
      "phone",
      "bio",
      "specializations",
      "certifications",
      "hourlyRate",
      "experience",
      "availability",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        coach[field] = req.body[field];
      }
    });

    await coach.save();

    res.status(200).json({
      success: true,
      data: coach,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete coach (Admin only)
exports.deleteCoach = async (req, res) => {
  try {
    // Validate ObjectId format
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coach ID format",
      });
    }

    const coach = await User.findOne({
      _id: req.params.id,
      role: "coach",
    });

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: "Coach not found",
      });
    }

    await coach.deleteOne();

    res.status(200).json({
      success: true,
      message: "Coach deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
