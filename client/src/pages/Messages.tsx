import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone } from 'lucide-react';
import { Conversation, getConversations } from '../api/chat';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { User } from '../types/user';

const timeAgo = (date: string | undefined): string => {
    if (!date) return '';
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
};


export function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      getConversations().then(setConversations);
    }
  }, [user]);

  const getParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p._id !== user?._id);
  };

  const handleCallClick = (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/chat/${conversationId}?start_call=true`);
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Inbox</h1>
          <div className="w-10" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {conversations.map((conversation, index) => {
            const participant = getParticipant(conversation);
            if (!participant) return null;

            return (
              <motion.div
                key={conversation._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                  <Card className="glass-effect border-none hover:bg-white/10 transition-colors duration-300" onClick={() => navigate(`/chat/${conversation._id}`)}>
                  <CardContent className="p-4 flex items-center space-x-4">
                    <div className="flex-1 flex items-center space-x-4">
                        <Avatar className="w-12 h-12 border-2 border-primary">
                            <AvatarImage src={participant?.profile?.avatarUrl} />
                            <AvatarFallback>{participant?.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className='flex justify-between items-center'>
                                <p className="font-bold text-white">{participant?.username}</p>
                                <p className="text-xs text-white/50">
                                    {timeAgo(conversation.lastMessage?.createdAt)}
                                </p>
                            </div>
                            <p className="text-sm text-white/70 truncate">
                            {conversation.lastMessage?.content || 'No messages yet'}
                            </p>
                        </div>
                    </div>
                    <Button variant='ghost' size='icon' onClick={(e) => handleCallClick(e, conversation._id)}>
                        <Phone className="text-white" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {conversations.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-20"
          >
            <p className="text-white/70">You have no messages.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
