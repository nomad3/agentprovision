import api from './api';

const toolService = {
  getAll: () => api.get('/tools'),

  getById: (id) => api.get(`/tools/${id}`),

  create: (data) => api.post('/tools', data),

  update: (id, data) => api.put(`/tools/${id}`, data),

  delete: (id) => api.delete(`/tools/${id}`),

  test: (id, testData) => api.post(`/tools/${id}/test`, testData),
};

export default toolService;
