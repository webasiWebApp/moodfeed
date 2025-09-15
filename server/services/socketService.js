const socketIO = require('socket.io');
const chatService = require('./chatService');
const jwt = require('jsonwebtoken');

class SocketService {
  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: "http://localhost:5173", // Vite default port
        methods: ["GET", "POST"]
      }
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          throw new Error('Authentication error');
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const UserService = require('./userService');
        const user = await UserService.get(decoded.sub);
        
        if (!user) {
          throw new Error('User not found');
        }
        
        socket.userId = user._id.toString(); // Store user ID as string for consistency
        socket.user = user; // Store full user object if needed
        next();
      } catch (err) {
        console.error('Socket authentication error:', err);
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.userId);
      
      // Join user's personal room
      socket.join(socket.userId);

      // Handle joining a conversation
      socket.on('join conversation', (conversationId) => {
        socket.join(conversationId);
      });

      // Handle leaving a conversation
      socket.on('leave conversation', (conversationId) => {
        socket.leave(conversationId);
      });

      // Handle new message
      socket.on('send message', async ({ conversationId, content }) => {
        try {
          console.log('Sending message:', { conversationId, content, userId: socket.userId });
          
          if (!socket.userId) {
            throw new Error('User not authenticated');
          }
          
          const message = await chatService.sendMessage(conversationId, socket.userId, content);
          this.io.to(conversationId).emit('new message', message);

          // Get conversation to notify other participants
          const Conversation = require('../models/Conversation');
          const conversation = await Conversation.findById(conversationId);
          
          if (conversation) {
            conversation.participants.forEach(participantId => {
              if (participantId.toString() !== socket.userId) {
                this.io.to(participantId.toString()).emit('message notification', {
                  conversationId,
                  message
                });
              }
            });
          }
        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('error', { message: error.message });
        }
      });

      // Handle typing status
      socket.on('typing', ({ conversationId, isTyping }) => {
        socket.to(conversationId).emit('user typing', {
          userId: socket.userId,
          isTyping
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.userId);
      });
    });
  }

  // Method to emit events from outside socket context
  emitToUser(userId, event, data) {
    this.io.to(userId.toString()).emit(event, data);
  }
}

module.exports = new SocketService();