import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

export const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token when available
axiosClient.interceptors.request.use(
  (config) => {
    // TODO: Get token from storage and add to headers
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: Handle 401/403 errors and redirect to login
    return Promise.reject(error);
  }
);

