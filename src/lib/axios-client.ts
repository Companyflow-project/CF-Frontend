import axios, { AxiosResponse } from 'axios';
import type { ApiErrorResponse } from './api-types';
import i18n from '@/i18n';

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

    // Permission failures surfaced the server's raw wording (or a bare status)
    // wherever a page echoed error.message. Give every caller one friendly,
    // translated sentence instead.
    if (error.response?.status === 403) {
      const msg = i18n.t('common:errors.forbidden');
      error.message = msg;
      const data = error.response.data;
      if (data && typeof data === 'object') {
        (data as any).message = msg;
        if ((data as any).error && typeof (data as any).error === 'object') {
          (data as any).error.message = msg;
        }
      }
      const withApiError = error as Error & { apiError?: ApiErrorResponse['error'] };
      if (withApiError.apiError) withApiError.apiError.message = msg;
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

