import api from '../utils/api';

const taskService = {
  getAll: (params = {}) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  getTrace: (id) => api.get(`/tasks/${id}/trace`),
  approve: (id) => api.post(`/tasks/${id}/approve`),
  reject: (id) => api.post(`/tasks/${id}/reject`),
};

export default taskService;
