import api from './api';

export const memoryService = {
  async getMemories(agentId) {
    const response = await api.get(`/memories/agent/${agentId}`);
    return response.data;
  },

  async storeMemory(data) {
    const response = await api.post('/memories', data);
    return response.data;
  },

  async deleteMemory(memoryId) {
    await api.delete(`/memories/${memoryId}`);
  },

  async getEntities(type = null) {
    const url = type ? `/knowledge/entities?entity_type=${type}` : '/knowledge/entities';
    const response = await api.get(url);
    return response.data;
  },

  async searchEntities(query) {
    const response = await api.get(`/knowledge/entities/search?q=${query}`);
    return response.data;
  },

  async getRelations(entityId) {
    const response = await api.get(`/knowledge/entities/${entityId}/relations`);
    return response.data;
  },
};
