import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface User {
  _id: string;
  username: string;
  avatar?: string;
}

interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  updatedAt: string;
}

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({ 
  conversation, 
  isSelected, 
  onClick 
}) => {
  const { user } = useAuth();
  const otherParticipant = conversation.participants.find(p => p._id !== user?._id);

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b cursor-pointer hover:bg-accent/50 transition-colors ${
        isSelected ? 'bg-accent' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        <Avatar>
          <AvatarImage src={otherParticipant?.avatar || "/default-avatar.png"} alt={otherParticipant?.username} />
          <AvatarFallback>{otherParticipant?.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{otherParticipant?.username}</h3>
          {conversation.lastMessage && (
            <p className="text-sm text-muted-foreground truncate">
              {conversation.lastMessage.content}
            </p>
          )}
        </div>
        {conversation.lastMessage && (
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
          </div>
        )}
      </div>
    </div>
  );
};