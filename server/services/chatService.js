const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const mongoose = require('mongoose');

class ChatService {
  // Start or get existing conversation
  async getOrCreateConversation(userIds) {
    let conversation = await Conversation.findOne({
      participants: { $all: userIds }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: userIds
      });
    }

    return conversation;
  }

  // Get user's conversations
  async getUserConversations(userId) {
    return await Conversation.find({ participants: userId })
      .populate('participants', 'username email')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
  }

  // Get messages for a conversation
  async getConversationMessages(conversationId, limit = 50) {
    return await Message.find({ conversation: conversationId })
      .populate('sender', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  // Send a new message
  async sendMessage(conversationId, senderId, content) {
    console.log('ChatService.sendMessage called with:', { conversationId, senderId, content });
    
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    if (!senderId) {
      throw new Error('Sender ID is required');
    }
    if (!content) {
      throw new Error('Message content is required');
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new Error('Invalid conversation ID');
    }
    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      throw new Error('Invalid sender ID');
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content
    });

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      updatedAt: new Date()
    });

    return message.populate('sender', 'username email');
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId, userId) {
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        read: false
      },
      { read: true }
    );
  }
}

module.exports = new ChatService();