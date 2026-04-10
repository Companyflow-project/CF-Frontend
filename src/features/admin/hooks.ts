import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from './api';
import type {
  AdminCompanyListParams,
  UpdateSubscriptionPayload,
  AdminUserListParams,
  UpdateAdminUserPayload,
  PlatformSettings,
} from './types';

// --- Dashboard ---
export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard(),
    staleTime: 60_000,
  });
};

// --- Companies ---
export const useAdminCompanies = (params: AdminCompanyListParams) => {
  return useQuery({
    queryKey: ['admin-companies', params],
    queryFn: () => adminApi.getCompanies(params),
    placeholderData: keepPreviousData,
  });
};

export const useAdminCompany = (id: string | undefined) => {
  return useQuery({
    queryKey: ['admin-company', id],
    queryFn: () => adminApi.getCompany(id!),
    enabled: !!id,
  });
};

export const useUpdateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: UpdateSubscriptionPayload }) =>
      adminApi.updateSubscription(companyId, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-company', vars.companyId] });
      qc.invalidateQueries({ queryKey: ['admin-companies'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
};

// --- Users (Phase 2) ---
export const useAdminUsers = (params: AdminUserListParams) => {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => adminApi.getUsers(params),
    placeholderData: keepPreviousData,
  });
};

export const useUpdateAdminUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: UpdateAdminUserPayload }) =>
      adminApi.updateUser(userId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
};

// --- Subscriptions (Phase 2) ---
export const useAdminSubscriptions = (params: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['admin-subscriptions', params],
    queryFn: () => adminApi.getSubscriptions(params),
    placeholderData: keepPreviousData,
  });
};

// --- Activity (Phase 3) ---
export const useAdminActivity = (params: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['admin-activity', params],
    queryFn: () => adminApi.getActivity(params),
    placeholderData: keepPreviousData,
  });
};

// --- Analytics (Phase 3) ---
export const useAdminAnalytics = () => {
  return useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminApi.getAnalytics(),
    staleTime: 5 * 60_000,
  });
};

// --- Settings (Phase 4) ---
export const useAdminSettings = () => {
  return useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminApi.getSettings(),
  });
};

export const useUpdateAdminSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PlatformSettings) => adminApi.updateSettings(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
    },
  });
};
