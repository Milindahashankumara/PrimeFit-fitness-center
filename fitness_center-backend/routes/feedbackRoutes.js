const express = require('express');
const router = express.Router();
const {
  getAllFeedback,
  getApprovedTestimonials,
  getFeedback,
  createFeedback,
  updateFeedback,
  deleteFeedback
} = require('../controllers/feedbackController');
const { protect, authorize } = require('../middlewares/auth');

router.route('/')
  .get(protect, getAllFeedback)
  .post(protect, authorize('customer', 'admin'), createFeedback);

router.get('/testimonials', getApprovedTestimonials);

router.route('/:id')
  .get(protect, getFeedback)
  .put(protect, authorize('admin'), updateFeedback)
  .delete(protect, deleteFeedback);

module.exports = router;
