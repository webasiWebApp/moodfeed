
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Conversation, getConversations } from '../api/chat';
import { useAuth } from '../contexts/AuthContext';

export function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      getConversations().then(setConversations);
    }
  }, [user]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Inbox</h1>
      <div className="space-y-2">
        {conversations.map((conversation) => (
          <Link to={`/chat/${conversation._id}`} key={conversation._id} className="block p-4 border rounded-lg hover:bg-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gray-200"></div>
              <div>
                <p className="font-bold">{conversation.participants.find(p => p._id !== user?._id)?.username}</p>
                <p className="text-sm text-gray-500">{conversation.lastMessage?.content}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
