import api from '../utils/api';

const getAll = () => {
  return api.get("/data_sources/");
};

const get = (id) => {
  return api.get(`/data_sources/${id}`);
};

const create = (data) => {
  return api.post("/data_sources/", data);
};

const update = (id, data) => {
  return api.put(`/data_sources/${id}`, data);
};

const remove = (id) => {
  return api.delete(`/data_sources/${id}`);
};

const dataSourceService = {
  getAll,
  get,
  create,
  update,
  remove,
};

export default dataSourceService;
