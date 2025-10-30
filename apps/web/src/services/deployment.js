import api from './api';

const deploymentService = {
  getAll: () => api.get('/deployments'),

  getById: (id) => api.get(`/deployments/${id}`),

  create: (data) => api.post('/deployments', data),

  update: (id, data) => api.put(`/deployments/${id}`, data),

  delete: (id) => api.delete(`/deployments/${id}`),

  getStatus: (id) => api.get(`/deployments/${id}/status`),

  start: (id) => api.post(`/deployments/${id}/start`),

  stop: (id) => api.post(`/deployments/${id}/stop`),

  restart: (id) => api.post(`/deployments/${id}/restart`),

  getLogs: (id, params) => api.get(`/deployments/${id}/logs`, { params }),
};

export default deploymentService;
