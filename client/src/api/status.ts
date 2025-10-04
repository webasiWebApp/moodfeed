import api  from './api';

export const createStatus = async (content: string, type: string) => {
  try {
    const response = await api.post('/statuses', { content, type });
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
