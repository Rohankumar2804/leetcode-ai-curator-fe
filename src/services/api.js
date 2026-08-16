import axios from 'axios';

// Determine API base URL from environment variable or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { config, response } = error;
    // We only want to handle 401s for routes that are not the login route.
    // A 401 on the login route simply means "invalid credentials".
    // A 401 on any other route means the JWT is invalid or expired.
    if (response && response.status === 401 && config.url !== '/login') {
      localStorage.removeItem('jwtToken');
      localStorage.setItem('authError', 'Your session has expired. Please log in again.');
      // Redirect to the main authentication page
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// API functions
export const evaluateProblem = (platform, problemId) => api.post(`/api/v1/evaluations/${platform}/${problemId}/evaluate`, {});
export const triggerDeepSync = (platform) => api.post('/api/v1/users/sync', { provider_name: platform });
export const getJobStatus = (jobId) => api.get(`/api/v1/evaluations/status/${jobId}`);
export const linkExternalAccount = (provider, accessToken) => api.post('/api/v1/users/token', { token_type: provider, access_token: accessToken });
export const getCurrentUser = () => api.get('/api/v1/users/me');

// Authentication API functions
export const login = (email, password) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);
  return api.post('/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
};
export const register = (email, password) => api.post('/register', { email, password });

// New API functions for recommendations
export const triggerRecommendations = () => api.post('/api/v1/evaluations/recommendations/trigger', {});
export const fetchRecommendations = () => api.get('/api/v1/evaluations/recommendations');
export const getRecommendationJobStatus = (jobId) => api.get(`/api/v1/evaluations/status/${jobId}`);
export const getEvaluationJobStatus = (jobId) => api.get(`/api/v1/evaluations/status/${jobId}`);

export default api;