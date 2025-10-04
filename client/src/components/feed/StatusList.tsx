import React from 'react';
import StatusCard from './StatusCard';
import { useNavigate } from 'react-router-dom';

const StatusList: React.FC = () => {
  const navigate = useNavigate();
  const users = [
    { name: 'user1', avatarUrl: 'https://github.com/shadcn.png' },
    { name: 'user2', avatarUrl: 'https://github.com/shadcn.png' },
    { name: 'user3', avatarUrl: 'https://github.com/shadcn.png' },
    { name: 'user4', avatarUrl: 'https://github.com/shadcn.png' },
    { name: 'user5', avatarUrl: 'https://github.com/shadcn.png' },
    { name: 'user6', avatarUrl: 'https://github.com/shadcn.png' },
    { name: 'user7', avatarUrl: 'https://github.com/shadcn.png' },
  ];

  const handleCreateStatus = () => {
    navigate('/create-status');
  };

  return (
    <div className="w-full overflow-x-auto scrolling-touch">
      <div className="flex space-x-4 p-4 bg-background">
        <StatusCard isCurrentUser onClick={handleCreateStatus} />
        {users.map((user, index) => (
          <StatusCard key={index} user={user} />
        ))}
      </div>
    </div>
  );
};

export default StatusList;
