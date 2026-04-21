import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { adminNewsletterApi } from './newsletter-api';
import type {
  AdminNewsletterListResponse,
  CreateAdminNewsletterPayload,
  UpdateAdminNewsletterPayload,
} from './newsletter-types';

const EMPTY_LIST: AdminNewsletterListResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
};

export const useAdminNewsletters = (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}) => {
  return useQuery<AdminNewsletterListResponse>({
    queryKey: ['admin-newsletters', params ?? {}],
    queryFn: async () => {
      try {
        return await adminNewsletterApi.list(params);
      } catch (err) {
        // Treat "endpoint not yet implemented" as an empty list rather than crashing the page.
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          return { ...EMPTY_LIST, page: params?.page ?? 1, pageSize: params?.pageSize ?? 10 };
        }
        throw err;
      }
    },
    staleTime: 30_000,
  });
};

export const useAdminNewsletter = (nid: number | null) => {
  return useQuery({
    queryKey: ['admin-newsletter', nid],
    queryFn: () => adminNewsletterApi.get(nid!),
    enabled: nid != null && nid > 0,
  });
};

export const useCreateAdminNewsletter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAdminNewsletterPayload) =>
      adminNewsletterApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-newsletters'] });
    },
  });
};

export const useUpdateAdminNewsletter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ nid, payload }: { nid: number; payload: UpdateAdminNewsletterPayload }) =>
      adminNewsletterApi.update(nid, payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-newsletter', vars.nid] });
      qc.invalidateQueries({ queryKey: ['admin-newsletters'] });
    },
  });
};

export const useDeleteAdminNewsletter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nid: number) => adminNewsletterApi.remove(nid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-newsletters'] });
    },
  });
};

export const useAdminNewsletterCategories = () => {
  return useQuery({
    queryKey: ['admin-newsletter-categories'],
    queryFn: () => adminNewsletterApi.listCategories(),
    staleTime: 5 * 60_000,
  });
};

export const useMarkAdminNewsletterSent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nid: number) => adminNewsletterApi.markSent(nid),
    onSuccess: (_d, nid) => {
      qc.invalidateQueries({ queryKey: ['admin-newsletter', nid] });
      qc.invalidateQueries({ queryKey: ['admin-newsletters'] });
    },
  });
};
