import api from '../utils/api';

const getAll = () => api.get('/datasets/');

const upload = (formData) =>
  api.post('/datasets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

const get = (id) => api.get(`/datasets/${id}`);

const getPreview = (id) => api.get(`/datasets/${id}/preview`);

const getSummary = (id) => api.get(`/datasets/${id}/summary`);

const datasetService = {
  getAll,
  upload,
  get,
  getPreview,
  getSummary,
  sync: (id) => api.post(`/datasets/${id}/sync`),
};

export default datasetService;
