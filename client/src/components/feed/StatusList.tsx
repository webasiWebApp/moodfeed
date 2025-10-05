import React from 'react';
import StatusCard from './StatusCard';
import { useNavigate } from 'react-router-dom';


interface RandomUser {
  name: {
    first: string;
    last: string;
  };
  picture: {
    large: string;
    medium: string;
    thumbnail: string;
  };
}

interface RandomUserResponse {
  results: RandomUser[];
}

interface User {
  name: string;
  avatarUrl: string;
}


const StatusList: React.FC = () => {
  const navigate = useNavigate();

  const [userData, setUserData] = React.useState([
    { name: 'user1', avatarUrl: 'https://randomuser.me/api/portraits/women/74.jpg' },
    { name: 'user2', avatarUrl: 'https://github.com/shadcn.png' },
    { name: 'user3', avatarUrl: 'https://github.com/shadcn.png' },
    { name: 'user4', avatarUrl: 'https://github.com/shadcn.png' },
    { name: 'user5', avatarUrl: 'https://github.com/shadcn.png' },
    { name: 'user6', avatarUrl: 'https://github.com/shadcn.png' },
    { name: 'user7', avatarUrl: 'https://github.com/shadcn.png' },
  ]);
  
async function fetchRandomUsers(count: number = 7): Promise<User[]> {
  try {
    const response = await fetch(`https://randomuser.me/api/?results=${count}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: RandomUserResponse = await response.json();
    
    const users: User[] = data.results.map((user, index) => ({
      name: `${user.name.first} ${user.name.last}`,
      avatarUrl: user.picture.medium
    }));
    
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    // Return fallback users in case of error
    return [
      { name: 'user1', avatarUrl: 'https://randomuser.me/api/portraits/women/74.jpg' },
      { name: 'user2', avatarUrl: 'https://github.com/shadcn.png' },
      { name: 'user3', avatarUrl: 'https://github.com/shadcn.png' },
      { name: 'user4', avatarUrl: 'https://github.com/shadcn.png' },
      { name: 'user5', avatarUrl: 'https://github.com/shadcn.png' },
      { name: 'user6', avatarUrl: 'https://github.com/shadcn.png' },
      { name: 'user7', avatarUrl: 'https://github.com/shadcn.png' },
    ];
  }
}


React.useEffect(() => {
  fetchRandomUsers(7)
    .then(users => setUserData(users))
    .catch(error => console.error('Error fetching users:', error));
}, [1])





  const handleCreateStatus = () => {
    navigate('/create-status');
  };

  return (
    <div className="w-full overflow-x-auto scrolling-touch">
      <div className="flex space-x-4 p-4 bg-background">
        <StatusCard isCurrentUser onClick={handleCreateStatus} />
        {userData.map((user, index) => (
          <StatusCard key={index} user={user} />
        ))}
      </div>
    </div>
  );
};

export default StatusList;
