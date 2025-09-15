import React, { useState, useEffect, useRef } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { Message, getMessages, markConversationAsRead } from '@/api/chat';
import { useAuth } from '@/contexts/AuthContext';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatProps {
  conversationId: string;
  participants: { _id: string; username: string }[];
  isNewConversation?: boolean;
}

interface TypingEvent {
  userId: string;
  isTyping: boolean;
}

export const Chat: React.FC<ChatProps> = ({ conversationId, participants }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const { socket } = useChatContext();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial messages and join conversation
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const fetchedMessages = await getMessages(conversationId);
        setMessages(fetchedMessages.reverse()); // Show newest messages at the bottom
        await markConversationAsRead(conversationId);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    if (conversationId) {
      loadMessages();
      
      // Join the conversation room
      if (socket) {
        socket.emit('join conversation', conversationId);
      }
    }

    // Cleanup: leave conversation when component unmounts or conversation changes
    return () => {
      if (socket && conversationId) {
        socket.emit('leave conversation', conversationId);
      }
    };
  }, [conversationId, socket]);

  // Handle new messages
  useEffect(() => {
    if (!socket) return;

    socket.on('new message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      markConversationAsRead(conversationId);
    });

    socket.on('user typing', ({ userId, isTyping: typing }: TypingEvent) => {
      if (userId !== user?._id) {
        setIsTyping(typing);
        
        // Clear existing timeout
        if (typingTimeout) {
          clearTimeout(typingTimeout);
        }
        
        // Set new timeout to hide typing indicator
        if (typing) {
          const timeout = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
          setTypingTimeout(timeout);
        }
      }
    });

    return () => {
      socket.off('new message');
      socket.off('user typing');
    };
  }, [socket, conversationId, user?._id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!socket || !newMessage.trim()) return;

    socket.emit('send message', {
      conversationId,
      content: newMessage.trim()
    });

    setNewMessage('');
  };

  const handleTyping = () => {
    if (!socket) return;
    socket.emit('typing', { conversationId, isTyping: true });

    // Stop typing indicator after 2 seconds
    setTimeout(() => {
      socket.emit('typing', { conversationId, isTyping: false });
    }, 2000);
  };

  const getOtherParticipant = () => {
    return participants.find(p => p._id !== user?._id)?.username || 'Chat';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">{getOtherParticipant()}</h2>
        {isTyping && <p className="text-sm text-gray-500">Typing...</p>}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                <p className="text-sm">Start the conversation by sending a message!</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.sender._id === user?._id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.sender._id === user?._id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p>{message.content}</p>
                  <span className="text-xs opacity-70">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              handleTyping();
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button onClick={handleSend} disabled={!newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};