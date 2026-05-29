const Booking = require("../models/Booking");
const User = require("../models/User");

// @desc    Get all bookings (with filters)
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res) => {
  try {
    let query = {};

    // Filter by customer email
    if (req.query.customerEmail) {
      query.customerEmail = req.query.customerEmail;
    }

    // Filter by customer ID
    if (req.query.customerId) {
      query.customerId = req.query.customerId;
    }

    // Filter by coach ID
    if (req.query.coachId) {
      query.coachId = req.query.coachId;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // If user is customer, only show their bookings
    // Support both old format (email) and new format (ObjectId)
    if (req.user.role === "customer") {
      query.$or = [
        { customerId: req.user.id }, // New format: ObjectId
        { customerEmail: req.user.email }, // Old format: email in customerId field
      ];
      delete query.customerId; // Remove the direct customerId filter
    }

    // If user is coach, only show their bookings
    if (req.user.role === "coach") {
      query.coachId = req.user.id;
    }

    const bookings = await Booking.find(query)
      .populate("customerId", "name email")
      .populate("coachId", "name email specializations")
      .sort({ requestedAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("customerId", "name email phone")
      .populate("coachId", "name email specializations hourlyRate");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      booking.customerId._id.toString() !== req.user.id &&
      booking.coachId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this booking",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (Customer)
exports.createBooking = async (req, res) => {
  try {
    console.log("Creating new booking...");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("User:", req.user);

    const {
      coachId,
      coachName,
      date,
      time,
      sessionType,
      type,
      duration,
      price,
      message,
      location,
      customerId,
      customerName,
      customerEmail,
    } = req.body;

    // Create booking data
    const bookingData = {
      customerId: customerId || req.user.id,
      customerName: customerName || req.user.name,
      customerEmail: customerEmail || req.user.email,
      coachId,
      coachName,
      date,
      time,
      sessionType,
      type,
      duration,
      price,
      message,
      location,
      status: "pending",
    };

    console.log(
      "Saving booking to MongoDB:",
      JSON.stringify(bookingData, null, 2),
    );

    const booking = await Booking.create(bookingData);

    console.log("Booking saved to MongoDB successfully!");
    console.log("Booking ID:", booking._id);
    console.log("Saved booking:", JSON.stringify(booking, null, 2));

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Error creating booking:", error.message);
    console.error("Stack:", error.stack);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
exports.updateBooking = async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Prepare update object
    let updateData = {};

    // Check authorization - coach can update status, customer can cancel
    if (req.user.role === "coach") {
      if (booking.coachId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this booking",
        });
      }
      // Coach can update status
      if (req.body.status) {
        updateData.status = req.body.status;
      }
    } else if (req.user.role === "customer") {
      if (booking.customerId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this booking",
        });
      }
      // Customer can only cancel
      if (req.body.status === "cancelled") {
        updateData.status = "cancelled";
      }
    } else if (req.user.role === "admin") {
      // Admin can update anything
      updateData = req.body;
    }

    // Use findByIdAndUpdate to avoid full document validation
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      {
        new: true,
        runValidators: false, // Skip validation for partial updates
      },
    );

    res.status(200).json({
      success: true,
      data: updatedBooking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      booking.customerId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this booking",
      });
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
