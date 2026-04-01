const express = require('express');
const router = express.Router();
const {
  getCoaches,
  getCoach,
  updateCoachStatus,
  updateCoach,
  deleteCoach
} = require('../controllers/coachController');
const { protect, authorize, optionalAuth } = require('../middlewares/auth');

router.route('/')
  .get(optionalAuth, getCoaches);

router.route('/:id')
  .get(getCoach)
  .put(protect, authorize('coach', 'admin'), updateCoach)
  .delete(protect, authorize('admin'), deleteCoach);

router.route('/:id/status')
  .put(protect, authorize('admin'), updateCoachStatus);

module.exports = router;
