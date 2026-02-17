import { axiosClient } from '@/lib/axios-client';
import type { HandbookNode, HandbookPageDetail, UpdatePagePayload } from '@/types/models';

interface SaveProgressPayload {
  pages: Array<{
    id: number;
    ready: boolean;
    selected: boolean;
  }>;
}

interface SaveProgressResponse {
  success: boolean;
  message?: string;
}

type MessageType = 'standard' | 'custom' | 'none';

interface PublishHandbookPayload {
  handbookId: number;
  messageType: MessageType;
  channels?: Array<'email' | 'sms'>;
  customMessage?: string;
}

interface PublishHandbookResponse {
  success: boolean;
  count: number;
}

interface CreatePagePayload {
  title: string;
  parentId?: number;
  newChapterName?: string;
}

interface CreatePageResponse {
  id: number;
}

type BulkActionType = 'mark_ready' | 'mark_not_ready' | 'opt_out' | 'include';

interface BulkActionPayload {
  pageIds: number[];
  action: BulkActionType;
}

interface BulkActionResponse {
  success: boolean;
  updatedCount: number;
}

export const handbookApi = {
  /**
   * Get handbook tree/overview
   * GET /api/handbook?lang=en
   * Returns a simple array (no { data } wrapper)
   * 
   * Errors:
   * - 403: "Handbook not yet published" (for employees)
   * - 403: "User not assigned to a company"
   */
  async getHandbookTree(lang: string = 'en'): Promise<HandbookNode[]> {
    try {
      const response = await axiosClient.get<HandbookNode[]>('/handbook', {
        params: { lang },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        const message = error.response?.data?.message || error.response?.data?.error;
        if (message === 'Handbook not yet published') {
          throw new Error('Your handbook is not published yet.');
        }
        if (message === 'User not assigned to a company') {
          throw new Error('Your user is not linked to a company. Please contact support.');
        }
        throw new Error(message || 'Access denied');
      }
      console.error('Error fetching handbook tree:', error);
      throw error;
    }
  },

  /**
   * Get page details for editing
   * GET /api/handbook/pages/:id?lang=en
   */
  async getPageDetail(pageId: number, lang: string = 'en'): Promise<HandbookPageDetail | null> {
    try {
      const response = await axiosClient.get<HandbookPageDetail>(
        `/handbook/pages/${pageId}`,
        {
          params: { lang },
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('This handbook page could not be found or was removed.');
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid page ID');
      }
      console.error('Error fetching page detail:', error);
      throw error;
    }
  },

  /**
   * Update page
   * PUT /api/handbook/pages/:id
   * 
   * Only admin or company_admin can call this.
   * 
   * Errors:
   * - 403: "You don't have permission to edit this page"
   */
  async updatePage(
    pageId: number,
    payload: UpdatePagePayload
  ): Promise<{ success: boolean }> {
    try {
      const response = await axiosClient.put<{ success: boolean }>(
        `/handbook/pages/${pageId}`,
        payload
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error("You don't have permission to update this page.");
      }
      console.error('Error updating page:', error);
      throw error;
    }
  },

  /**
   * Save handbook progress
   * POST /api/handbook/save-progress
   * 
   * Only admin or company_admin can call this.
   * 
   * Errors:
   * - 403: "Only admins can save handbook progress"
   */
  async saveProgress(payload: SaveProgressPayload): Promise<SaveProgressResponse> {
    try {
      const response = await axiosClient.post<SaveProgressResponse>(
        '/handbook/save-progress',
        payload
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        const message = error.response?.data?.message || error.response?.data?.error;
        if (message === 'Only admins can save handbook progress') {
          throw new Error("You don't have permission to edit the handbook.");
        }
        throw new Error(message || 'Access denied');
      }
      throw error;
    }
  },

  /**
   * Publish handbook
   * POST /api/handbook/publish
   *
   * Only admin or company_admin can call this.
   * User must be linked to a company.
   */
  async publishHandbook(payload: PublishHandbookPayload): Promise<PublishHandbookResponse> {
    try {
      const response = await axiosClient.post<PublishHandbookResponse>('/handbook/publish', payload);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        const message = error.response?.data?.message || error.response?.data?.error;
        if (message === 'Only admins can publish the handbook') {
          throw new Error("You don't have permission to publish the handbook.");
        }
        if (message === 'User not assigned to a company') {
          throw new Error('Your user is not linked to a company; contact support.');
        }
        throw new Error(message || 'Access denied');
      }
      throw error;
    }
  },

  /**
   * Create a new handbook page
   * POST /api/handbook/pages
   *
   * Only admin or company_admin can call this.
   */
  async createPage(payload: CreatePagePayload): Promise<CreatePageResponse> {
    try {
      const response = await axiosClient.post<CreatePageResponse>('/handbook/pages', payload);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        const message = error.response?.data?.message || error.response?.data?.error;
        throw new Error(message || "You don't have permission to create handbook pages.");
      }
      throw error;
    }
  },

  /**
   * Perform a bulk action on multiple handbook pages.
   * POST /api/handbook/bulk-action
   */
  async bulkAction(payload: BulkActionPayload): Promise<BulkActionResponse> {
    try {
      const response = await axiosClient.post<BulkActionResponse>('/handbook/bulk-action', payload);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        const message = error.response?.data?.message || error.response?.data?.error;
        throw new Error(message || "You don't have permission to update these pages.");
      }
      throw error;
    }
  },

  /**
   * Get all links across handbook pages
   * GET /api/handbook/resources/links
   */
  async getResourceLinks(): Promise<import('@/types/models').HandbookResourceLink[]> {
    try {
      const response = await axiosClient.get<{ data: import('@/types/models').HandbookResourceLink[] }>('/handbook/resources/links');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching handbook links:', error);
      throw error;
    }
  },

  /**
   * Get all notes across handbook pages
   * GET /api/handbook/resources/notes
   */
  async getResourceNotes(): Promise<import('@/types/models').HandbookResourceNote[]> {
    try {
      const response = await axiosClient.get<{ data: import('@/types/models').HandbookResourceNote[] }>('/handbook/resources/notes');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching handbook notes:', error);
      throw error;
    }
  },

  /**
   * Get all documents across handbook pages
   * GET /api/handbook/resources/documents
   */
  async getResourceDocuments(): Promise<import('@/types/models').HandbookResourceDocument[]> {
    try {
      const response = await axiosClient.get<{ data: import('@/types/models').HandbookResourceDocument[] }>('/handbook/resources/documents');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching handbook documents:', error);
      throw error;
    }
  },

  /**
   * Upload a file (image or document) for use in handbook pages.
   * Final URL should be POST /api/files, so with our baseURL
   * we call the relative path "/files" here.
   *
   * Expects a JSON response like: { fid: number, uri: string }.
   */
  async uploadFile(file: File): Promise<{ id: number; name: string; url?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosClient.post<{ fid: number; uri?: string }>(
        '/files',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      const fid = response.data?.fid;
      if (!fid) {
        throw new Error('Upload succeeded but no fid was returned.');
      }

      return {
        id: fid,
        name: file.name,
        url: response.data.uri,
      };
    } catch (error: any) {
      console.error('Error uploading handbook file:', error);
      throw new Error(error?.message || 'Failed to upload file.');
    }
  },
};

