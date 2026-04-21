import { axiosClient } from '@/lib/axios-client';
import type {
  AdminHandbookBook,
  AdminHandbookTreeNode,
  AdminHandbookPageDetail,
  UpdateAdminHandbookPagePayload,
  UpdateAdminHandbookTocPayload,
  AdminHandbookMetaTags,
  AdminHandbookVersion,
  AdminHandbookCategoryOption,
} from './handbook-types';

function unwrap<T>(res: { data: { data?: T } | T }): T {
  const body = res.data as Record<string, unknown>;
  if (body && typeof body === 'object' && 'data' in body && body.data !== undefined) {
    return body.data as T;
  }
  return res.data as T;
}

export const adminHandbookApi = {
  listBooks: async (): Promise<AdminHandbookBook[]> => {
    const res = await axiosClient.get('/admin/handbooks/books');
    return unwrap<AdminHandbookBook[]>(res);
  },

  getBookTree: async (bid: number, langcode?: string): Promise<AdminHandbookTreeNode[]> => {
    const res = await axiosClient.get(`/admin/handbooks/books/${bid}/tree`, {
      params: langcode ? { langcode } : undefined,
    });
    return unwrap<AdminHandbookTreeNode[]>(res);
  },

  listHelpCategories: async (): Promise<AdminHandbookCategoryOption[]> => {
    const res = await axiosClient.get('/admin/handbooks/help-categories');
    return unwrap<AdminHandbookCategoryOption[]>(res);
  },

  getPage: async (nid: number, langcode?: string): Promise<AdminHandbookPageDetail> => {
    const res = await axiosClient.get(`/admin/handbooks/pages/${nid}`, {
      params: langcode ? { langcode } : undefined,
    });
    return unwrap<AdminHandbookPageDetail>(res);
  },

  updatePage: async (nid: number, payload: UpdateAdminHandbookPagePayload): Promise<void> => {
    await axiosClient.patch(`/admin/handbooks/pages/${nid}`, payload);
  },

  updateToc: async (nid: number, payload: UpdateAdminHandbookTocPayload): Promise<void> => {
    await axiosClient.patch(`/admin/handbooks/pages/${nid}/toc`, payload);
  },

  deletePage: async (nid: number): Promise<void> => {
    await axiosClient.delete(`/admin/handbooks/pages/${nid}`);
  },

  listVersions: async (nid: number): Promise<AdminHandbookVersion[]> => {
    const res = await axiosClient.get(`/admin/handbooks/pages/${nid}/versions`);
    return unwrap<AdminHandbookVersion[]>(res);
  },

  getMetaTags: async (nid: number): Promise<AdminHandbookMetaTags> => {
    const res = await axiosClient.get(`/admin/handbooks/pages/${nid}/meta`);
    return unwrap<AdminHandbookMetaTags>(res);
  },

  updateMetaTags: async (nid: number, payload: AdminHandbookMetaTags): Promise<void> => {
    await axiosClient.patch(`/admin/handbooks/pages/${nid}/meta`, payload);
  },
};
