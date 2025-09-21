import { User } from './user';

export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User;
  content: string;
  createdAt: string;
  updatedAt: string;
}
