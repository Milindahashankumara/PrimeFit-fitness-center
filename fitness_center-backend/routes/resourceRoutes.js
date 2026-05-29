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
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '..', 'uploads', 'resources');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({ storage });

router.route('/')
  .get(getResources)
  .post(protect, authorize('admin'), upload.single('file'), createResource);

router.route('/:id')
  .get(getResource)
  .put(protect, authorize('admin'), upload.single('file'), updateResource)
  .delete(protect, authorize('admin'), deleteResource);

router.route('/:id/download')
  .put(incrementDownload);

module.exports = router;
