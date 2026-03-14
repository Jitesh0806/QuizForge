import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT access token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, try to refresh the token once
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = Cookies.get('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
          Cookies.set('access_token', data.access, { expires: 1 });
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          // Refresh failed — clear tokens and redirect to login
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
          if (typeof window !== 'undefined') window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Typed API helpers ─────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { username: string; email: string; password: string; password2: string }) =>
    api.post('/auth/register/', data),
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login/', data),
  me: () => api.get('/auth/me/'),
};

export const quizApi = {
  list: () => api.get('/quizzes/'),
  create: (data: { topic: string; num_questions: number; difficulty: string }) =>
    api.post('/quizzes/', data),
  detail: (id: number) => api.get(`/quizzes/${id}/`),
  delete: (id: number) => api.delete(`/quizzes/${id}/`),
  start: (quizId: number) => api.post(`/quizzes/${quizId}/start/`),
};

export const attemptApi = {
  list: () => api.get('/attempts/'),
  detail: (id: number) => api.get(`/attempts/${id}/`),
  submitAnswer: (attemptId: number, data: { question_id: number; choice_id: number }) =>
    api.post(`/attempts/${attemptId}/answer/`, data),
  complete: (attemptId: number) => api.post(`/attempts/${attemptId}/complete/`),
};

export const statsApi = {
  get: () => api.get('/stats/'),
};
