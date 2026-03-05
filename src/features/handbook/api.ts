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

type ReorderUpdate = {
  nid: number;
  pid: number;
  weight: number;
};

interface ReorderHandbookResponse {
  success: boolean;
  updatedCount: number;
}

/** Viewer page meta: receipt requirement and tracking status (from page details response). */
export interface HandbookViewerPageMeta {
  field_receipt_value: number;
  trackingStatus: {
    viewedAt: string | number | null;
    signedAt: string | number | null;
  };
  /** Optional top-level mirrors of trackingStatus (backend may return either shape). */
  viewedAt?: string | number | null;
  signedAt?: string | number | null;
}

/** Fixed NID for CompanyFlow template content when in CompanyFlow mode */
export const COMPANY_FLOW_CONTENT_NID = 20134;

/** Default handbook book id for print (main handbook). */
export const DEFAULT_HANDBOOK_PRINT_BID = 21;

/** Single page in handbook print response (book order). */
export interface HandbookPrintPageItem {
  title: string;
  body: string;
  /** If present, only pages with status 'ready' | 'READY' are shown in print view. */
  status?: string;
}

function requireValidNid(nid: number): void {
  if (
    typeof nid !== 'number' ||
    !Number.isFinite(nid) ||
    nid < 0 ||
    Math.floor(nid) !== nid
  ) {
    throw new Error('Invalid handbook page id');
  }
}

export const handbookApi = {
  /**
   * Get handbook page body content (HTML).
   * GET /api/handbook/content/:nid
   * Response is plain text/HTML, not JSON. Returns empty string when no content.
   * CompanyFlow: use COMPANY_FLOW_CONTENT_NID (20134). Custom: use current page's nid.
   */
  async getHandbookContent(nid: number): Promise<string> {
    requireValidNid(nid);
    try {
      const response = await axiosClient.get<string>(`/handbook/content/${nid}`, {
        responseType: 'text',
        transformResponse: [(data) => data],
      });
      return typeof response.data === 'string' ? response.data : '';
    } catch (error: any) {
      if (error.response?.status === 404) return '';
      console.error('Error fetching handbook content:', error);
      throw error;
    }
  },

  /**
   * Save handbook page body content (Custom mode only).
   * POST or PATCH /api/handbook/content/:nid
   * Body: { body_value: "<html string>" }
   */
  async saveHandbookContent(nid: number, bodyValue: string): Promise<{ success: boolean }> {
    requireValidNid(nid);
    try {
      const response = await axiosClient.patch<{ success: boolean }>(
        `/handbook/content/${nid}`,
        { body_value: bodyValue }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error saving handbook content:', error);
      throw error;
    }
  },

  /**
   * Get handbook pages for print/PDF (book order).
   * GET /api/handbook/print/:bid?lang=en&readyOnly=1
   * When readyOnly is true, backend should return only pages with status "ready".
   * Frontend also filters to only show items with status 'ready' when status is present.
   */
  async getHandbookPrint(
    bid: number,
    lang: string = 'da',
    readyOnly: boolean = true
  ): Promise<HandbookPrintPageItem[]> {
    const response = await axiosClient.get<HandbookPrintPageItem[]>(
      `/handbook/print/${bid}`,
      { params: { lang, ...(readyOnly && { readyOnly: 1 }) } }
    );
    const list = Array.isArray(response.data) ? response.data : [];
    return list.filter((item) => {
      if (typeof item.body !== 'string' || item.body.trim() === '') return false;
      if (item.status == null || item.status === '') return true;
      return String(item.status).toLowerCase() === 'ready';
    });
  },

  /**
   * Get viewer page details (receipt requirement + tracking status).
   * GET /api/handbook/viewer-page/:nid (or equivalent)
   * Used to show "Mark as Read" and last viewed/signed dates.
   */
  async getHandbookViewerPageMeta(nid: number): Promise<HandbookViewerPageMeta | null> {
    requireValidNid(nid);
    try {
      const response = await axiosClient.get<HandbookViewerPageMeta>(
        `/handbook/viewer-page/${nid}`
      );
      return response.data ?? null;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      console.error('Error fetching handbook viewer page meta:', error);
      throw error;
    }
  },

  /**
   * Track that the user viewed a handbook page.
   * POST /api/handbook/track-view/:nid
   * Call once per page open (debounced / session) to avoid excessive writes.
   */
  async trackHandbookView(nid: number): Promise<{ success: boolean }> {
    requireValidNid(nid);
    const response = await axiosClient.post<{ success: boolean }>(
      `/handbook/track-view/${nid}`
    );
    return response.data;
  },

  /**
   * Sign receipt for a handbook page (mark as read).
   * POST /api/handbook/sign-receipt/:nid
   */
  async signHandbookReceipt(nid: number): Promise<{ success: boolean }> {
    requireValidNid(nid);
    const response = await axiosClient.post<{ success: boolean }>(
      `/handbook/sign-receipt/${nid}`
    );
    return response.data;
  },

  /**
   * Get handbook tree/overview
   * GET /api/handbook?lang=en
   *
   * Backend response (new shape):
   * {
   *   bid: number;
   *   chapters: HandbookNode[];
   * }
   *
   * This helper unwraps the response and returns only the chapters array so
   * existing callers continue to work without changes.
   *
   * Errors:
   * - 403: "Handbook not yet published" (for employees)
   * - 403: "User not assigned to a company"
   */
  async getHandbookTree(lang: string = 'da'): Promise<{ bid: number | null; chapters: HandbookNode[] }> {
    try {
      const response = await axiosClient.get<{ bid?: number; chapters?: HandbookNode[] }>('/handbook', {
        params: { lang },
      });
      const chapters = response.data?.chapters;
      const bid = response.data?.bid ?? null;
      return { bid: bid ?? null, chapters: Array.isArray(chapters) ? chapters : [] };
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
  async getPageDetail(pageId: number, lang: string = 'da'): Promise<HandbookPageDetail | null> {
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
   * Reorder chapters/pages within a handbook.
   * PATCH /api/handbook/reorder
   */
  async reorderHandbook(
    bid: number,
    updates: ReorderUpdate[],
  ): Promise<ReorderHandbookResponse> {
    const response = await axiosClient.patch<ReorderHandbookResponse>('/handbook/reorder', {
      bid,
      updates,
    });
    return response.data;
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
   * Delete a single handbook page.
   * DELETE /api/handbook/pages/:id
   *
   * Only admin or company_admin can call this.
   */
  async deletePage(id: number): Promise<{ success: boolean }> {
    requireValidNid(id);
    try {
      const response = await axiosClient.delete<{ success: boolean; error?: { message?: string } }>(
        `/handbook/pages/${id}`,
      );
      return response.data ?? { success: true };
    } catch (error: any) {
      const status = error?.response?.status;
      const apiError = error?.response?.data?.error;
      const apiMessage =
        (apiError && typeof apiError.message === 'string' && apiError.message.trim()) ||
        (typeof error?.response?.data?.message === 'string' && error.response.data.message.trim()) ||
        (typeof error?.response?.data?.error === 'string' && error.response.data.error.trim());

      if (status === 403) {
        throw new Error(apiMessage || "Only admins can delete handbook pages.");
      }
      if (status === 404) {
        throw new Error(apiMessage || 'Handbook page not found.');
      }

      throw new Error(apiMessage || 'Failed to delete handbook page.');
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

