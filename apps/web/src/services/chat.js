import api from '../utils/api';

const listSessions = () => api.get('/chat/sessions');

const createSession = (payload) => api.post('/chat/sessions', payload);

const listMessages = (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`);

const postMessage = (sessionId, content) =>
  api.post(`/chat/sessions/${sessionId}/messages`, {
    content,
  });

const chatService = {
  listSessions,
  createSession,
  listMessages,
  postMessage,
};

export default chatService;
