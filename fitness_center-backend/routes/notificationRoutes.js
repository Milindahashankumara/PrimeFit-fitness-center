const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");

router.use(protect);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadNotificationCount);
router.put("/read-all", markAllNotificationsRead);
router.put("/:id/read", markNotificationRead);

module.exports = router;