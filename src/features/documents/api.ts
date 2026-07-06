import { axiosClient } from '@/lib/axios-client';
import type { ApiResponse } from '@/lib/api-types';

export type DocRequirement = 'signature' | 'approval';
export type DocStatus = 'pending' | 'signed' | 'approved';

export interface EmployeeDocument {
  id: number;
  uid: number;
  fileUri: string;
  filename: string | null;
  title: string | null;
  requirement: DocRequirement;
  status: DocStatus;
  assignedAt: number;
  completedAt: number | null;
}

/** CF-22: per-employee documents requiring signature or approval. */
export const documentsApi = {
  /** Upload a file (reuses POST /files) and return its fid + uri. */
  async uploadFile(file: File): Promise<{ fid: number; uri: string }> {
    const fd = new FormData();
    fd.append('file', file);
    const resp = await axiosClient.post<{ fid: number; uri: string }>('/files', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { fid: resp.data.fid, uri: resp.data.uri };
  },

  async assign(payload: { employeeId: number; fid: number; fileUri: string; filename?: string; title?: string; requirement: DocRequirement }): Promise<void> {
    await axiosClient.post('/employee-documents', payload);
  },

  async listForEmployee(employeeId: string): Promise<EmployeeDocument[]> {
    const resp = await axiosClient.get<ApiResponse<EmployeeDocument[]>>(`/employee-documents?employeeId=${employeeId}`);
    return resp.data.data ?? [];
  },

  async listMine(): Promise<EmployeeDocument[]> {
    const resp = await axiosClient.get<ApiResponse<EmployeeDocument[]>>('/employee-documents/me');
    return resp.data.data ?? [];
  },

  async complete(id: number, signatureImage?: string): Promise<void> {
    await axiosClient.post(`/employee-documents/${id}/complete`, signatureImage ? { signatureImage } : {});
  },
};
