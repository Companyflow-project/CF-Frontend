import { axiosClient } from '@/lib/axios-client';
import type { ApiResponse, PaginationMeta } from '@/lib/api-types';
import type {
  AdminDashboard,
  AdminCompanyListItem,
  AdminCompanyListParams,
  AdminCompanyDetail,
  AdminInfoListEmployee,
  UpdateSubscriptionPayload,
  AdminUser,
  AdminUserListParams,
  UpdateAdminUserPayload,
  AdminSubscriptionItem,
  AdminActivityLogEntry,
  AdminAnalytics,
  PlatformSettings,
  CreateCompanyPayload,
  CrmActivity,
  CrmActivityDetail,
  UpdateCrmActivityPayload,
  TicketCreateOptions,
  CreateTicketPayload,
  UpdateTicketPayload,
  TicketDetail,
  AdminTaxonomyVocabulary,
  AdminTaxonomyTerm,
  AdminTaxonomyTermVersion,
  CreateVocabularyPayload,
  CreateTermPayload,
  UpdateTermPayload,
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

  getCompanyInfoListEmployees: async (id: string): Promise<AdminInfoListEmployee[]> => {
    const res = await axiosClient.get(`/admin/companies/${id}/info-list-employees`);
    return unwrap<AdminInfoListEmployee[]>(res);
  },

  updateSubscription: async (companyId: string, data: UpdateSubscriptionPayload): Promise<void> => {
    await axiosClient.put(`/admin/companies/${companyId}/subscription`, data);
  },

  updateCompany: async (companyId: string, data: Record<string, unknown>): Promise<void> => {
    await axiosClient.patch(`/admin/companies/${companyId}`, data);
  },

  createCrmActivity: async (data: Record<string, unknown>): Promise<{ nid: number }> => {
    const res = await axiosClient.post('/admin/crm/activities', data);
    return unwrap(res);
  },

  getCrmTaxonomy: async (): Promise<{ types: Array<{ tid: number; name: string }>; statuses: Array<{ tid: number; name: string }> }> => {
    const res = await axiosClient.get('/admin/crm/taxonomy');
    return unwrap(res);
  },

  createCompany: async (data: CreateCompanyPayload): Promise<{ nid: number }> => {
    const res = await axiosClient.post('/admin/companies', data);
    return unwrap<{ nid: number }>(res);
  },

  deleteCompany: async (id: string): Promise<void> => {
    await axiosClient.delete(`/admin/companies/${id}`);
  },

  resetCompany: async (id: string): Promise<void> => {
    await axiosClient.post(`/admin/companies/${id}/reset`);
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

  // --- Key Figures ---
  getKeyFigures: async (params: Record<string, unknown>): Promise<PaginatedResponse<Array<{ nid: number; business: string; licenses: number; used: number; exploitationPct: number; lastAccess: number | null; lastEdited: number | null; published: boolean; flagged: 'none' | 'pink' }>>> => {
    const res = await axiosClient.get('/admin/key-figures', { params });
    return res.data as PaginatedResponse<Array<{ nid: number; business: string; licenses: number; used: number; exploitationPct: number; lastAccess: number | null; lastEdited: number | null; published: boolean; flagged: 'none' | 'pink' }>>;
  },

  getKeyFiguresTraffic: async (params: Record<string, unknown>): Promise<PaginatedResponse<Array<{ uid: number; name: string; business: string; roles: string[]; lastAccess: number }>>> => {
    const res = await axiosClient.get('/admin/key-figures/traffic', { params });
    return res.data as PaginatedResponse<Array<{ uid: number; name: string; business: string; roles: string[]; lastAccess: number }>>;
  },

  getKeyFiguresKeywords: async (params: Record<string, unknown>): Promise<PaginatedResponse<Array<{ word: string; count: number; latestSearch: number }>>> => {
    const res = await axiosClient.get('/admin/key-figures/keywords', { params });
    return res.data as PaginatedResponse<Array<{ word: string; count: number; latestSearch: number }>>;
  },

  // --- Tickets ---
  getTicketFilters: async (): Promise<{ priorities: Array<{ key: string; label: string; count: number }>; statuses: Array<{ tid: number; key: string; label: string; count: number }>; lists: Array<{ tid: number; name: string }>; responsibles: Array<{ uid: number; name: string; colorSeed: string }>; authors: Array<{ uid: number; name: string; colorSeed: string }> }> => {
    const res = await axiosClient.get('/admin/tickets/filters');
    return unwrap(res);
  },

  getTickets: async (params: Record<string, unknown>): Promise<PaginatedResponse<Array<{ nid: number; title: string; body: string; created: number; priority: string; priorityKey: string; status: string; statusKey: string; listName: string | null; responsibleUid: number | null; responsibleName: string; authorUid: number; authorName: string }>>> => {
    const res = await axiosClient.get('/admin/tickets', { params });
    return res.data as PaginatedResponse<Array<{ nid: number; title: string; body: string; created: number; priority: string; priorityKey: string; status: string; statusKey: string; listName: string | null; responsibleUid: number | null; responsibleName: string; authorUid: number; authorName: string }>>;
  },

  getTicketCreateOptions: async (): Promise<TicketCreateOptions> => {
    const res = await axiosClient.get('/admin/tickets/create-options');
    return unwrap<TicketCreateOptions>(res);
  },

  createTicket: async (data: CreateTicketPayload): Promise<{ nid: number }> => {
    const res = await axiosClient.post('/admin/tickets', data);
    return unwrap<{ nid: number }>(res);
  },

  getTicket: async (nid: number | string): Promise<TicketDetail> => {
    const res = await axiosClient.get(`/admin/tickets/${nid}`);
    return unwrap<TicketDetail>(res);
  },

  updateTicket: async (nid: number | string, data: UpdateTicketPayload): Promise<TicketDetail> => {
    const res = await axiosClient.patch(`/admin/tickets/${nid}`, data);
    return unwrap<TicketDetail>(res);
  },

  // --- Invoices ---
  getInvoices: async (params: { page?: number; limit?: number; customersOnly?: boolean; search?: string }): Promise<PaginatedResponse<Array<{ nid: number; business: string; category: string; licenses: number; addPurchases: string; payment: string; paymentKey: string; beginner: string | null; ends: string | null; endsAboutMonths: number | null; invoicing: string | null; whenMonths: number | null; notes: string }>>> => {
    const res = await axiosClient.get('/admin/invoices', { params });
    return res.data as PaginatedResponse<Array<{ nid: number; business: string; category: string; licenses: number; addPurchases: string; payment: string; paymentKey: string; beginner: string | null; ends: string | null; endsAboutMonths: number | null; invoicing: string | null; whenMonths: number | null; notes: string }>>;
  },

  exportInvoicesCsv: async (params: { customersOnly?: boolean; search?: string }): Promise<Blob> => {
    const res = await axiosClient.get('/admin/invoices/export', { params, responseType: 'blob' });
    return res.data as Blob;
  },

  // --- CRM ---
  getCrmUsers: async (): Promise<Array<{ uid: number; name: string; initials: string; colorSeed: string }>> => {
    const res = await axiosClient.get('/admin/crm/users');
    return unwrap(res);
  },

  getCrmSummary: async (params: Record<string, unknown>): Promise<{ total: number; meetings: number; automatic: number; other: number }> => {
    const res = await axiosClient.get('/admin/crm/summary', { params });
    return unwrap(res);
  },

  getCrmActivities: async (params: Record<string, unknown>): Promise<PaginatedResponse<CrmActivity[]>> => {
    const res = await axiosClient.get('/admin/crm/activities', { params });
    return res.data as PaginatedResponse<CrmActivity[]>;
  },

  getCrmActivity: async (id: number): Promise<CrmActivityDetail> => {
    const res = await axiosClient.get(`/admin/crm/activities/${id}`);
    return unwrap<CrmActivityDetail>(res);
  },

  updateCrmActivity: async (id: number, data: UpdateCrmActivityPayload): Promise<{ nid: number }> => {
    const res = await axiosClient.patch(`/admin/crm/activities/${id}`, data);
    return unwrap<{ nid: number }>(res);
  },

  // --- Sources ---
  getSourceFilters: async (): Promise<{ sources: Array<{ label: string; count: number }>; categories: Array<{ label: string; count: number }> }> => {
    const res = await axiosClient.get('/admin/sources/filters');
    return unwrap(res);
  },

  getSourceCompanies: async (params: { page?: number; limit?: number; source?: string; category?: string }): Promise<PaginatedResponse<Array<{ nid: number; title: string; source: string; category: string; created: number; mupDate: string | null }>>> => {
    const res = await axiosClient.get('/admin/sources/companies', { params });
    return res.data as PaginatedResponse<Array<{ nid: number; title: string; source: string; category: string; created: number; mupDate: string | null }>>;
  },

  // --- Taxonomy ---
  getTaxonomyVocabularies: async (): Promise<AdminTaxonomyVocabulary[]> => {
    const res = await axiosClient.get('/admin/taxonomy/vocabularies');
    return unwrap<AdminTaxonomyVocabulary[]>(res);
  },

  createTaxonomyVocabulary: async (data: CreateVocabularyPayload): Promise<AdminTaxonomyVocabulary> => {
    const res = await axiosClient.post('/admin/taxonomy/vocabularies', data);
    return unwrap<AdminTaxonomyVocabulary>(res);
  },

  deleteTaxonomyVocabulary: async (vid: string): Promise<void> => {
    await axiosClient.delete(`/admin/taxonomy/vocabularies/${vid}`);
  },

  reorderTaxonomyVocabularies: async (items: Array<{ vid: string; weight: number }>): Promise<void> => {
    await axiosClient.patch('/admin/taxonomy/vocabularies/reorder', { items });
  },

  getTaxonomyTerms: async (vid: string): Promise<AdminTaxonomyTerm[]> => {
    const res = await axiosClient.get(`/admin/taxonomy/vocabularies/${vid}/terms`);
    return unwrap<AdminTaxonomyTerm[]>(res);
  },

  getTaxonomyTerm: async (tid: number): Promise<AdminTaxonomyTerm> => {
    const res = await axiosClient.get(`/admin/taxonomy/terms/${tid}`);
    return unwrap<AdminTaxonomyTerm>(res);
  },

  createTaxonomyTerm: async (vid: string, data: CreateTermPayload): Promise<AdminTaxonomyTerm> => {
    const res = await axiosClient.post(`/admin/taxonomy/vocabularies/${vid}/terms`, data);
    return unwrap<AdminTaxonomyTerm>(res);
  },

  updateTaxonomyTerm: async (tid: number, data: UpdateTermPayload): Promise<AdminTaxonomyTerm> => {
    const res = await axiosClient.patch(`/admin/taxonomy/terms/${tid}`, data);
    return unwrap<AdminTaxonomyTerm>(res);
  },

  deleteTaxonomyTerm: async (tid: number): Promise<void> => {
    await axiosClient.delete(`/admin/taxonomy/terms/${tid}`);
  },

  reorderTaxonomyTerms: async (vid: string, items: Array<{ tid: number; weight: number; parentTid: number }>): Promise<void> => {
    await axiosClient.patch(`/admin/taxonomy/vocabularies/${vid}/terms/reorder`, { items });
  },

  getTaxonomyTermVersions: async (tid: number): Promise<AdminTaxonomyTermVersion[]> => {
    const res = await axiosClient.get(`/admin/taxonomy/terms/${tid}/versions`);
    return unwrap<AdminTaxonomyTermVersion[]>(res);
  },

  restoreTaxonomyTermVersion: async (tid: number, revisionId: number): Promise<AdminTaxonomyTerm> => {
    const res = await axiosClient.post(`/admin/taxonomy/terms/${tid}/versions/${revisionId}/restore`);
    return unwrap<AdminTaxonomyTerm>(res);
  },

  deleteTaxonomyTermVersion: async (tid: number, revisionId: number): Promise<void> => {
    await axiosClient.delete(`/admin/taxonomy/terms/${tid}/versions/${revisionId}`);
  },

  // --- Impersonation (Phase 4) ---
  impersonate: async (userId: number): Promise<{ token: string }> => {
    const res = await axiosClient.post(`/admin/impersonate/${userId}`);
    return unwrap<{ token: string }>(res);
  },

  /** Mint a JWT for a company's account owner so an admin can view the user console as that company. */
  impersonateCompany: async (companyId: string | number): Promise<{ token: string; user: { uid: number; name: string } }> => {
    const res = await axiosClient.post(`/admin/companies/${companyId}/impersonate`);
    return unwrap<{ token: string; user: { uid: number; name: string } }>(res);
  },
};
