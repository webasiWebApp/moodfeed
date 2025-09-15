import api from './api';
import { AxiosError } from 'axios';

interface User {
  _id: string;
  username: string;
  email: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface ErrorResponse {
  message: string;
}

// Description: Login user functionality
// Endpoint: POST /api/auth/login
// Request: { email: string, password: string }
// Response: { user: User, accessToken: string, refreshToken: string }
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    
    if (!response.data?.accessToken || !response.data?.refreshToken || !response.data?.user) {
      throw new Error('Invalid response from server');
    }
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof AxiosError && error.response?.data) {
      const message = (error.response.data as ErrorResponse).message || error.message;
      throw new Error(message);
    }
    throw new Error('An unknown error occurred during login');
  }
};

// Description: Register user functionality
// Endpoint: POST /api/auth/register
// Request: { username: string, email: string, password: string }
// Response: { user: User, accessToken: string, refreshToken: string }
export const register = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    // Generate a username from the email (temporary)
    const username = email.split('@')[0];
    const response = await api.post<AuthResponse>('/auth/register', {
      username,
      email,
      password
    });
    if (!response.data?.accessToken || !response.data?.refreshToken || !response.data?.user) {
      throw new Error('Invalid response from server');
    }
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      const message = (error.response.data as ErrorResponse).message || error.message;
      throw new Error(message);
    }
    throw new Error('An unknown error occurred during registration');
  }
};

// Description: Logout
// Endpoint: POST /api/auth/logout
// Request: {}
// Response: { success: boolean, message: string }
export const logout = async () => {
  try {
    return await api.post('/auth/logout');
  } catch (error) {
    if (error instanceof AxiosError) {
      const message = (error.response?.data as ErrorResponse)?.message || error.message;
      throw new Error(message);
    }
    throw new Error('An unknown error occurred during logout');
  }
};
