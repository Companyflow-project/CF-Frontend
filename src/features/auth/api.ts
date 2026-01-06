import { axiosClient } from '@/lib/axios-client';
import { User } from '@/types/models';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  companyName: string;
  cvr: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export const authApi = {
  async login(payload: LoginPayload): Promise<User> {
    const response = await axiosClient.post<LoginResponse>('/auth/login', payload);
    // Store token in localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data.user;
  },

  async register(payload: RegisterPayload): Promise<User> {
    const response = await axiosClient.post<LoginResponse>('/auth/register', payload);
    // Store token in localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data.user;
  },

  async me(): Promise<User | null> {
    try {
      const response = await axiosClient.get<User>('/auth/me');
      return response.data;
    } catch (error) {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await axiosClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
    }
  },
};

