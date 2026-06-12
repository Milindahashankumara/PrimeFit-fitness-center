const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const { protect, authorize } = require("../middlewares/auth");
const {
  getRecipients,
  getThreads,
  getInbox,
  getSent,
  getThreadMessages,
  getMessageById,
  sendMessage,
  sendAnnouncement,
  markMessageRead,
  getUnreadCount,
} = require("../controllers/messageController");

const uploadDir = path.join(__dirname, "..", "uploads", "messages");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

router.get("/recipients", protect, getRecipients);
router.get("/threads", protect, getThreads);
router.get("/inbox", protect, getInbox);
router.get("/sent", protect, getSent);
router.get("/unread-count", protect, getUnreadCount);
router.get("/thread/:threadId", protect, getThreadMessages);
router.get("/:id", protect, getMessageById);
router.post("/", protect, upload.array("attachments", 5), sendMessage);
router.post(
  "/broadcast",
  protect,
  authorize("admin"),
  upload.array("attachments", 10),
  sendAnnouncement,
);
router.put("/:id/read", protect, markMessageRead);

module.exports = router;