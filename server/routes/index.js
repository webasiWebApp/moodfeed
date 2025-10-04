const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const postRoutes = require('./postRoutes');
const statusRoutes = require('./statusRoutes');

// Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/statuses', statusRoutes);

// Root path response
router.get("/", (req, res) => {
  res.status(200).send("Welcome to MoodFeed API!");
});

router.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

router.get("/status", (req, res) => {
  console.log("Server is running 1")
  res.status(200).send("server is running 1");
 });

module.exports = router;