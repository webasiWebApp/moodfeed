import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Plus } from 'lucide-react';

interface StatusCardProps {
  isCurrentUser?: boolean;
  user?: {
    name: string;
    avatarUrl: string;
  };
  onClick?: () => void;
}

const StatusCard: React.FC<StatusCardProps> = ({ isCurrentUser = false, user, onClick }) => {
  return (
    <div className="flex flex-col items-center space-y-1 flex-shrink-0 w-18" onClick={onClick}>
      <div className="relative">
        <Avatar className="w-16 h-16 border-2 border-green-500">
          <AvatarImage src={user?.avatarUrl} alt={user?.name} />
          <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
        </Avatar>
        {isCurrentUser && (
          <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1 border-2 border-background">
            <Plus className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
   <p className="text-xs text-white truncate">{isCurrentUser ? 'You' : user?.name && user.name.length > 10 ? user.name.substring(0, 8) + ".." : user?.name }</p>
    </div>
  );
};

export default StatusCard;
