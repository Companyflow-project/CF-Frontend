import { axiosClient } from '@/lib/axios-client';
import type {
  AdminNewsletterCategoryOption,
  AdminNewsletterDetail,
  AdminNewsletterListResponse,
  CreateAdminNewsletterPayload,
  UpdateAdminNewsletterPayload,
} from './newsletter-types';

function unwrap<T>(res: { data: { data?: T } | T }): T {
  const body = res.data as Record<string, unknown>;
  if (body && typeof body === 'object' && 'data' in body && body.data !== undefined) {
    return body.data as T;
  }
  return res.data as T;
}

export const adminNewsletterApi = {
  list: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<AdminNewsletterListResponse> => {
    const res = await axiosClient.get('/admin/newsletters', { params });
    return unwrap<AdminNewsletterListResponse>(res);
  },

  get: async (nid: number): Promise<AdminNewsletterDetail> => {
    const res = await axiosClient.get(`/admin/newsletters/${nid}`);
    return unwrap<AdminNewsletterDetail>(res);
  },

  create: async (
    payload: CreateAdminNewsletterPayload
  ): Promise<AdminNewsletterDetail> => {
    const res = await axiosClient.post('/admin/newsletters', payload);
    return unwrap<AdminNewsletterDetail>(res);
  },

  update: async (
    nid: number,
    payload: UpdateAdminNewsletterPayload
  ): Promise<AdminNewsletterDetail> => {
    const res = await axiosClient.patch(`/admin/newsletters/${nid}`, payload);
    return unwrap<AdminNewsletterDetail>(res);
  },

  remove: async (nid: number): Promise<void> => {
    await axiosClient.delete(`/admin/newsletters/${nid}`);
  },

  markSent: async (nid: number): Promise<AdminNewsletterDetail> => {
    const res = await axiosClient.post(`/admin/newsletters/${nid}/send`);
    return unwrap<AdminNewsletterDetail>(res);
  },

  sendTest: async (
    nid: number,
    recipients?: string[],
  ): Promise<{ recipients: string[]; sent: number }> => {
    const res = await axiosClient.post(`/admin/newsletters/${nid}/send-test`, { recipients });
    return unwrap<{ recipients: string[]; sent: number }>(res);
  },

  listCategories: async (): Promise<AdminNewsletterCategoryOption[]> => {
    const res = await axiosClient.get('/admin/newsletters/categories');
    return unwrap<AdminNewsletterCategoryOption[]>(res);
  },
};
