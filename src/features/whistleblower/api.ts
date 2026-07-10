import { axiosClient } from '@/lib/axios-client';
import type { ApiResponse } from '@/lib/api-types';

export interface WbFile { id: number; filename: string | null; mimetype: string | null }
export interface WbMessage { sender: 'reporter' | 'handler'; body: string; createdAt: string | null; files: WbFile[] }
export interface WbThread { report: { category: string | null; status: string; createdAt: string | null }; messages: WbMessage[] }
export interface WbDeadlines { acknowledgmentDueAt: string | null; feedbackDueAt: string | null; ackMet: boolean; feedbackMet: boolean }
export interface WbReportListItem extends WbDeadlines { id: number; category: string | null; status: string; isAnonymous: boolean; createdAt: string | null; updatedAt: string | null }
export interface WbReportDetail extends WbDeadlines {
  id: number; category: string | null; status: string; isAnonymous: boolean;
  reporterName: string | null; reporterEmail: string | null;
  createdAt: string | null; acknowledgedAt: string | null; closedAt: string | null; messages: WbMessage[];
}
export interface WbConfig {
  handlerUids: number[]; publicEnabled: boolean; publicToken: string | null; publicUrl: string | null;
  retentionDaysAfterClosure: number; categories: string[]; encryptionConfigured: boolean;
  ackDeadlineDays: number; feedbackDeadlineDays: number;
}
export interface SubmitPayload { category: string; message: string; isAnonymous: boolean; reporterName?: string; reporterEmail?: string }

/** Default categories (mirrors the backend default) for the in-app report form. */
export const WB_DEFAULT_CATEGORIES = ['harassment', 'fraud_financial', 'safety', 'discrimination', 'other'];

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'attachment';
  a.click();
  URL.revokeObjectURL(url);
}

export const whistleblowerApi = {
  // ---- Public ----
  async publicInfo(token: string): Promise<{ companyName: string; categories: string[]; available: boolean }> {
    const r = await axiosClient.get<ApiResponse<{ companyName: string; categories: string[]; available: boolean }>>(`/whistleblower/public/${token}`);
    return r.data.data;
  },
  async publicSubmit(token: string, payload: SubmitPayload): Promise<{ accessCode: string; reportId: number }> {
    const r = await axiosClient.post<ApiResponse<{ accessCode: string; reportId: number }>>(`/whistleblower/public/${token}/report`, payload);
    return r.data.data;
  },

  // ---- Authenticated employee ----
  async authSubmit(payload: SubmitPayload): Promise<{ accessCode: string; reportId: number }> {
    const r = await axiosClient.post<ApiResponse<{ accessCode: string; reportId: number }>>('/whistleblower/report', payload);
    return r.data.data;
  },

  // ---- Reporter (access code) ----
  async reporterThread(accessCode: string): Promise<WbThread> {
    const r = await axiosClient.post<ApiResponse<WbThread>>('/whistleblower/access/thread', { accessCode });
    return r.data.data;
  },
  async reporterReply(accessCode: string, message: string): Promise<void> {
    await axiosClient.post('/whistleblower/access/reply', { accessCode, message });
  },
  async reporterUpload(accessCode: string, file: File): Promise<void> {
    const fd = new FormData();
    fd.append('file', file);
    await axiosClient.post('/whistleblower/access/file', fd, { headers: { 'Content-Type': 'multipart/form-data', 'x-access-code': accessCode } });
  },
  async reporterDownload(fileId: number, accessCode: string, filename: string): Promise<void> {
    const r = await axiosClient.post(`/whistleblower/access/file/${fileId}/download`, { accessCode }, { responseType: 'blob' });
    download(r.data as Blob, filename);
  },

  // ---- Handler ----
  async accessCheck(): Promise<boolean> {
    try {
      const r = await axiosClient.get<ApiResponse<{ isHandler: boolean }>>('/whistleblower/access-check');
      return !!r.data.data?.isHandler;
    } catch {
      return false;
    }
  },
  async handlerList(): Promise<WbReportListItem[]> {
    const r = await axiosClient.get<ApiResponse<WbReportListItem[]>>('/whistleblower/reports');
    return r.data.data ?? [];
  },
  async handlerGet(id: number): Promise<WbReportDetail> {
    const r = await axiosClient.get<ApiResponse<WbReportDetail>>(`/whistleblower/reports/${id}`);
    return r.data.data;
  },
  async handlerReply(id: number, message: string): Promise<void> {
    await axiosClient.post(`/whistleblower/reports/${id}/reply`, { message });
  },
  async handlerStatus(id: number, status: 'open' | 'acknowledged' | 'closed'): Promise<void> {
    await axiosClient.post(`/whistleblower/reports/${id}/status`, { status });
  },
  async handlerUpload(id: number, file: File): Promise<void> {
    const fd = new FormData();
    fd.append('file', file);
    await axiosClient.post(`/whistleblower/reports/${id}/file`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  async handlerDownload(id: number, fileId: number, filename: string): Promise<void> {
    const r = await axiosClient.get(`/whistleblower/reports/${id}/file/${fileId}`, { responseType: 'blob' });
    download(r.data as Blob, filename);
  },

  // ---- Config ----
  async getConfig(): Promise<WbConfig> {
    const r = await axiosClient.get<ApiResponse<WbConfig>>('/whistleblower/config');
    return r.data.data;
  },
  async updateConfig(patch: Partial<WbConfig>): Promise<WbConfig> {
    const r = await axiosClient.put<ApiResponse<WbConfig>>('/whistleblower/config', patch);
    return r.data.data;
  },
};
