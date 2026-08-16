const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { uploadImageToDropbox } = require('../utils/dropboxService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  }
});

router.post('/', auth, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    try {
      const imageUrl = await uploadImageToDropbox(req.file.buffer, req.file.originalname);
      res.json({ imageUrl });
    } catch (error) {
      console.error('Dropbox upload failed:', error);
      res.status(502).json({ message: 'Failed to upload image to Dropbox' });
    }
  });
});

module.exports = router;
