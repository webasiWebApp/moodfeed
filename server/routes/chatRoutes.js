
const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');
const { requireUser } = require('../routes/middleware/auth');

router.get('/conversations', requireUser, async (req, res) => {
    try {
      const conversations = await chatService.getConversations(req.user._id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: 'Error getting conversations' });
    }
  });
  
  router.post('/conversations/start', requireUser, async (req, res) => {
    try {
      const conversation = await chatService.startConversation(req.user, req.body.author);
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: 'Error starting conversation' });
    }
  });
  
  router.get('/messages/:conversationId', requireUser, async (req, res) => {
    try {
      const messages = await chatService.getConversationMessages(req.params.conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Error getting messages' });
    }
  });
  
  router.post('/messages/send', requireUser, async (req, res) => {
    try {
      const { conversationId, content } = req.body;
      const message = await chatService.sendMessage(conversationId, req.user._id, content);
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: 'Error sending message' });
    }
  });

module.exports = router;
