import api from './api';

const agentService = {
  getAll: () => api.get('/agents/'),

  getById: (id) => api.get(`/agents/${id}`),

  create: (data) => api.post('/agents/', data),

  update: (id, data) => api.put(`/agents/${id}`, data),

  delete: (id) => api.delete(`/agents/${id}`),

  deploy: (id, deploymentData) => api.post(`/agents/${id}/deploy`, deploymentData),
};

export default agentService;
