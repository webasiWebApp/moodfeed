import api from './api';

export interface Post {
  _id: string;
  author: {
    _id: string;
    username: string;
    displayName: string;
    avatar: string;
    mood: string;
  };
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
}

export interface Comment {
  _id: string;
  author: {
    _id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  content: string;
  createdAt: string;
}

// Description: Get feed posts with infinite scroll
// Endpoint: GET /api/posts/feed?page=1&limit=10
// Request: { page: number, limit: number }
// Response: { posts: Post[], hasMore: boolean }
export const getFeedPosts = async (page: number = 1, limit: number = 10) => {
  console.log('Fetching feed posts:', { page, limit });
  
  try {
    const response = await api.get(`/posts/feed`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching feed posts:', error);
    throw error;
  }
};

// Description: Get a single post by its ID
// Endpoint: GET /api/posts/:postId
// Request: { postId: string }
// Response: { post: Post }
export const getPostById = async (postId: string) => {
  console.log('Fetching post by ID:', postId);
  try {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    throw error;
  }
};

// Description: Like or unlike a post
// Endpoint: POST /api/posts/:postId/like
// Request: { postId: string }
// Response: { success: boolean, isLiked: boolean, likesCount: number }
export const toggleLikePost = async (postId: string) => {
  console.log('Toggling like for post:', postId);
  try {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

// Description: Get comments for a post
// Endpoint: GET /api/posts/:postId/comments
// Request: { postId: string }
// Response: { comments: Comment[] }
export const getPostComments = async (postId: string) => {
  console.log('Fetching comments for post:', postId);
  
  try {
    const response = await api.get(`/posts/${postId}/comments`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

// Description: Add a comment to a post
// Endpoint: POST /api/posts/:postId/comments
// Request: { postId: string, content: string }
// Response: { success: boolean, comment: Comment }
export const addComment = async (postId: string, content: string) => {
  console.log('Adding comment to post:', { postId, content });
  try {
    const response = await api.post(`/posts/${postId}/comments`, { content });
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Description: Upload media file
// Endpoint: POST /api/upload
// Request: FormData with 'file' field
// Response: { url: string, type: string }
export const uploadMedia = async (file: File) => {
  console.log('Uploading media:', file);
  
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.url;
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
};

// Description: Create a new post
// Endpoint: POST /api/posts
// Request: { content: string, mediaUrl?: string, mediaType?: string, mood?: string }
// Response: { success: boolean, post: Post }
export const createPost = async (data: { 
  content: string; 
  mediaUrl?: string; 
  mediaType?: 'image' | 'video'; 
  mood?: string 
}) => {
  console.log('Creating new post:', data);
  try {
    const response = await api.post('/posts', data);
    return response.data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Description: Track "not for me" action for recommendations
// Endpoint: POST /api/posts/:postId/not-for-me
// Request: { postId: string }
// Response: { success: boolean }
export const markNotForMe = async (postId: string) => {
  console.log('Marking post as not for me:', postId);
  try {
    const response = await api.post(`/posts/${postId}/not-for-me`);
    return response.data;
  } catch (error) {
    console.error('Error marking post as not for me:', error);
    throw error;
  }
};