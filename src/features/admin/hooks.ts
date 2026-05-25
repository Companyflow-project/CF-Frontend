import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from './api';
import type {
  AdminCompanyListParams,
  UpdateSubscriptionPayload,
  AdminUserListParams,
  UpdateAdminUserPayload,
  PlatformSettings,
  CreateTicketPayload,
  UpdateTicketPayload,
  UpdateCrmActivityPayload,
  CreateVocabularyPayload,
  CreateTermPayload,
  UpdateTermPayload,
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

export const useAdminCompanyInfoListEmployees = (id: string | undefined) => {
  return useQuery({
    queryKey: ['admin-company-info-list-employees', id],
    queryFn: () => adminApi.getCompanyInfoListEmployees(id!),
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

export const useResetCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (companyId: string | number) => adminApi.resetCompany(String(companyId)),
    onSuccess: (_d, companyId) => {
      qc.invalidateQueries({ queryKey: ['admin-company', String(companyId)] });
      qc.invalidateQueries({ queryKey: ['admin-companies'] });
    },
  });
};

export const useDeleteCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (companyId: string | number) => adminApi.deleteCompany(String(companyId)),
    onSuccess: (_d, companyId) => {
      qc.invalidateQueries({ queryKey: ['admin-company', String(companyId)] });
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
export const useAdminUserStats = () => {
  return useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: () => adminApi.getUserStats(),
    staleTime: 60_000,
  });
};

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
      qc.invalidateQueries({ queryKey: ['admin-user-stats'] });
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

export const useUserConsoleActivity = (params: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['admin-user-console-activity', params],
    queryFn: () => adminApi.getUserConsoleActivity(params),
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

export const useTicketCreateOptions = () => {
  return useQuery({
    queryKey: ['admin-ticket-create-options'],
    queryFn: () => adminApi.getTicketCreateOptions(),
    staleTime: 5 * 60_000,
  });
};

export const useCreateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTicketPayload) => adminApi.createTicket(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tickets'] });
      qc.invalidateQueries({ queryKey: ['admin-ticket-filters'] });
    },
  });
};

export const useTicket = (nid: number | string | undefined) => {
  return useQuery({
    queryKey: ['admin-ticket', String(nid ?? '')],
    queryFn: () => adminApi.getTicket(nid!),
    enabled: nid !== undefined && nid !== null && nid !== '',
  });
};

export const useUpdateTicket = (nid: number | string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTicketPayload) => adminApi.updateTicket(nid, data),
    onSuccess: (data) => {
      qc.setQueryData(['admin-ticket', String(nid)], data);
      qc.invalidateQueries({ queryKey: ['admin-tickets'] });
      qc.invalidateQueries({ queryKey: ['admin-ticket-filters'] });
    },
  });
};

// Variant for use across rows (e.g. inline "Done" buttons in the list).
export const useUpdateAnyTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ nid, data }: { nid: number | string; data: UpdateTicketPayload }) =>
      adminApi.updateTicket(nid, data),
    onSuccess: (data, variables) => {
      qc.setQueryData(['admin-ticket', String(variables.nid)], data);
      qc.invalidateQueries({ queryKey: ['admin-tickets'] });
      qc.invalidateQueries({ queryKey: ['admin-ticket-filters'] });
    },
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

export const useCrmActivity = (id: number | null) => {
  return useQuery({
    queryKey: ['admin-crm-activity', id],
    queryFn: () => adminApi.getCrmActivity(id as number),
    enabled: id !== null && Number.isFinite(id),
  });
};

export const useUpdateCrmActivity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCrmActivityPayload }) =>
      adminApi.updateCrmActivity(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-crm-activities'] });
      qc.invalidateQueries({ queryKey: ['admin-crm-activity', id] });
    },
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

// --- Taxonomy ---
export const useAdminTaxonomyVocabularies = () => {
  return useQuery({
    queryKey: ['admin-taxonomy-vocabularies'],
    queryFn: () => adminApi.getTaxonomyVocabularies(),
    staleTime: 60_000,
  });
};

export const useCreateTaxonomyVocabulary = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVocabularyPayload) => adminApi.createTaxonomyVocabulary(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-taxonomy-vocabularies'] });
    },
  });
};

export const useDeleteTaxonomyVocabulary = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vid: string) => adminApi.deleteTaxonomyVocabulary(vid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-taxonomy-vocabularies'] });
    },
  });
};

export const useReorderTaxonomyVocabularies = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: Array<{ vid: string; weight: number }>) =>
      adminApi.reorderTaxonomyVocabularies(items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-taxonomy-vocabularies'] });
    },
  });
};

export const useAdminTaxonomyTerms = (vid: string | undefined) => {
  return useQuery({
    queryKey: ['admin-taxonomy-terms', vid],
    queryFn: () => adminApi.getTaxonomyTerms(vid!),
    enabled: !!vid,
  });
};

export const useCreateTaxonomyTerm = (vid: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTermPayload) => adminApi.createTaxonomyTerm(vid, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-taxonomy-terms', vid] });
      qc.invalidateQueries({ queryKey: ['admin-taxonomy-vocabularies'] });
    },
  });
};

export const useUpdateTaxonomyTerm = (vid: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tid, data }: { tid: number; data: UpdateTermPayload }) =>
      adminApi.updateTaxonomyTerm(tid, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-taxonomy-terms', vid] });
    },
  });
};

export const useDeleteTaxonomyTerm = (vid: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tid: number) => adminApi.deleteTaxonomyTerm(tid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-taxonomy-terms', vid] });
      qc.invalidateQueries({ queryKey: ['admin-taxonomy-vocabularies'] });
    },
  });
};

export const useAdminTaxonomyTermVersions = (tid: number | null | undefined) => {
  return useQuery({
    queryKey: ['admin-taxonomy-term-versions', tid],
    queryFn: () => adminApi.getTaxonomyTermVersions(tid!),
    enabled: !!tid,
  });
};

export const useRestoreTaxonomyTermVersion = (tid: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (revisionId: number) => adminApi.restoreTaxonomyTermVersion(tid, revisionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-taxonomy-term-versions', tid] });
      qc.invalidateQueries({ queryKey: ['admin-taxonomy-terms'] });
    },
  });
};

export const useDeleteTaxonomyTermVersion = (tid: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (revisionId: number) => adminApi.deleteTaxonomyTermVersion(tid, revisionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-taxonomy-term-versions', tid] });
    },
  });
};
