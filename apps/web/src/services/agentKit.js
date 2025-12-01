import api from '../services/api';

const getAll = () => {
  return api.get("/agent-kits/");
};

const get = (id) => {
  return api.get(`/agent-kits/${id}`);
};

const create = (data) => {
  return api.post("/agent-kits/", data);
};

const update = (id, data) => {
  return api.put(`/agent-kits/${id}`, data);
};

const remove = (id) => {
  return api.delete(`/agent-kits/${id}`);
};

const agentKitService = {
  getAll,
  get,
  create,
  update,
  remove,
};

export default agentKitService;
