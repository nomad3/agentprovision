import api from '../utils/api';

const getAll = () => {
  return api.get("/agent_kits/");
};

const get = (id) => {
  return api.get(`/agent_kits/${id}`);
};

const create = (data) => {
  return api.post("/agent_kits/", data);
};

const update = (id, data) => {
  return api.put(`/agent_kits/${id}`, data);
};

const remove = (id) => {
  return api.delete(`/agent_kits/${id}`);
};

const agentKitService = {
  getAll,
  get,
  create,
  update,
  remove,
};

export default agentKitService;
