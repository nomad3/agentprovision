import api from '../utils/api';

const getAll = () => api.get('/connectors/');

const create = (data) => api.post('/connectors/', data);

const update = (id, data) => api.put(`/connectors/${id}`, data);

const remove = (id) => api.delete(`/connectors/${id}`);

// Test a new connector configuration (before saving)
const testConnection = (type, config) => api.post('/connectors/test', { type, config });

// Test an existing saved connector
const testExisting = (id) => api.post(`/connectors/${id}/test`);

const connectorsService = {
  getAll,
  create,
  update,
  remove,
  delete: remove,  // Alias for consistency
  testConnection,
  testExisting,
};

export default connectorsService;
