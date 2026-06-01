const path = require("path");
const Resource = require("../models/Resource");

const getFileUrl = (req, file) => {
  if (!file) return undefined;
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/uploads/resources/${file.filename}`;
};

const getFileSize = (sizeInBytes) => {
  const mb = sizeInBytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(1)} MB`;
  }

  const kb = sizeInBytes / 1024;
  return `${kb.toFixed(1)} KB`;
};

// Get all resources
exports.getResources = async (req, res) => {
  try {
    let query = { status: "published" };

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
        { title: { $regex: req.query.search, $options: "i" } },
        { tags: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Admin can see all statuses
    if (req.user && req.user.role === "admin") {
      if (req.query.status) {
        query.status = req.query.status;
      } else {
        delete query.status;
      }
    }

    const resources = await Resource.find(query)
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single resource
exports.getResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).populate(
      "createdBy",
      "name email",
    );

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    // Increment view count
    resource.views += 1;
    await resource.save();

    res.status(200).json({
      success: true,
      data: resource,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create resource
exports.createResource = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      fileUrl,
      imageUrl,
      videoUrl,
      linkUrl,
      content,
      tags,
      difficulty,
      duration,
      status,
      type,
    } = req.body;

    const uploadedFile = req.file;
    const normalizedType =
      type ||
      (uploadedFile && uploadedFile.mimetype.startsWith("image/")
        ? "image"
        : "document");
    const fileUrlFromUpload = getFileUrl(req, uploadedFile);
    const fileName = uploadedFile ? uploadedFile.originalname : undefined;
    const fileSize = uploadedFile ? getFileSize(uploadedFile.size) : undefined;
    const mimeType = uploadedFile ? uploadedFile.mimetype : undefined;
    const resolvedVideoUrl =
      normalizedType === "video" ? videoUrl || linkUrl : videoUrl;
    const resolvedLinkUrl = normalizedType === "link" ? linkUrl : undefined;

    if (
      (normalizedType === "document" || normalizedType === "image") &&
      !uploadedFile &&
      !fileUrl &&
      !imageUrl
    ) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file for document or image resources",
      });
    }

    if (normalizedType === "link" && !linkUrl) {
      return res.status(400).json({
        success: false,
        message: "Please provide a URL for link resources",
      });
    }

    const resource = await Resource.create({
      title,
      description,
      category,
      type: normalizedType,
      fileUrl:
        normalizedType === "document" ? fileUrlFromUpload || fileUrl : fileUrl,
      imageUrl:
        normalizedType === "image" ? fileUrlFromUpload || imageUrl : imageUrl,
      videoUrl: resolvedVideoUrl,
      linkUrl: resolvedLinkUrl,
      content,
      tags: Array.isArray(tags)
        ? tags
        : typeof tags === "string" && tags.trim()
          ? tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
      difficulty: difficulty || "all-levels",
      duration,
      status: status || "published",
      fileName: fileName,
      fileSize: fileSize,
      mimeType: mimeType,
      createdBy: req.user.id,
      createdByName: req.user.name,
    });

    res.status(201).json({
      success: true,
      data: resource,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update resource
exports.updateResource = async (req, res) => {
  try {
    let resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    const uploadedFile = req.file;
    const fileUrlFromUpload = getFileUrl(req, uploadedFile);
    const fileName = uploadedFile ? uploadedFile.originalname : undefined;
    const fileSize = uploadedFile ? getFileSize(uploadedFile.size) : undefined;
    const mimeType = uploadedFile ? uploadedFile.mimetype : undefined;
    const resolvedType = req.body.type || resource.type;
    const resolvedVideoUrl =
      resolvedType === "video"
        ? req.body.videoUrl || req.body.linkUrl
        : req.body.videoUrl;
    const resolvedLinkUrl =
      resolvedType === "link" ? req.body.linkUrl : undefined;

    const allowedUpdates = [
      "title",
      "description",
      "category",
      "fileUrl",
      "imageUrl",
      "videoUrl",
      "linkUrl",
      "content",
      "tags",
      "difficulty",
      "duration",
      "status",
      "type",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        resource[field] = req.body[field];
      }
    });

    if (resolvedType === "video") {
      resource.videoUrl = resolvedVideoUrl;
      resource.linkUrl = undefined;
    } else if (resolvedType === "link") {
      resource.linkUrl = resolvedLinkUrl;
      resource.videoUrl = undefined;
    }

    const nextType = resolvedType;
    if (uploadedFile) {
      if (nextType === "image") {
        resource.imageUrl = fileUrlFromUpload;
        resource.fileUrl = undefined;
      } else if (nextType === "document") {
        resource.fileUrl = fileUrlFromUpload;
        resource.imageUrl = undefined;
      } else {
        resource.fileUrl = fileUrlFromUpload;
      }
      resource.fileName = fileName;
      resource.fileSize = fileSize;
      resource.mimeType = mimeType;
    }

    if (typeof resource.tags === "string") {
      resource.tags = resource.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    await resource.save();

    res.status(200).json({
      success: true,
      data: resource,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete resource
exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    await resource.deleteOne();

    res.status(200).json({
      success: true,
      message: "Resource deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Increment download count
exports.incrementDownload = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    resource.downloads += 1;
    await resource.save();

    res.status(200).json({
      success: true,
      data: resource,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
