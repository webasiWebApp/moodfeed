
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

class ChatService {
    async getConversations(userId) {
        const conversations = await Conversation.find({ participants: userId })
            .populate({
                path: 'participants',
                select: 'username _id',
            })
            .populate({
                path: 'lastMessage',
                populate: {
                    path: 'sender',
                    select: 'username _id',
                },
            })
            .sort({ updatedAt: -1 });
        return conversations;
    }

    async startConversation(user, author) {
        const existingConversation = await Conversation.findOne({
            participants: { $all: [user._id, author._id] },
        });

        if (existingConversation) {
            return existingConversation;
        }

        const newConversation = new Conversation({
            participants: [user._id, author._id],
        });

        await newConversation.save();
        return newConversation.populate('participants', 'username _id');
    }

    async getConversationMessages(conversationId) {
        const messages = await Message.find({ conversationId })
            .populate('sender', 'username _id')
            .sort({ createdAt: 'asc' }); 
        return messages;
    }

    async sendMessage(conversationId, senderId, content) {
        const newMessage = new Message({
            conversationId,
            sender: senderId,
            content,
        });

        await newMessage.save();

        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: newMessage._id,
            updatedAt: Date.now(), 
        });

        return newMessage.populate('sender', 'username _id');
    }
}

module.exports = new ChatService();
