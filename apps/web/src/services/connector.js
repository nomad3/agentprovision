import api from '../utils/api';

const getAll = () => api.get('/connectors/');

const create = (data) => api.post('/connectors/', data);

const update = (id, data) => api.put(`/connectors/${id}`, data);

const remove = (id) => api.delete(`/connectors/${id}`);

const testConnection = (id) => api.post(`/connectors/${id}/test`);

const connectorsService = {
  getAll,
  create,
  update,
  remove,
  testConnection,
};

export default connectorsService;
