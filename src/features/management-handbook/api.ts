import { axiosClient } from '@/lib/axios-client';
import type { ManualNavItem, ManualSection } from '@/features/user-manual/api';

interface TreeResponse {
    data: ManualNavItem[];
    error: string | null;
}

interface PageResponse {
    data: { nid: number; title: string; content: string } | null;
    error: string | null;
}

/** The management handbook (read-only; company admins and senior employees). */
export const managementHandbookApi = {
    /** GET /api/management-handbook/tree */
    async getTree(lang: string): Promise<ManualNavItem[]> {
        const response = await axiosClient.get<TreeResponse>('/management-handbook/tree', { params: { lang } });
        return Array.isArray(response.data?.data) ? response.data.data : [];
    },

    /** GET /api/management-handbook/:nid */
    async getSection(nid: number | string, lang: string): Promise<ManualSection> {
        const response = await axiosClient.get<PageResponse>(`/management-handbook/${nid}`, { params: { lang } });
        const d = response.data?.data;
        if (!d) throw new Error('Page not found');
        return { nid: d.nid, title: d.title, body: d.content };
    },
};
