import api from './api';

const notebookService = {
  getAll: () => api.get('/notebooks'),

  getById: (id) => api.get(`/notebooks/${id}`),

  create: (data) => api.post('/notebooks', data),

  update: (id, data) => api.put(`/notebooks/${id}`, data),

  delete: (id) => api.delete(`/notebooks/${id}`),

  execute: (id, cellIndex) => api.post(`/notebooks/${id}/execute`, { cell_index: cellIndex }),

  exportTo: (id, format) => api.get(`/notebooks/${id}/export`, {
    params: { format },
    responseType: 'blob',
  }),
};

export default notebookService;
