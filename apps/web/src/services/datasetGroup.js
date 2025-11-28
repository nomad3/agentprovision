import api from '../utils/api';

const getAll = () => api.get('/dataset-groups/');

const create = (data) => api.post('/dataset-groups/', data);

const get = (id) => api.get(`/dataset-groups/${id}`);

const update = (id, data) => api.put(`/dataset-groups/${id}`, data);

const remove = (id) => api.delete(`/dataset-groups/${id}`);

const datasetGroupService = {
  getAll,
  create,
  get,
  update,
  remove,
};

export default datasetGroupService;
