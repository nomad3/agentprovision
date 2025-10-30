import api from './api';

export const getDashboardStats = () => {
  return api.get('/analytics/dashboard');
};

export const getAnalyticsSummary = () => {
  return api.get('/analytics/summary');
};
