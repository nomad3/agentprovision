import api from './api';

export const llmService = {
  async getProviders() {
    const response = await api.get('/llm/providers');
    return response.data;
  },

  async getModels(providerName = null) {
    const url = providerName ? `/llm/models?provider_name=${providerName}` : '/llm/models';
    const response = await api.get(url);
    return response.data;
  },

  async getConfigs() {
    const response = await api.get('/llm/configs');
    return response.data;
  },

  async createConfig(data) {
    const response = await api.post('/llm/configs', data);
    return response.data;
  },
};
