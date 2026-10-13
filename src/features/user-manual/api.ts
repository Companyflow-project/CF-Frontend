import { axiosClient } from '@/lib/axios-client';

export interface ManualNavItem {
    nid: number;
    /** Stable topic key, e.g. "employees"; null for pages without one. */
    key?: string | null;
    title: string;
    depth: number;
    children?: ManualNavItem[];
}

export interface ManualSection {
    nid: number;
    title: string;
    body: string; // HTML string
}

interface ManualTreeResponse {
    data: ManualNavItem[];
    error: string | null;
}

interface ManualSectionResponse {
    data: {
        nid: number;
        title: string;
        body?: string;
        content?: string;
    } | null;
    error: string | null;
}

export const userManualApi = {
    /**
     * Fetch the nested navigation tree for the user manual, titled in `lang`.
     * GET /api/user-manual/tree
     */
    async getTree(lang: string): Promise<ManualNavItem[]> {
        const response = await axiosClient.get<ManualTreeResponse>('/user-manual/tree', { params: { lang } });
        const raw = response.data?.data ?? response.data;
        return Array.isArray(raw) ? raw : [];
    },

    /**
     * Fetch the content for a specific section by NID, in `lang`.
     * GET /api/user-manual/:nid
     */
    async getSection(nid: number | string, lang: string): Promise<ManualSection> {
        const response = await axiosClient.get<ManualSectionResponse>(`/user-manual/${nid}`, { params: { lang } });
        const body = response.data;
        if (body?.error != null || body?.data == null) {
            throw new Error('Section not found');
        }
        const d = body.data;
        return {
            nid: d.nid ?? Number(nid),
            title: d.title ?? '',
            body: d.body ?? d.content ?? '',
        };
    },
};
