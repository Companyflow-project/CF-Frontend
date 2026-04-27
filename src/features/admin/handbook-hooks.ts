import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminHandbookApi } from './handbook-api';
import type {
  UpdateAdminHandbookPagePayload,
  UpdateAdminHandbookTocPayload,
  AdminHandbookMetaTags,
} from './handbook-types';

export const useAdminHandbookBooks = () => {
  return useQuery({
    queryKey: ['admin-handbook-books'],
    queryFn: () => adminHandbookApi.listBooks(),
    staleTime: 60_000,
  });
};

export const useAdminHandbookBookTree = (bid: number | null, langcode?: string) => {
  return useQuery({
    queryKey: ['admin-handbook-book-tree', bid, langcode ?? 'da'],
    queryFn: () => adminHandbookApi.getBookTree(bid!, langcode),
    enabled: bid != null && bid > 0,
  });
};

export const useAdminHandbookPage = (nid: number | null, langcode?: string) => {
  return useQuery({
    queryKey: ['admin-handbook-page', nid, langcode ?? 'da'],
    queryFn: () => adminHandbookApi.getPage(nid!, langcode),
    enabled: nid != null && nid > 0,
  });
};

export const useAdminHandbookHelpCategories = () => {
  return useQuery({
    queryKey: ['admin-handbook-help-categories'],
    queryFn: () => adminHandbookApi.listHelpCategories(),
    staleTime: 5 * 60_000,
  });
};

export const useAdminHandbookVersions = (nid: number | null) => {
  return useQuery({
    queryKey: ['admin-handbook-versions', nid],
    queryFn: () => adminHandbookApi.listVersions(nid!),
    enabled: nid != null && nid > 0,
  });
};

export const useAdminHandbookMetaTags = (nid: number | null) => {
  return useQuery({
    queryKey: ['admin-handbook-meta', nid],
    queryFn: () => adminHandbookApi.getMetaTags(nid!),
    enabled: nid != null && nid > 0,
  });
};

export const useUpdateAdminHandbookPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ nid, payload }: { nid: number; payload: UpdateAdminHandbookPagePayload }) =>
      adminHandbookApi.updatePage(nid, payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-handbook-page', vars.nid] });
      qc.invalidateQueries({ queryKey: ['admin-handbook-versions', vars.nid] });
      qc.invalidateQueries({ queryKey: ['admin-handbook-book-tree'] });
    },
  });
};

export const useUpdateAdminHandbookToc = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ nid, payload }: { nid: number; payload: UpdateAdminHandbookTocPayload }) =>
      adminHandbookApi.updateToc(nid, payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-handbook-page', vars.nid] });
      qc.invalidateQueries({ queryKey: ['admin-handbook-book-tree'] });
    },
  });
};

export const useDeleteAdminHandbookPage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nid: number) => adminHandbookApi.deletePage(nid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-handbook-book-tree'] });
      qc.invalidateQueries({ queryKey: ['admin-handbook-books'] });
    },
  });
};

export const useDeleteAdminHandbookVersion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ nid, vid }: { nid: number; vid: number }) =>
      adminHandbookApi.deleteVersion(nid, vid),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-handbook-versions', vars.nid] });
    },
  });
};

export const useRestoreAdminHandbookVersion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ nid, vid }: { nid: number; vid: number }) =>
      adminHandbookApi.restoreVersion(nid, vid),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-handbook-versions', vars.nid] });
      qc.invalidateQueries({ queryKey: ['admin-handbook-page', vars.nid] });
      qc.invalidateQueries({ queryKey: ['admin-handbook-book-tree'] });
    },
  });
};

export const useUpdateAdminHandbookMetaTags = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ nid, payload }: { nid: number; payload: AdminHandbookMetaTags }) =>
      adminHandbookApi.updateMetaTags(nid, payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-handbook-meta', vars.nid] });
    },
  });
};
