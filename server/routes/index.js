const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const postRoutes = require('./postRoutes');

// Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);

// Root path response
router.get("/", (req, res) => {
  res.status(200).send("Welcome to MoodFeed API!");
});

router.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

router.get("/status", (req, res) => {
  console.log("Server is running")
  res.status(200).send("server is running");
});

module.exports = router;
