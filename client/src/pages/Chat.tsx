
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';
import { Message, getConversationMessages } from '../api/chat';
import { useAuth } from '../contexts/AuthContext';
import io, { Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Chat() {
  const { chatId } = useParams<{ chatId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (chatId) {
      getConversationMessages(chatId).then(setMessages);

      const accessToken = localStorage.getItem('accessToken');
      socketRef.current = io({
        transports: ['polling', 'websocket'],
        auth: {
          token: accessToken,
        },
      });

      socketRef.current.emit('joinRoom', chatId);

      socketRef.current.on('receiveMessage', (message: Message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [chatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && chatId && user && socketRef.current) {
      const messageData = {
        content: newMessage,
        sender: user._id,
        conversation: chatId,
      };
      
      socketRef.current.emit('sendMessage', {
        roomId: chatId,
        message: messageData,
      });

      // Optimistically update the UI
      const optimisticMessage: Message = {
        _id: Date.now().toString(),
        content: newMessage,
        sender: {
          _id: user._id,
          username: user.username,
          profile: user.profile,
        },
        conversation: chatId,
        createdAt: new Date().toISOString(),
      };
      setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
      setNewMessage('');
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/messages')}
            className="text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">Chat</h1>
          <div className="w-10" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col glass-effect p-4 rounded-xl overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-end gap-2 ${message.sender._id === user?._id ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender._id !== user?._id && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={message.sender.profile?.avatarUrl} />
                    <AvatarFallback>{message.sender.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${
                    message.sender._id === user?._id
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-white/10 text-white rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="mt-4">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-transparent border-white/20 text-white placeholder:text-white/50 rounded-full px-4 py-2"
                placeholder="Type a message..."
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="p-2 bg-primary rounded-full text-white"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
