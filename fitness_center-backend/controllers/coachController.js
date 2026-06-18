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

    // Validate and merge blockedDates if provided
    if (req.body.blockedDates !== undefined) {
      const blockedDates = req.body.blockedDates;
      if (!Array.isArray(blockedDates)) {
        return res.status(400).json({
          success: false,
          message: "blockedDates must be an array",
        });
      }

      // Helper function for time to minutes conversion
      const timeToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
      };

      for (const block of blockedDates) {
        if (!block.id) {
          block.id = Math.random().toString(36).substring(2, 9);
        }
        if (!block.date || !block.reason) {
          return res.status(400).json({
            success: false,
            message: "Each blocked date must have a date and reason",
          });
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(block.date)) {
          return res.status(400).json({
            success: false,
            message: `Invalid date format: ${block.date}. Expected YYYY-MM-DD.`,
          });
        }

        // If blockType is time-slot, validate start and end times
        if (block.blockType === "time-slot") {
          if (!block.startTime || !block.endTime) {
            return res.status(400).json({
              success: false,
              message: "Start time and end time are required for time-slot blocks",
            });
          }

          const startMin = timeToMinutes(block.startTime);
          const endMin = timeToMinutes(block.endTime);

          if (startMin >= endMin) {
            return res.status(400).json({
              success: false,
              message: `Start time (${block.startTime}) must be before end time (${block.endTime})`,
            });
          }

          // Check if blocked time is within the coach's availability
          let availability = req.body.availability !== undefined ? req.body.availability : coach.availability;
          if (typeof availability === "string") {
            try {
              availability = JSON.parse(availability);
            } catch (e) {
              availability = [];
            }
          }
          if (!Array.isArray(availability)) {
            availability = [];
          }

          const [year, month, dayVal] = block.date.split("-").map(Number);
          const dateObj = new Date(year, month - 1, dayVal);
          const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const weekdayName = weekdays[dateObj.getDay()];

          const daySlots = availability.filter((s) => s && s.day === weekdayName && s.startTime && s.endTime);
          
          // Verify it fits inside at least one availability window on that day
          const fits = daySlots.some((slot) => {
            const availStart = timeToMinutes(slot.startTime);
            const availEnd = timeToMinutes(slot.endTime);
            return startMin >= availStart && endMin <= availEnd;
          });

          if (!fits) {
            return res.status(400).json({
              success: false,
              message: `Blocked time ${block.startTime}-${block.endTime} on ${block.date} (${weekdayName}) is not within the coach's scheduled availability`,
            });
          }
        }
      }

      // Merge overlapping/adjacent ranges per date
      const blocksByDate = {};
      for (const block of blockedDates) {
        if (!blocksByDate[block.date]) {
          blocksByDate[block.date] = [];
        }
        blocksByDate[block.date].push(block);
      }

      const mergedBlockedDates = [];

      for (const date in blocksByDate) {
        const blocks = blocksByDate[date];
        
        // If there's any full-day block, collapse all blocks into one full-day block
        const hasFullDay = blocks.some((b) => b.blockType === "full-day" || !b.blockType);
        if (hasFullDay) {
          const firstFullDay = blocks.find((b) => b.blockType === "full-day" || !b.blockType);
          mergedBlockedDates.push({
            id: firstFullDay.id,
            date: firstFullDay.date,
            reason: firstFullDay.reason,
            blockType: "full-day",
          });
          continue;
        }

        // Merge time-slot blocks
        const timeBlocks = blocks.filter((b) => b.blockType === "time-slot");
        timeBlocks.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        const mergedTimeBlocks = [];
        for (const current of timeBlocks) {
          if (mergedTimeBlocks.length === 0) {
            mergedTimeBlocks.push({
              id: current.id,
              date: current.date,
              reason: current.reason,
              blockType: "time-slot",
              startTime: current.startTime,
              endTime: current.endTime,
            });
          } else {
            const last = mergedTimeBlocks[mergedTimeBlocks.length - 1];
            const lastEnd = timeToMinutes(last.endTime);
            const currStart = timeToMinutes(current.startTime);
            const currEnd = timeToMinutes(current.endTime);

            // Merge if they overlap or are adjacent (lastEnd >= currStart)
            if (lastEnd >= currStart) {
              if (currEnd > lastEnd) {
                last.endTime = current.endTime;
              }
              // Merge reasons
              if (last.reason !== current.reason) {
                last.reason = `${last.reason}, ${current.reason}`;
              }
            } else {
              mergedTimeBlocks.push({
                id: current.id,
                date: current.date,
                reason: current.reason,
                blockType: "time-slot",
                startTime: current.startTime,
                endTime: current.endTime,
              });
            }
          }
        }

        mergedBlockedDates.push(...mergedTimeBlocks);
      }

      req.body.blockedDates = mergedBlockedDates;
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
      "blockedDates",
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
