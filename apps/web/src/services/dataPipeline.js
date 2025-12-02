import api from './api';

const dataPipelineService = {
  getAll: () => api.get('/data_pipelines/'),

  getById: (id) => api.get(`/data_pipelines/${id}`),

  create: (data) => api.post('/data_pipelines/', data),

  update: (id, data) => api.put(`/data_pipelines/${id}`, data),

  delete: (id) => api.delete(`/data_pipelines/${id}`),

  execute: (id, params) => api.post(`/data_pipelines/${id}/execute`, params),

  getExecutionHistory: (id) => api.get(`/data_pipelines/${id}/executions`),

  getStatus: (id) => api.get(`/data_pipelines/${id}/status`),
};

export default dataPipelineService;
