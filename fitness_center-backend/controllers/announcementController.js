const Announcement = require("../models/Announcement");

// Get all announcements
exports.getAnnouncements = async (req, res) => {
  try {
    let query = { status: "published" };

    // Filter by target audience
    if (req.query.targetAudience) {
      query.$or = [
        { targetAudience: req.query.targetAudience },
        { targetAudience: "all" },
      ];
    }

    // Filter by type
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Admin can see all statuses
    if (req.user && req.user.role === "admin") {
      if (req.query.status) {
        query.status = req.query.status;
      } else {
        delete query.status;
      }
    }

    const announcements = await Announcement.find(query)
      .populate("createdBy", "name")
      .sort({ publishDate: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single announcement
exports.getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate(
      "createdBy",
      "name email",
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      priority,
      targetAudience,
      status,
      expiryDate,
    } = req.body;

    const announcement = await Announcement.create({
      title,
      content,
      type: type || "general",
      priority: priority || "medium",
      targetAudience: targetAudience || "all",
      status: status || "published",
      expiryDate,
      createdBy: req.user.id,
      createdByName: req.user.name,
    });

    res.status(201).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update announcement
exports.updateAnnouncement = async (req, res) => {
  try {
    let announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    const allowedUpdates = [
      "title",
      "content",
      "type",
      "priority",
      "targetAudience",
      "status",
      "expiryDate",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        announcement[field] = req.body[field];
      }
    });

    await announcement.save();

    res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    await announcement.deleteOne();

    res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
