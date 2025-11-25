import api from './api';

export const brandingService = {
  async getBranding() {
    const response = await api.get('/branding');
    return response.data;
  },

  async updateBranding(data) {
    const response = await api.put('/branding', data);
    return response.data;
  },

  async getFeatures() {
    const response = await api.get('/features');
    return response.data;
  },

  async updateFeatures(data) {
    const response = await api.put('/features', data);
    return response.data;
  },
};
