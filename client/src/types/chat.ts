import { User } from './user';

export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: Message;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User;
  content: string;
  timestamp: string;
}
