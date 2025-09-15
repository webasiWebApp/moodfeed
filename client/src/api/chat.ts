import api from './api';

export interface Message {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    username: string;
    email: string;
  };
  content: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participants: {
    _id: string;
    username: string;
    email: string;
  }[];
  lastMessage?: Message;
  updatedAt: string;
  createdAt: string;
}

// Get all conversations for the current user
export const getConversations = async (): Promise<Conversation[]> => {
  try {
    const response = await api.get('/api/chat/conversations');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to fetch conversations');
  }
};

// Get messages for a specific conversation
export const getMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    const response = await api.get(`/api/chat/conversations/${conversationId}/messages`);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to fetch messages');
  }
};

// Start a new conversation or get existing one
export const startConversation = async (userId: string): Promise<Conversation> => {
  try {
    const response = await api.post('/api/chat/conversations', { userId });
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to start conversation');
  }
};

// Send a message
export const sendMessage = async (conversationId: string, content: string): Promise<Message> => {
  try {
    const response = await api.post(`/api/chat/conversations/${conversationId}/messages`, { content });
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to send message');
  }
};

// Mark conversation messages as read
export const markConversationAsRead = async (conversationId: string): Promise<void> => {
  try {
    await api.post(`/api/chat/conversations/${conversationId}/read`);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to mark conversation as read');
  }
};