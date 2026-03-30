const express = require('express');
const router = express.Router();
const {
  getResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  incrementDownload
} = require('../controllers/resourceController');
const { protect, authorize } = require('../middlewares/auth');

router.route('/')
  .get(getResources)
  .post(protect, authorize('admin'), createResource);

router.route('/:id')
  .get(getResource)
  .put(protect, authorize('admin'), updateResource)
  .delete(protect, authorize('admin'), deleteResource);

router.route('/:id/download')
  .put(incrementDownload);

module.exports = router;
