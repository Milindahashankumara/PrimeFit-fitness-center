const express = require('express');
const router = express.Router();
const {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middlewares/auth');

router.route('/')
  .get(protect, getBookings)
  .post(protect, authorize('customer', 'admin'), createBooking);

router.route('/:id')
  .get(protect, getBooking)
  .put(protect, updateBooking)
  .delete(protect, deleteBooking);

module.exports = router;
