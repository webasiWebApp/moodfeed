
// Load environment variables
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const basicRoutes = require("./routes/index");
const authRoutes =require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require('./routes/postRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const chatRoutes = require('./routes/chatRoutes');
const videoRoutes = require('./routes/videoRoutes');
const chatService = require('./services/chatService');
const { connectDB } = require("./config/database");
const cors = require("cors");

if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  console.error("Error: DATABASE_URL or JWT_SECRET variables in .env missing.");
  process.exit(-1);
}

const app = express();
const server = http.createServer(app);

const port = process.env.PORT || 3000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const corsOptions = {
  origin: [
    clientUrl,
    "https://5173-firebase-moodfeed-1757952544072.cluster-owzhzna3l5cj6tredjpnwucna4.cloudworkstations.dev",
    "https://3000-firebase-moodfeed-1757952544072.cluster-owzhzna3l5cj6tredjpnwucna4.cloudworkstations.dev",
    "https://9000-firebase-moodfeed-1757952544072.cluster-owzhzna3l5cj6tredjpnwucna4.cloudworkstations.dev"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.enable('json spaces');
app.enable('strict routing');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

connectDB();

app.on("error", (error) => {
  console.error(`Server error: ${error.message}`);
  console.error(error.stack);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api', basicRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'userUploadedFilesForPost'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', clientUrl);
    res.set('Cache-Control', 'public, max-age=31557600');
    if (path.endsWith('.mp4')) {
      res.set('Content-Type', 'video/mp4');
    }
  }
}));

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

const io = new Server(server, {
  cors: {
    origin: [
      "https://5173-firebase-moodfeed-1757952544072.cluster-owzhzna3l5cj6tredjpnwucna4.cloudworkstations.dev",
      "https://3000-firebase-moodfeed-1757952544072.cluster-owzhzna3l5cj6tredjpnwucna4.cloudworkstations.dev",
      "https://9000-firebase-moodfeed-1757952544072.cluster-owzhzna3l5cj6tredjpnwucna4.cloudworkstations.dev"
    ],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  allowEIO3: true
});

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub).select('-password');
    if (!user) {
      return next(new Error('Authentication error'));
    }
    socket.user = user;
    next();
  } catch (error) {
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('a user connected:', socket.user.username);
  socket.join(socket.user._id.toString());

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.user.username} joined room: ${roomId}`);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { roomId, message } = data;
      const savedMessage = await chatService.sendMessage(roomId, socket.user._id, message.content);
      io.to(roomId).emit('receiveMessage', savedMessage);
      console.log(savedMessage);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  socket.on('call-user', (data) => {
    io.to(data.userToCall).emit('call-user', { signal: data.signalData, from: data.from });
  });

  socket.on('answer-call', (data) => {
    io.to(data.to).emit('call-accepted', data.signal);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.user.username);
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
