import { User } from '@/types/models';
import { axiosClient } from '@/lib/axios-client';

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

export const authApi = {
  async login(payload: LoginPayload): Promise<User> {
    // TODO: Replace with real API call
    // const response = await axiosClient.post('/auth/login', payload);
    // return response.data;
    
    // Temporary mock response
    return {
      id: 'temp',
      email: payload.email,
      name: 'Admin',
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
    };
  },

  async register(payload: RegisterPayload): Promise<User> {
    // TODO: Replace with real API call
    // const response = await axiosClient.post('/auth/register', payload);
    // return response.data;
    
    // Temporary mock response
    return {
      id: 'temp',
      email: payload.email,
      name: payload.name,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
    };
  },

  async me(): Promise<User | null> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get('/auth/me');
    // return response.data;
    
    return null;
  },

  async logout(): Promise<void> {
    // TODO: Replace with real API call
    // await axiosClient.post('/auth/logout');
  },
};

