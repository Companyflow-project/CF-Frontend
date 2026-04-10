import { axiosClient } from '@/lib/axios-client';
import type { ApiResponse, PaginationMeta } from '@/lib/api-types';
import type {
  AdminDashboard,
  AdminCompanyListItem,
  AdminCompanyListParams,
  AdminCompanyDetail,
  UpdateSubscriptionPayload,
  AdminUser,
  AdminUserListParams,
  UpdateAdminUserPayload,
  AdminSubscriptionItem,
  AdminActivityLogEntry,
  AdminAnalytics,
  PlatformSettings,
  CreateCompanyPayload,
} from './types';

interface PaginatedResponse<T> {
  data: T;
  meta: PaginationMeta;
  error: null;
}

/** Safely unwrap { data: T } from the Axios + API envelope */
function unwrap<T>(res: { data: ApiResponse<T> | T }): T {
  const body = res.data as Record<string, unknown>;
  if (body && typeof body === 'object' && 'data' in body && body.data !== undefined) {
    return body.data as T;
  }
  return res.data as T;
}

export const adminApi = {
  // --- Dashboard ---
  getDashboard: async (): Promise<AdminDashboard> => {
    const res = await axiosClient.get('/admin/dashboard');
    return unwrap<AdminDashboard>(res);
  },

  // --- Companies ---
  getCompanies: async (params: AdminCompanyListParams): Promise<PaginatedResponse<AdminCompanyListItem[]>> => {
    const res = await axiosClient.get('/admin/companies', { params });
    return res.data as PaginatedResponse<AdminCompanyListItem[]>;
  },

  getCompany: async (id: string): Promise<AdminCompanyDetail> => {
    const res = await axiosClient.get(`/admin/companies/${id}`);
    return unwrap<AdminCompanyDetail>(res);
  },

  updateSubscription: async (companyId: string, data: UpdateSubscriptionPayload): Promise<void> => {
    await axiosClient.put(`/admin/companies/${companyId}/subscription`, data);
  },

  createCompany: async (data: CreateCompanyPayload): Promise<{ nid: number }> => {
    const res = await axiosClient.post('/admin/companies', data);
    return unwrap<{ nid: number }>(res);
  },

  deleteCompany: async (id: string): Promise<void> => {
    await axiosClient.delete(`/admin/companies/${id}`);
  },

  // --- Users (Phase 2) ---
  getUsers: async (params: AdminUserListParams): Promise<PaginatedResponse<AdminUser[]>> => {
    const res = await axiosClient.get('/admin/users', { params });
    return res.data as PaginatedResponse<AdminUser[]>;
  },

  updateUser: async (userId: number, data: UpdateAdminUserPayload): Promise<void> => {
    await axiosClient.put(`/admin/users/${userId}`, data);
  },

  // --- Subscriptions (Phase 2) ---
  getSubscriptions: async (params: { page?: number; limit?: number }): Promise<PaginatedResponse<AdminSubscriptionItem[]>> => {
    const res = await axiosClient.get('/admin/subscriptions', { params });
    return res.data as PaginatedResponse<AdminSubscriptionItem[]>;
  },

  // --- Activity (Phase 3) ---
  getActivity: async (params: { page?: number; limit?: number }): Promise<PaginatedResponse<AdminActivityLogEntry[]>> => {
    const res = await axiosClient.get('/admin/activity', { params });
    return res.data as PaginatedResponse<AdminActivityLogEntry[]>;
  },

  // --- Analytics (Phase 3) ---
  getAnalytics: async (): Promise<AdminAnalytics> => {
    const res = await axiosClient.get('/admin/analytics');
    return unwrap<AdminAnalytics>(res);
  },

  // --- Settings (Phase 4) ---
  getSettings: async (): Promise<PlatformSettings> => {
    const res = await axiosClient.get('/admin/settings');
    return unwrap<PlatformSettings>(res);
  },

  updateSettings: async (data: PlatformSettings): Promise<void> => {
    await axiosClient.put('/admin/settings', data);
  },

  // --- Impersonation (Phase 4) ---
  impersonate: async (userId: number): Promise<{ token: string }> => {
    const res = await axiosClient.post(`/admin/impersonate/${userId}`);
    return unwrap<{ token: string }>(res);
  },
};
