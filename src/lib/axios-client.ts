import axios, { AxiosResponse } from 'axios';
import type { ApiErrorResponse } from './api-types';

// Prefer Vite-style env, but also support NEXT_PUBLIC_API_BASE_URL for compatibility
const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:3001/api';

export const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
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

    // Do not perform auth redirects here; auth will be handled separately when implemented
    return Promise.reject(error);
  }
);

