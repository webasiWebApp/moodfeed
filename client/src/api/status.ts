import api  from './api';

const createStatus = async (content: string, type: string) => {
  try {
    const response = await api.post('/status', { content, type });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Failed to create status';
  }
};

const getStatuses = async () => {
  try {
    const response = await api.get('/status');
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Failed to get statuses';
  }
};

export const statusApi = {
  createStatus,
  getStatuses,
};
