import api  from './api';

export const createStatus = async (content: object) => {
  try {
    const response = await api.post('/statuses/create', { content});
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Failed to create status';
  }
};

const getStatuses = async () => {
  try {
    const response = await api.get('/statuses');
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Failed to get statuses';
  }
};

export const statusApi = {
  createStatus,
  getStatuses,
};
