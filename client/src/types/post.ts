import { User } from './user';

export interface Post {
  _id: string;
  author: User;
  content: string;
  mood: string;
  comments: any[]; 
  likes: any[];
  createdAt: string;
  updatedAt: string;
}
