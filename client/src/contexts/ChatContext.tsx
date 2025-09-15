
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Conversation, getConversations } from '../api/chat';
import { useAuth } from './AuthContext';

interface ChatContextType {
  conversations: Conversation[];
  loading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getConversations(user._id)
        .then(setConversations)
        .finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <ChatContext.Provider value={{ conversations, loading }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
