import api from '../utils/api';

const instanceService = {
  getAll: () => api.get('/instances/'),
  create: (data) => api.post('/instances/', data),
  getById: (id) => api.get(`/instances/${id}`),
  stop: (id) => api.post(`/instances/${id}/stop`),
  start: (id) => api.post(`/instances/${id}/start`),
  restart: (id) => api.post(`/instances/${id}/restart`),
  destroy: (id) => api.delete(`/instances/${id}`),
};

export default instanceService;
