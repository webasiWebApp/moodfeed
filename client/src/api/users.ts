import api from './api';

export interface User {
  _id: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  bio: string;
  mood: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
}

// Description: Get current user profile
// Endpoint: GET /api/users/me
// Request: {}
// Response: { success: boolean, user: User }
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Update user profile
// Endpoint: PUT /users/me
// Request: { displayName?: string, bio?: string, mood?: string, avatar?: string }
// Response: { success: boolean, user: User }
export const updateProfile = async (data: { displayName?: string; bio?: string; mood?: string; avatar?: string }) => {
  try {
    const response = await api.put('/users/me', data);
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get user profile by username
// Endpoint: GET /users/:username
// Request: { username: string }
// Response: { success: boolean, user: User }
export const getUserProfile = async (username: string) => {
  try {
    const response = await api.get(`/users/${username}`);
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};