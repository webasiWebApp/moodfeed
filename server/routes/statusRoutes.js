const express = require('express');
const router = express.Router();
const statusService = require('../services/statusService');
const authMiddleware = require('./middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads/statuses';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Upload files to the 'uploads/statuses' directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  },
});

const upload = multer({ storage: storage });

router.post('/create', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.userId;
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    const content = req.file.path; // The path to the uploaded image
    const type = 'image'; // Assuming 'image' type for file uploads

    const status = await statusService.createStatus(userId, content, type);
    res.status(201).json(status);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create status' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const statuses = await statusService.getStatuses(req.user.userId);
    res.status(200).json(statuses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve statuses' });
  }
});

module.exports = router;
