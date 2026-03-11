import { axiosClient } from '@/lib/axios-client';
import { User } from '@/types/models';

function getErrorMessage(err: unknown): string {
  const anyErr = err as {
    response?: {
      status?: number;
      data?: any;
    };
    message?: string;
  };

  const data = anyErr?.response?.data;

  // Helper to normalise various backend validation shapes into a flat list of messages
  const collectMessages = (): string[] => {
    if (!data) return [];

    // Plain string body
    if (typeof data === 'string') return [data];

    // { message: string }
    if (typeof data.message === 'string' && data.message.trim()) {
      return [data.message.trim()];
    }

    // { error: string | { message: string } | { messages: string[] } }
    if (typeof data.error === 'string' && data.error.trim()) {
      return [data.error.trim()];
    }
    if (data.error && typeof data.error === 'object') {
      if (typeof data.error.message === 'string' && data.error.message.trim()) {
        return [data.error.message.trim()];
      }
      if (Array.isArray(data.error.messages)) {
        return data.error.messages.filter((m: unknown) => typeof m === 'string' && m.trim());
      }
    }

    // { errors: { field: string[] } } – common validation pattern
    if (data.errors && typeof data.errors === 'object') {
      const fromFields: string[] = [];
      for (const value of Object.values(data.errors)) {
        if (Array.isArray(value)) {
          for (const msg of value) {
            if (typeof msg === 'string' && msg.trim()) {
              fromFields.push(msg.trim());
            }
          }
        } else if (typeof value === 'string' && value.trim()) {
          fromFields.push(value.trim());
        }
      }
      if (fromFields.length > 0) return fromFields;
    }

    return [];
  };

  const messages = collectMessages();

  if (messages.length === 1) {
    return messages[0];
  }
  if (messages.length > 1) {
    // Join multiple validation messages into a single readable string
    return messages.join(' · ');
  }

  // Fallback to the original error message if we couldn't extract anything better
  if (anyErr?.message) return anyErr.message;
  if (err instanceof Error && err.message) return err.message;

  return 'Request failed. Please try again.';
}

const AUTH_COMPANY_KEY = 'auth_user_company';

function normalizeRole(role?: string): User['role'] {
  if (!role) return 'EMPLOYEE';
  // Backend may return 'administrator' — treat it the same as 'company_admin'
  if (role === 'administrator') return 'company_admin';
  return role as User['role'];
}

function toUser(raw: { uid?: number; id?: string; name?: string; email?: string; role?: string; companyId?: string | number; preferredLangcode?: string; companyLanguages?: string[] }): User {
  const id = raw.id ?? String(raw.uid ?? '');
  const companyId = raw.companyId != null ? String(raw.companyId) : undefined;
  return {
    id,
    name: raw.name ?? '',
    email: raw.email ?? '',
    role: normalizeRole(raw.role),
    createdAt: '',
    companyId,
    preferredLangcode: raw.preferredLangcode ?? 'da',
    companyLanguages: raw.companyLanguages ?? ['da'],
  };
}

function persistCompanyId(user: User): void {
  if (user.companyId != null) {
    try {
      sessionStorage.setItem(AUTH_COMPANY_KEY, JSON.stringify({ userId: user.id, companyId: user.companyId }));
    } catch {
      // ignore
    }
  }
}

function mergeStoredCompanyId(user: User): User {
  if (user.companyId != null) return user;
  try {
    const stored = sessionStorage.getItem(AUTH_COMPANY_KEY);
    if (!stored) return user;
    const { userId, companyId } = JSON.parse(stored) as { userId?: string; companyId?: string };
    if (userId === user.id && companyId) return { ...user, companyId };
  } catch {
    // ignore
  }
  return user;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string; // Required - user's full name
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
      const user = toUser(raw);
      persistCompanyId(user);
      return user;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async register(payload: RegisterPayload): Promise<User> {
    try {
      // Send all required fields including name
      const requestBody = {
        email: payload.email,
        password: payload.password,
        name: payload.name || payload.email, // Fallback to email if name not provided
        companyName: payload.companyName,
        cvr: payload.cvr,
      };
      const response = await axiosClient.post<{ data?: LoginResponse } & LoginResponse>('/auth/register', requestBody);
      const body = response.data;
      const payloadData = body.data ?? body;

      if (payloadData.token) localStorage.setItem('token', payloadData.token);
      if (!payloadData.user) throw new Error('Invalid register response');

      const user = toUser(payloadData.user as Parameters<typeof toUser>[0]);
      persistCompanyId(user);
      return user;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async me(): Promise<User | null> {
    if (!localStorage.getItem('token')) {
      return null;
    }
    try {
      const response = await axiosClient.get<{ data: { uid: number; name: string; email?: string; role?: string; companyId?: string | number } }>('/auth/me');
      const raw = response.data?.data;
      if (!raw) return null;
      const user = toUser(raw);
      return mergeStoredCompanyId(user);
    } catch {
      return null;
    }
  },

  async magicLink(token: string): Promise<User> {
    try {
      const response = await axiosClient.post<{ data?: LoginResponse } & LoginResponse>(
        '/auth/magic-link',
        { token }
      );
      const body = response.data;
      const payloadData = body.data ?? body;
      const jwt = payloadData.token;
      const raw = payloadData.user;
      if (jwt) localStorage.setItem('token', jwt);
      if (!raw) throw new Error('Invalid magic link response');
      const user = toUser(raw as Parameters<typeof toUser>[0]);
      persistCompanyId(user);
      return user;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async validateResetToken(token: string): Promise<string | null> {
    try {
      const response = await axiosClient.get<{ data: { email: string } }>(`/auth/validate-reset-token/${token}`);
      return response.data?.data?.email ?? null;
    } catch {
      return null;
    }
  },

  async forgotPassword(email: string): Promise<string> {
    try {
      const response = await axiosClient.post<{ data: { message: string } }>('/auth/forgot-password', { email });
      return response.data?.data?.message ?? 'If an account with that email exists, a password reset link has been sent.';
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<string> {
    try {
      const response = await axiosClient.post<{ data: { message: string } }>('/auth/reset-password', { token, newPassword });
      return response.data?.data?.message ?? 'Password has been reset successfully.';
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async updateLanguage(langcode: string): Promise<void> {
    try {
      await axiosClient.patch('/auth/language', { langcode });
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /** POST /auth/logout – requires Bearer token. Client removes token after call (JWT is stateless). */
  async logout(): Promise<void> {
    try {
      await axiosClient.post<{ data: { message: string }; error: null }>('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      try {
        sessionStorage.removeItem(AUTH_COMPANY_KEY);
      } catch {
        // ignore
      }
    }
  },
};

