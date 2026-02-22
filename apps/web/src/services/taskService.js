import api from '../utils/api';

const taskService = {
  // Agent task endpoints
  getAll: (params = {}) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  getTrace: (id) => api.get(`/tasks/${id}/trace`),
  approve: (id) => api.post(`/tasks/${id}/approve`),
  reject: (id) => api.post(`/tasks/${id}/reject`),

  // Workflow audit endpoints
  listWorkflows: (params = {}) => api.get('/workflows', { params }),
  getWorkflow: (workflowId) => api.get(`/workflows/${encodeURIComponent(workflowId)}`),
  getWorkflowHistory: (workflowId) => api.get(`/workflows/${encodeURIComponent(workflowId)}/history`),
  getWorkflowStats: () => api.get('/workflows/stats'),
};

export default taskService;
