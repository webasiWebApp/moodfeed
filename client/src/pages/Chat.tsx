import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getConversations, Conversation } from '@/api/chat';
import { useToast } from '@/hooks/useToast';
import { ChatProvider } from '@/contexts/ChatContext';
import { Chat as ChatComponent } from '@/components/chat/Chat';
import { useAuth } from '@/contexts/AuthContext';

export const Chat: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const loadConversation = async () => {
      if (!chatId) return;
      
      try {
        const conversations = await getConversations();
        const targetConversation = conversations.find(conv => conv._id === chatId);
        
        if (targetConversation) {
          setConversation(targetConversation);
        } else {
          toast({
            title: "Error",
            description: "Conversation not found",
            variant: "destructive"
          });
          navigate('/messages');
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        toast({
          title: "Error",
          description: "Failed to load conversation",
          variant: "destructive"
        });
        navigate('/messages');
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [chatId, toast, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Conversation not found</h2>
          <Button onClick={() => navigate('/messages')}>
            Back to Messages
          </Button>
        </div>
      </div>
    );
  }

  const otherParticipant = conversation.participants.find(p => p._id !== user?._id);

  return (
    <ChatProvider>
      <div className="min-h-screen gradient-bg flex flex-col">
        {/* Header */}
        <div className="glass-effect border-b border-white/10 p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/messages')}
              className="text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="font-semibold text-white">
                {otherParticipant?.username || 'Chat'}
              </h2>
            </div>
          </div>
        </div>

        {/* Chat Component */}
        <div className="flex-1">
          <ChatComponent
            conversationId={conversation._id}
            participants={conversation.participants}
            isNewConversation={location.state?.isNewConversation}
          />
        </div>
      </div>
    </ChatProvider>
  );
};