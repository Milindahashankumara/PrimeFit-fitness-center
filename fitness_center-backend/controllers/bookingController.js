const Booking = require("../models/Booking");
const User = require("../models/User");

// Get all bookings (with filters)
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

// Get single booking
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

// Create new booking
exports.createBooking = async (req, res) => {
  try {
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

    const booking = await Booking.create(bookingData);

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update booking
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
    let unsetFields = {};

    // Check authorization - coach can update status, customer can cancel
    if (req.user.role === "coach") {
      if (booking.coachId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this booking",
        });
      }
      // Coach can update all fields sent in the request
      Object.keys(req.body).forEach(key => {
        if (req.body[key] === null) {
          unsetFields[key] = "";
        } else {
          updateData[key] = req.body[key];
        }
      });
    } else if (req.user.role === "customer") {
      if (booking.customerId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this booking",
        });
      }
      // Customer can only update specific fields
      if (req.body.status === "cancelled") {
        updateData.status = "cancelled";
        updateData.cancelledAt = new Date();
        updateData.cancelledBy = "customer";
        if (req.body.cancellationReason) {
          updateData.cancellationReason = req.body.cancellationReason;
        }
      } else if (req.body.status === "pending_reschedule" && req.body.rescheduleRequest) {
        // Customer requesting reschedule - needs coach approval
        updateData.status = "pending_reschedule";
        updateData.rescheduleRequest = req.body.rescheduleRequest;
      } else {
        // Customer trying to update other fields - not allowed
        updateData = {};
      }
    } else if (req.user.role === "admin") {
      // Admin can update anything
      updateData = req.body;
    }

    // Use findByIdAndUpdate to avoid full document validation
    const updateQuery = { $set: updateData };
    if (Object.keys(unsetFields).length > 0) {
      updateQuery.$unset = unsetFields;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateQuery,
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

// Delete booking
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
