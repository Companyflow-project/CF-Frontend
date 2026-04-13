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

export const useUpdateCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: Record<string, unknown> }) =>
      adminApi.updateCompany(companyId, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-company', vars.companyId] });
      qc.invalidateQueries({ queryKey: ['admin-companies'] });
    },
  });
};

export const useCreateCrmActivity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createCrmActivity(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-crm-activities'] });
      qc.invalidateQueries({ queryKey: ['admin-crm-summary'] });
    },
  });
};

export const useCrmTaxonomy = () => {
  return useQuery({
    queryKey: ['admin-crm-taxonomy'],
    queryFn: () => adminApi.getCrmTaxonomy(),
    staleTime: 10 * 60_000,
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

// --- Key Figures ---
export const useKeyFigures = (params: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['admin-key-figures', params],
    queryFn: () => adminApi.getKeyFigures(params),
    placeholderData: keepPreviousData,
  });
};

export const useKeyFiguresTraffic = (params: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['admin-key-figures-traffic', params],
    queryFn: () => adminApi.getKeyFiguresTraffic(params),
    placeholderData: keepPreviousData,
  });
};

export const useKeyFiguresKeywords = (params: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['admin-key-figures-keywords', params],
    queryFn: () => adminApi.getKeyFiguresKeywords(params),
    placeholderData: keepPreviousData,
  });
};

// --- Tickets ---
export const useTicketFilters = () => {
  return useQuery({
    queryKey: ['admin-ticket-filters'],
    queryFn: () => adminApi.getTicketFilters(),
    staleTime: 60_000,
  });
};

export const useTickets = (params: Record<string, unknown>, enabled: boolean) => {
  return useQuery({
    queryKey: ['admin-tickets', params],
    queryFn: () => adminApi.getTickets(params),
    enabled,
    placeholderData: keepPreviousData,
  });
};

// --- Invoices ---
export const useInvoices = (params: { page?: number; limit?: number; customersOnly?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['admin-invoices', params],
    queryFn: () => adminApi.getInvoices(params),
    placeholderData: keepPreviousData,
  });
};

// --- CRM ---
export const useCrmUsers = () => {
  return useQuery({
    queryKey: ['admin-crm-users'],
    queryFn: () => adminApi.getCrmUsers(),
    staleTime: 5 * 60_000,
  });
};

export const useCrmSummary = (params: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['admin-crm-summary', params],
    queryFn: () => adminApi.getCrmSummary(params),
    placeholderData: keepPreviousData,
  });
};

export const useCrmActivities = (params: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['admin-crm-activities', params],
    queryFn: () => adminApi.getCrmActivities(params),
    placeholderData: keepPreviousData,
  });
};

// --- Sources ---
export const useSourceFilters = () => {
  return useQuery({
    queryKey: ['admin-source-filters'],
    queryFn: () => adminApi.getSourceFilters(),
    staleTime: 60_000,
  });
};

export const useSourceCompanies = (params: { page?: number; limit?: number; source?: string; category?: string }) => {
  return useQuery({
    queryKey: ['admin-source-companies', params],
    queryFn: () => adminApi.getSourceCompanies(params),
    placeholderData: keepPreviousData,
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
