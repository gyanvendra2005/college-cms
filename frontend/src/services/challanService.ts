import api from './api';

export const challanService = {
  getChallans: async (params?: any) => {
    const response = await api.get('/challans', { params });
    return response.data;
  },
  getChallanById: async (id: string) => {
    const response = await api.get(`/challans/${id}`);
    return response.data;
  },
  createChallan: async (data: any) => {
    const response = await api.post('/challans', data);
    return response.data;
  },
  confirmChallan: async (id: string) => {
    const response = await api.patch(`/challans/${id}/confirm`);
    return response.data;
  }
};
