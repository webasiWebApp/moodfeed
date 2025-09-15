// import api from './api';

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface Chat {
  _id: string;
  participants: {
    _id: string;
    username: string;
    displayName: string;
    avatar: string;
    isOnline: boolean;
  }[];
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
}

// Description: Get all chat conversations
// Endpoint: GET /api/messages/chats
// Request: {}
// Response: { chats: Chat[] }
export const getChats = () => {
  console.log('Fetching chat conversations');
  
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockChats: Chat[] = [
        {
          _id: 'chat1',
          participants: [
            {
              _id: 'user1',
              username: 'johndoe',
              displayName: 'John Doe',
              avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
              isOnline: true
            }
          ],
          lastMessage: {
            content: 'Hey! How are you doing?',
            createdAt: '2024-01-15T12:30:00Z',
            senderId: 'user1'
          },
          unreadCount: 2
        },
        {
          _id: 'chat2',
          participants: [
            {
              _id: 'user2',
              username: 'sarahwilson',
              displayName: 'Sarah Wilson',
              avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
              isOnline: false
            }
          ],
          lastMessage: {
            content: 'Thanks for sharing that post!',
            createdAt: '2024-01-15T11:15:00Z',
            senderId: 'current-user'
          },
          unreadCount: 0
        }
      ];
      
      resolve({ chats: mockChats });
    }, 500);
  });
  
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.get('/api/messages/chats');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};

// Description: Get messages for a specific chat
// Endpoint: GET /api/messages/chat/:chatId
// Request: { chatId: string }
// Response: { messages: Message[] }
export const getChatMessages = (chatId: string) => {
  console.log('Fetching messages for chat:', chatId);
  
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockMessages: Message[] = [
        {
          _id: 'msg1',
          senderId: 'user1',
          receiverId: 'current-user',
          content: 'Hey! How are you doing?',
          createdAt: '2024-01-15T12:30:00Z',
          isRead: true
        },
        {
          _id: 'msg2',
          senderId: 'current-user',
          receiverId: 'user1',
          content: 'I\'m doing great! Just posted a new photo. How about you?',
          createdAt: '2024-01-15T12:32:00Z',
          isRead: true
        },
        {
          _id: 'msg3',
          senderId: 'user1',
          receiverId: 'current-user',
          content: 'That\'s awesome! I saw it, really nice shot 📸',
          createdAt: '2024-01-15T12:35:00Z',
          isRead: false
        }
      ];
      
      resolve({ messages: mockMessages });
    }, 400);
  });
  
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.get(`/api/messages/chat/${chatId}`);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};

// Description: Send a message
// Endpoint: POST /api/messages
// Request: { receiverId: string, content: string }
// Response: { success: boolean, message: Message }
export const sendMessage = (receiverId: string, content: string) => {
  console.log('Sending message:', { receiverId, content });
  
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: {
          _id: 'new-msg-' + Date.now(),
          senderId: 'current-user',
          receiverId,
          content,
          createdAt: new Date().toISOString(),
          isRead: false
        }
      });
    }, 300);
  });
  
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.post('/api/messages', { receiverId, content });
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};

// Description: Start a chat with a user
// Endpoint: POST /api/messages/chat
// Request: { userId: string }
// Response: { success: boolean, chatId: string }
export const startChat = (userId: string) => {
  console.log('Starting chat with user:', userId);
  
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        chatId: 'chat-' + userId + '-' + Date.now()
      });
    }, 400);
  });
  
  // Uncomment the below lines to make an actual API call
  // try {
  //   return await api.post('/api/messages/chat', { userId });
  // } catch (error) {
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};