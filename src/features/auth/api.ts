import { axiosClient } from '@/lib/axios-client';
import { User } from '@/types/models';

function getErrorMessage(err: unknown): string {
  const res = (err as { response?: { data?: { error?: { message?: string }; message?: string } } })?.response?.data;
  return res?.error?.message ?? res?.message ?? (err instanceof Error ? err.message : 'Request failed');
}

function toUser(raw: { uid?: number; id?: string; name: string; email?: string }): User {
  return {
    id: raw.id ?? String(raw.uid ?? ''),
    name: raw.name,
    email: raw.email ?? '',
    role: 'EMPLOYEE',
    createdAt: '',
  };
}

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
    try {
      const response = await axiosClient.post<{ data?: LoginResponse } & LoginResponse>('/auth/login', payload);
      const body = response.data;
      const payloadData = body.data ?? body;
      const token = payloadData.token;
      const raw = payloadData.user;
      if (token) localStorage.setItem('token', token);
      if (!raw) throw new Error('Invalid login response');
      return toUser(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async register(payload: RegisterPayload): Promise<User> {
    try {
      const response = await axiosClient.post<{ data?: LoginResponse } & LoginResponse>('/auth/register', payload);
      const body = response.data;
      const payloadData = body.data ?? body;
      if (payloadData.token) localStorage.setItem('token', payloadData.token);
      if (!payloadData.user) throw new Error('Invalid register response');
      return toUser(payloadData.user as Parameters<typeof toUser>[0]);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async me(): Promise<User | null> {
    if (!localStorage.getItem('token')) {
      return null;
    }
    try {
      const response = await axiosClient.get<{ data: { uid: number; name: string; email?: string } }>('/auth/me');
      const raw = response.data?.data;
      if (!raw) return null;
      return toUser(raw);
    } catch {
      return null;
    }
  },

  /** POST /auth/logout – requires Bearer token. Client removes token after call (JWT is stateless). */
  async logout(): Promise<void> {
    try {
      await axiosClient.post<{ data: { message: string }; error: null }>('/auth/logout');
    } finally {
      localStorage.removeItem('token');
    }
  },
};

