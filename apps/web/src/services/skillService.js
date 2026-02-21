import api from '../utils/api';

const skillService = {
  execute: (data) => api.post('/skills/execute', data),
  health: () => api.get('/skills/health'),
};

export default skillService;
