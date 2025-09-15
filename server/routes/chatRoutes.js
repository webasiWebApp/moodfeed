const express = require('express');
const router = express.Router();
const auth = require('./middleware/auth');
const chatService = require('../services/chatService');

// Get all conversations for the current user
router.get('/conversations', auth.requireUser, async (req, res) => {
  try {
    const conversations = await chatService.getUserConversations(req.user._id);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', auth.requireUser, async (req, res) => {
  try {
    const messages = await chatService.getConversationMessages(req.params.conversationId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start a new conversation or get existing one
router.post('/conversations', auth.requireUser, async (req, res) => {
  try {
    const { userId } = req.body;
    const conversation = await chatService.getOrCreateConversation([req.user._id, userId]);
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send a message
router.post('/conversations/:conversationId/messages', auth.requireUser, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await chatService.sendMessage(req.params.conversationId, req.user._id, content);
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark conversation messages as read
router.post('/conversations/:conversationId/read', auth.requireUser, async (req, res) => {
  try {
    await chatService.markMessagesAsRead(req.params.conversationId, req.user._id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;