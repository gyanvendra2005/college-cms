import api from './api';

export const customerService = {
  getCustomers: async (params?: any) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },
  getCustomer: async (id: string) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },
  createCustomer: async (data: any) => {
    const response = await api.post('/customers', data);
    return response.data;
  },
  updateCustomer: async (id: string, data: any) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },
  addNote: async (id: string, note: string) => {
    const response = await api.post(`/customers/${id}/notes`, { note });
    return response.data;
  }
};
