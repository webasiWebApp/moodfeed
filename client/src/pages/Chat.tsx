
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Message, getConversationMessages, sendMessage } from '../api/chat';
import { useAuth } from '../contexts/AuthContext';

export function Chat() {
  const { chatId } = useParams<{ chatId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (chatId) {
      getConversationMessages(chatId).then(setMessages);
    }
  }, [chatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && chatId && user) {
      const sentMessage = await sendMessage(chatId, newMessage);
      setMessages((prevMessages) => [sentMessage, ...prevMessages]);
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message._id} className={`flex ${message.sender._id === user?._id ? 'justify-end' : 'justify-start'} mb-2`}>
            <div className={`rounded-lg px-4 py-2 ${message.sender._id === user?._id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 border rounded-full px-4 py-2"
            placeholder="Type a message..."
          />
          <button type="submit" className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-full">Send</button>
        </div>
      </form>
    </div>
  );
}
