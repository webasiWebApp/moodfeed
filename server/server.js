// Load environment variables
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const path = require('path');
const basicRoutes = require("./routes/index");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const { connectDB } = require("./config/database");
const cors = require("cors");

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL variables in .env missing.");
  process.exit(-1);
}

const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 3000;
// Initialize Socket.IO
const socketService = require('./services/socketService');
socketService.initialize(server);
// Pretty-print JSON responses
app.enable('json spaces');
// We want to be consistent with URL paths, so we enable strict routing
app.enable('strict routing');

// Configure CORS
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
connectDB();

// Error event handler
app.on("error", (error) => {
  console.error(`Server error: ${error.message}`);
  console.error(error.stack);
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'userUploadedFilesForPost')));

// API Routes
const chatRoutes = require('./routes/chatRoutes');
app.use('/api', basicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
// Set up static file serving with proper CORS and caching
app.use('/uploads', express.static(path.join(__dirname, 'userUploadedFilesForPost'), {
  setHeaders: (res, path) => {
    // Enable CORS for media files
    res.set('Access-Control-Allow-Origin', 'http://localhost:5173');
    // Set cache control for better performance
    res.set('Cache-Control', 'public, max-age=31557600'); // Cache for 1 year
    // Set content type based on file extension
    if (path.endsWith('.mp4')) {
      res.set('Content-Type', 'video/mp4');
    }
  }
}));

app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// If no routes handled the request, it's a 404
app.use((req, res, next) => {
  res.status(404).send("Page not found.");
});

// Error handling
app.use((err, req, res, next) => {
  console.error(`Unhandled application error: ${err.message}`);
  console.error(err.stack);
  res.status(500).send("There was an error serving your request.");
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// asdf1234