import { axiosClient } from '@/lib/axios-client';
import type { ApiResponse, Handbook as BackendHandbook, HandbookPage as BackendHandbookPage, HandbookDetail } from '@/lib/api-types';
import { HandbookSection, HandbookPage } from '@/types/models';

// Transform backend handbook page to frontend handbook page
const transformHandbookPage = (backend: BackendHandbookPage, sectionId?: string): HandbookPage => {
  return {
    id: String(backend.nid),
    sectionId: sectionId || String(backend.handbookId || ''),
    title: backend.title,
    status: backend.status === 1 ? 'READY' : 'NOT_READY',
    updatedAt: new Date(backend.changed * 1000).toISOString(),
  };
};

export const handbookApi = {
  async listSections(params?: {
    companyId?: string;
    page?: number;
    limit?: number;
  }): Promise<HandbookSection[]> {
    const queryParams: Record<string, string> = {};
    if (params?.companyId) queryParams.companyId = params.companyId;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    const response = await axiosClient.get<ApiResponse<any[]>>('/handbooks', { params: queryParams });
    // axios returns AxiosResponse, so response.data is the ApiResponse object
    // response.data.data is the actual array
    const apiResponse = response.data;
    if (!apiResponse || !apiResponse.data) {
      console.error('Invalid API response structure:', apiResponse);
      return [];
    }
    const handbooks = Array.isArray(apiResponse.data) ? apiResponse.data : [];

    // Deduplicate by nid (keep the first occurrence)
    const seenNids = new Set<string>();
    const uniqueHandbooks = handbooks.filter((handbook: any) => {
      const nid = String(handbook.nid || handbook.id || '');
      if (seenNids.has(nid)) {
        return false;
      }
      seenNids.add(nid);
      return true;
    });

    // Transform handbooks to sections
    // The API now returns objects with nid, title, etc (HandbookDetail-like structure)
    return uniqueHandbooks.map((handbook: any, index: number) => {
      return {
        id: String(handbook.nid || handbook.id || ''),
        title: handbook.title || 'Untitled',
        slug: (handbook.title || 'untitled').toLowerCase().replace(/\s+/g, '-'),
        order: index,
        accountId: String(handbook.companyId || ''),
      };
    });
  },

  async getSection(id: string): Promise<HandbookSection | null> {
    try {
      const response = await axiosClient.get<ApiResponse<BackendHandbook>>(`/handbooks/${id}`);
      // response.data is ApiResponse<BackendHandbook>, so response.data.data is the handbook
      const handbook = response.data.data;
      return {
        id: handbook.id,
        title: handbook.title,
        slug: handbook.title.toLowerCase().replace(/\s+/g, '-'),
        order: 0,
        accountId: handbook.companyId,
      };
    } catch (error) {
      return null;
    }
  },

  async getHandbook(id: string): Promise<HandbookDetail | null> {
    try {
      const response = await axiosClient.get<ApiResponse<HandbookDetail>>(`/handbooks/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching handbook:', error);
      return null;
    }
  },

  async createSection(_payload: Partial<HandbookSection>): Promise<HandbookSection> {
    // Backend is read-only, this would need to be implemented if write operations are added
    throw new Error('Create section not supported by read-only API');
  },

  async updateSection(
    _id: string,
    _payload: Partial<HandbookSection>
  ): Promise<HandbookSection> {
    // Backend is read-only, this would need to be implemented if write operations are added
    throw new Error('Update section not supported by read-only API');
  },

  async listPages(sectionId?: string, params?: {
    page?: number;
    limit?: number;
    langcode?: string;
  }): Promise<HandbookPage[]> {
    // If sectionId is provided, use it as handbookId; otherwise return empty array
    // (backend requires handbookId to list pages)
    if (!sectionId) {
      return [];
    }

    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.langcode) queryParams.langcode = params.langcode;

    const response = await axiosClient.get<ApiResponse<BackendHandbookPage[]>>(`/handbooks/${sectionId}/pages`, { params: queryParams });
    // axios returns AxiosResponse, so response.data is the ApiResponse object
    // response.data.data is the actual array
    const apiResponse = response.data;
    if (!apiResponse || !apiResponse.data) {
      console.error('Invalid API response structure for pages:', apiResponse);
      return [];
    }
    const pages = Array.isArray(apiResponse.data) ? apiResponse.data : [];
    return pages.map((page) => transformHandbookPage(page, sectionId));
  },

  async getPage(pageId: string, params?: {
    langcode?: string;
  }): Promise<HandbookPage | null> {
    try {
      const queryParams: Record<string, string> = {};
      if (params?.langcode) queryParams.langcode = params.langcode;

      const response = await axiosClient.get<ApiResponse<BackendHandbookPage>>(`/pages/${pageId}`, { params: queryParams });
      // response.data is ApiResponse<BackendHandbookPage>, so response.data.data is the page
      const pageData = response.data.data;
      if (pageData && 'nid' in pageData) {
        return transformHandbookPage(pageData);
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  async createPage(_payload: Partial<HandbookPage>): Promise<HandbookPage> {
    // Backend is read-only, this would need to be implemented if write operations are added
    throw new Error('Create page not supported by read-only API');
  },

  async updatePage(
    _id: string,
    _payload: Partial<HandbookPage>
  ): Promise<HandbookPage> {
    // Backend is read-only, this would need to be implemented if write operations are added
    throw new Error('Update page not supported by read-only API');
  },

  async publishHandbook(): Promise<void> {
    // Endpoint not in OpenAPI spec - may need to be implemented
    throw new Error('Publish handbook not supported by read-only API');
  },
};

