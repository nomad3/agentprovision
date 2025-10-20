import api from '../utils/api';

const getAll = () => {
  return api.get("/vector_stores/");
};

const get = (id) => {
  return api.get(`/vector_stores/${id}`);
};

const create = (data) => {
  return api.post("/vector_stores/", data);
};

const update = (id, data) => {
  return api.put(`/vector_stores/${id}`, data);
};

const remove = (id) => {
  return api.delete(`/vector_stores/${id}`);
};

const vectorStoreService = {
  getAll,
  get,
  create,
  update,
  remove,
};

export default vectorStoreService;
