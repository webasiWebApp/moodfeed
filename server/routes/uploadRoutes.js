const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireUser } = require('./middleware/auth');
const UploadService = require('../services/uploadService');
const path = require('path');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const filetypes = /jpeg|jpg|png|gif|mp4|webm|mov/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

// Upload endpoint
router.post('/', requireUser, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload file using UploadService
    const uploadResult = await UploadService.uploadFile(req.file);
    
    res.json({
      url: uploadResult.publicUrl,
      localPath: uploadResult.localPath,
      type: uploadResult.mediaType
    });
  } catch (error) {
    console.error('Upload error:', error);
    next(error);
  }
});

module.exports = router;
