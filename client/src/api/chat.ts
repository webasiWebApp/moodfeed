import api from './api';
import { User } from '../types/user';
import { Conversation, Message } from '../types/chat';

export const getConversations = async (): Promise<Conversation[]> => {
  const response = await api.get('/chat/conversations');
  return response.data;
};

export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
    const response = await api.get(`/chat/messages/${conversationId}`);
    return response.data;
};

export const startConversation = async (author: User): Promise<Conversation> => {
    const response = await api.post('/chat/conversations/start', { author });
    return response.data;
};

export const sendMessage = async (
  conversationId: string,
  content: string
): Promise<Message> => {
    const response = await api.post('/chat/messages/send', { conversationId, content });
    return response.data;
};
