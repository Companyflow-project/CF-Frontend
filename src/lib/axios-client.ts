import axios, { AxiosResponse } from 'axios';
import type { ApiErrorResponse } from './api-types';

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.NEXT_PUBLIC_API_BASE_URL

export const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach Bearer token when present
axiosClient.interceptors.request.use((config) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors (don't unwrap, let API client handle it)
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return response as-is, API client will handle the structure
    return response;
  },
  (error) => {
    // Handle API error responses
    if (error.response?.data?.error) {
      const apiError = error.response.data as ApiErrorResponse;
      (error as Error & { apiError?: ApiErrorResponse['error'] }).apiError = apiError.error;
    }

    // Handle 429 explicitly
    if (error.response?.status === 429) {
      const msg = 'Too many requests, please try again in a moment.';
      error.message = msg;
      // Patch response data so custom properties (used in authApi) also reflect this
      if (error.response.data && typeof error.response.data === 'object') {
        (error.response.data as any).message = msg;
        if ((error.response.data as any).error && typeof (error.response.data as any).error === 'object') {
          (error.response.data as any).error.message = msg;
        }
      }
    }

    // Do not perform auth redirects here; auth will be handled separately when implemented
    return Promise.reject(error);
  }
);

