const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { protect, authorize } = require('../middlewares/auth');

router.route('/')
  .get(getAnnouncements)
  .post(protect, authorize('admin'), createAnnouncement);

router.route('/:id')
  .get(getAnnouncement)
  .put(protect, authorize('admin'), updateAnnouncement)
  .delete(protect, authorize('admin'), deleteAnnouncement);

module.exports = router;
