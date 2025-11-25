import api from './api';

export const teamsService = {
  async getGroups() {
    const response = await api.get('/agent_groups');
    return response.data;
  },

  async getGroup(id) {
    const response = await api.get(`/agent_groups/${id}`);
    return response.data;
  },

  async createGroup(data) {
    const response = await api.post('/agent_groups', data);
    return response.data;
  },

  async updateGroup(id, data) {
    const response = await api.put(`/agent_groups/${id}`, data);
    return response.data;
  },

  async deleteGroup(id) {
    await api.delete(`/agent_groups/${id}`);
  },

  async getGroupAgents(groupId) {
    const response = await api.get(`/agent_groups/${groupId}/agents`);
    return response.data;
  },

  async getTasks(groupId) {
    const response = await api.get(`/tasks?group_id=${groupId}`);
    return response.data;
  },
};
