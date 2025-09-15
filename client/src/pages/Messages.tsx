import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageCircle, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ConversationItem } from '@/components/chat/ConversationItem';
import { getConversations, Conversation } from '@/api/chat';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { ChatProvider } from '@/contexts/ChatContext';

export const Messages: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const fetchedConversations = await getConversations();
      setConversations(fetchedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    const otherParticipant = conversation.participants.find(p => p._id !== 'current-user-id');
    return otherParticipant?.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleConversationClick = (conversationId: string) => {
    setSelectedConversation(conversationId);
    navigate(`/chat/${conversationId}`);
  };

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

  return (
    <ChatProvider>
      <div className="min-h-screen gradient-bg">
        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">Messages</h1>
              <Button
                size="icon"
                className="bg-primary hover:bg-primary/90 text-black rounded-full"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-muted-foreground"
              />
            </div>

            {/* Conversations List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-effect rounded-2xl overflow-hidden"
            >
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No conversations yet</h3>
                  <p className="text-muted-foreground">Start a conversation by messaging someone!</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {filteredConversations.map((conversation) => (
                    <ConversationItem
                      key={conversation._id}
                      conversation={conversation}
                      isSelected={selectedConversation === conversation._id}
                      onClick={() => handleConversationClick(conversation._id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </ChatProvider>
  );
};