const express = require('express');
const router = express.Router();
const {
  getComplaints,
  getComplaint,
  createComplaint,
  updateComplaint,
  deleteComplaint
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middlewares/auth');

router.route('/')
  .get(protect, getComplaints)
  .post(protect, authorize('customer', 'admin'), createComplaint);

router.route('/:id')
  .get(protect, getComplaint)
  .put(protect, authorize('admin'), updateComplaint)
  .delete(protect, deleteComplaint);

module.exports = router;
