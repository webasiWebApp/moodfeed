import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type SocketClient = Socket;

interface ChatContextType {
  socket: SocketClient | null;
  currentConversation: string | null;
  setCurrentConversation: (id: string | null) => void;
  isConnected: boolean;
}

const ChatContext = createContext<ChatContextType>({
  socket: null,
  currentConversation: null,
  setCurrentConversation: () => {},
  isConnected: false
});

export const useChatContext = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<SocketClient | null>(null);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socketInstance = io('http://localhost:3000', {
      auth: { token }
    });

    socketInstance.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    socketInstance.on('error', (error: Error) => {
      console.error('Socket error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Handle conversation changes
  useEffect(() => {
    if (!socket) return;

    if (currentConversation) {
      socket.emit('join conversation', currentConversation);
    }

    return () => {
      if (currentConversation) {
        socket.emit('leave conversation', currentConversation);
      }
    };
  }, [currentConversation, socket]);

  return (
    <ChatContext.Provider
      value={{
        socket,
        currentConversation,
        setCurrentConversation,
        isConnected
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};