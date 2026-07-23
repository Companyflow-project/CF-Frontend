import { axiosClient } from '@/lib/axios-client';
import { transformEmployee, BackendEmployeeLike } from '@/lib/api-transformers';
import {
  Employee,
  EmployeeSummaryStat,
  EmployeePageViewStat,
  EmployeeMessageLog,
} from '@/types/models';
import type { ApiResponse } from '@/lib/api-types';

interface EmployeeStatisticsData {
  id: number;
  name: string;
  email: string;
  pageViews: number;
  messages: number;
  lastVisit: string | null;
}

interface EmployeeMessagesMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ImportEmployeesResult {
  imported: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export const employeesApi = {
  /** CF-20: bulk-import employees from a CSV file (multipart field "file"). */
  async importEmployees(file: File): Promise<ImportEmployeesResult> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosClient.post<{ data: ImportEmployeesResult }>('/employees/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data ?? { imported: 0, failed: 0, errors: [] };
  },

  /** CF-12: permanently erase (anonymize) one employee's personal data. Irreversible. */
  async eraseEmployeeData(id: string): Promise<void> {
    await axiosClient.post(`/employees/${id}/erase`);
  },

  /** CF-13: download a GDPR data export for one employee (authed blob → file). */
  async exportEmployeeData(id: string): Promise<void> {
    const response = await axiosClient.get(`/employees/${id}/export`, { responseType: 'blob' });
    const blob = new Blob([response.data as BlobPart], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee-${id}-data-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async listEmployees(params?: {
    companyId?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<Employee[]> {
    const queryParams: Record<string, string> = {};
    if (params?.companyId) queryParams.companyId = params.companyId;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);

    const response = await axiosClient.get<ApiResponse<BackendEmployeeLike[]> | BackendEmployeeLike[]>('/employees', { params: queryParams });

    // Handle both wrapped { data: [...] } and plain [...] responses for backward compatibility
    let employees: BackendEmployeeLike[] = [];
    if (Array.isArray(response.data)) {
      employees = response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      employees = response.data.data;
    }

    return employees.map((emp) => transformEmployee(emp));
  },

  async getEmployee(id: string): Promise<Employee | null> {
    try {
      const response = await axiosClient.get<ApiResponse<BackendEmployeeLike> | BackendEmployeeLike>(`/employees/${id}`);
      const data = 'data' in response.data ? (response.data as ApiResponse<BackendEmployeeLike>).data : (response.data as BackendEmployeeLike);
      return transformEmployee(data);
    } catch (error) {
      return null;
    }
  },

  async getEmployeeStatistics(id: string): Promise<EmployeeStatisticsData> {
    const response = await axiosClient.get<ApiResponse<EmployeeStatisticsData> | EmployeeStatisticsData>(
      `/employees/${id}/statistics`
    );

    // Support both wrapped { data: {...} } and plain {...}
    if ('data' in response.data) {
      return (response.data as ApiResponse<EmployeeStatisticsData>).data;
    }

    return response.data as EmployeeStatisticsData;
  },

  async createEmployee(payload: {
    name: string;
    email: string;
    mobileNumber: string;
    alternateNumber?: string;
    isPublic?: boolean;
    emergencyContactName?: string;
    emergencyContactMobile?: string;
    emergencyContactIsPublic?: boolean;
    /** Alias accepted by the backend; sent alongside emergencyContactIsPublic */
    isEmergencyPublic?: boolean;
    employmentType?: string;
    status?: boolean;
    isSeniorEmployee?: boolean;
    isBusinessAdmin?: boolean;
    sendEmailType?: string;
    /** Also send the invite by SMS to the employee's mobile number */
    sendSmsInvite?: boolean;
    /** Optional custom message included in the welcome email when sendEmailType is 'customized' */
    customMessage?: string;
    /** fid returned from POST /files — links the uploaded photo to the employee */
    userPictureFid?: number;
    /** Responsibility ids from GET /api/responsibilities */
    responsibilityIds?: number[];
    /** Language codes assigned to this employee */
    languages?: string[];
  }): Promise<Employee> {
    const requestBody = {
      name: payload.name,
      email: payload.email,
      mobileNumber: payload.mobileNumber,
      status: payload.status,
      isPublic: payload.isPublic ?? false,
      ...(payload.alternateNumber && { alternateNumber: payload.alternateNumber }),
      ...(payload.emergencyContactName && { emergencyContactName: payload.emergencyContactName }),
      ...(payload.emergencyContactMobile && { emergencyContactMobile: payload.emergencyContactMobile }),
      ...(payload.emergencyContactIsPublic !== undefined && { emergencyContactIsPublic: payload.emergencyContactIsPublic }),
      ...(payload.isEmergencyPublic !== undefined && { isEmergencyPublic: payload.isEmergencyPublic }),
      // employmentType accepts string | number; omit the 'none' sentinel
      ...(payload.employmentType && payload.employmentType !== 'none' && { employmentType: payload.employmentType }),
      ...(payload.isSeniorEmployee !== undefined && { isSeniorEmployee: payload.isSeniorEmployee }),
      ...(payload.isBusinessAdmin !== undefined && { isBusinessAdmin: payload.isBusinessAdmin }),
      ...(payload.responsibilityIds && payload.responsibilityIds.length > 0 && {
        responsibilityIds: payload.responsibilityIds,
      }),
      ...(payload.sendEmailType && payload.sendEmailType !== 'no' && { sendEmailType: payload.sendEmailType }),
      ...(payload.sendSmsInvite && { sendSmsInvite: true }),
      ...(payload.customMessage && { customMessage: payload.customMessage }),
      ...(payload.languages && payload.languages.length > 0 && { languages: payload.languages }),
    };

    const response = await axiosClient.post<ApiResponse<BackendEmployeeLike> | BackendEmployeeLike>('/employees', requestBody);

    // Check if response is wrapped in { data: ... }
    const data = 'data' in response.data ? (response.data as ApiResponse<BackendEmployeeLike>).data : (response.data as BackendEmployeeLike);

    return transformEmployee(data);
  },

  async updateEmployee(
    id: string,
    payload: {
      name?: string;
      email?: string;
      mobileNumber?: string;
      alternateNumber?: string;
      telephone?: string;
      isPublic?: boolean;
      emergencyContactName?: string;
      emergencyContactMobile?: string;
      emergencyContactIsPublic?: boolean;
      /** Alias accepted by the backend; sent alongside emergencyContactIsPublic */
      isEmergencyPublic?: boolean;
      employmentType?: string;
      employmentTitle?: string;
      status?: boolean;
      isSeniorEmployee?: boolean;
      isBusinessAdmin?: boolean;
      /** fid returned from POST /files — links the uploaded photo to the employee. null = clear photo. */
      userPictureFid?: number | null;
      /** Responsibility ids from GET /api/responsibilities */
      responsibilityIds?: number[];
      /** Language codes assigned to this employee */
      languages?: string[];
      sendEmailType?: string;
      /** Also send the invite by SMS to the employee's mobile number */
      sendSmsInvite?: boolean;
      /** Optional custom message included in the welcome email when sendEmailType is 'customized' */
      customMessage?: string;
    }
  ): Promise<Employee> {
    const requestBody: Record<string, unknown> = {};
    if (payload.name !== undefined) requestBody.name = payload.name;
    if (payload.email !== undefined) requestBody.email = payload.email;
    if (payload.mobileNumber !== undefined) requestBody.mobileNumber = payload.mobileNumber;
    if (payload.alternateNumber !== undefined) requestBody.alternateNumber = payload.alternateNumber;
    if (payload.telephone !== undefined) requestBody.telephone = payload.telephone;
    if (payload.isPublic !== undefined) requestBody.isPublic = payload.isPublic;
    if (payload.emergencyContactName !== undefined) requestBody.emergencyContactName = payload.emergencyContactName;
    if (payload.emergencyContactMobile !== undefined) requestBody.emergencyContactMobile = payload.emergencyContactMobile;
    // Send both field names for backward/forward compat
    if (payload.emergencyContactIsPublic !== undefined) requestBody.emergencyContactIsPublic = payload.emergencyContactIsPublic;
    if (payload.isEmergencyPublic !== undefined) requestBody.isEmergencyPublic = payload.isEmergencyPublic;
    if (payload.employmentType !== undefined) requestBody.employmentType = payload.employmentType;
    if (payload.employmentTitle !== undefined) requestBody.employmentTitle = payload.employmentTitle;
    if (payload.status !== undefined) requestBody.status = payload.status;
    if (payload.isSeniorEmployee !== undefined) requestBody.isSeniorEmployee = payload.isSeniorEmployee;
    if (payload.isBusinessAdmin !== undefined) requestBody.isBusinessAdmin = payload.isBusinessAdmin;
    if (payload.userPictureFid !== undefined) requestBody.userPictureFid = payload.userPictureFid;
    if (payload.responsibilityIds !== undefined) {
      requestBody.responsibilityIds = payload.responsibilityIds;
    }
    if (payload.languages !== undefined) {
      requestBody.languages = payload.languages;
    }
    if (payload.sendEmailType && payload.sendEmailType !== 'no') {
      requestBody.sendEmailType = payload.sendEmailType;
    }
    if (payload.sendSmsInvite) {
      requestBody.sendSmsInvite = true;
    }
    if (payload.customMessage) {
      requestBody.customMessage = payload.customMessage;
    }

    const response = await axiosClient.patch<ApiResponse<BackendEmployeeLike> | BackendEmployeeLike>(
      `/employees/${id}`,
      requestBody
    );
    const data = 'data' in response.data ? (response.data as ApiResponse<BackendEmployeeLike>).data : (response.data as BackendEmployeeLike);
    return transformEmployee(data);
  },

  async deleteEmployee(id: string): Promise<void> {
    await axiosClient.delete(`/employees/${id}`);
  },

  async listEmployeeStats(params?: {
    companyId?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<EmployeeSummaryStat[]> {
    const queryParams: Record<string, string> = {};
    if (params?.companyId) queryParams.companyId = params.companyId;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.search) queryParams.search = params.search;

    const response = await axiosClient.get<ApiResponse<EmployeeSummaryStat[]> | EmployeeSummaryStat[]>(
      '/employees/statistics',
      { params: queryParams }
    );

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (response.data && Array.isArray((response.data as ApiResponse<EmployeeSummaryStat[]>).data)) {
      return (response.data as ApiResponse<EmployeeSummaryStat[]>).data;
    }

    return [];
  },

  async listEmployeePageViewStats(
    employeeId: string
  ): Promise<EmployeePageViewStat[]> {
    const response = await axiosClient.get<ApiResponse<EmployeePageViewStat[]> | EmployeePageViewStat[]>(
      `/employees/${employeeId}/page-views`
    );

    if ('data' in response.data) {
      return (response.data as ApiResponse<EmployeePageViewStat[]>).data;
    }

    return response.data as EmployeePageViewStat[];
  },

  async listEmployeeMessageLogs(params: {
    employeeId: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: EmployeeMessageLog[]; meta: EmployeeMessagesMeta | undefined }> {
    const { employeeId, page = 1, limit = 5 } = params;

    const response = await axiosClient.get<
      ApiResponse<EmployeeMessageLog[]> | EmployeeMessageLog[]
    >(`/employees/${employeeId}/messages`, {
      params: { page, limit },
    });

    if ('data' in response.data) {
      const typed = response.data as ApiResponse<any>;
      // Handle potential double nesting: { data: { data: [...] } }
      const nestedData = typed.data && typeof typed.data === 'object' && 'data' in typed.data ? typed.data.data : typed.data;
      const nestedMeta = typed.data && typeof typed.data === 'object' && 'meta' in typed.data ? typed.data.meta : typed.meta;

      return {
        data: (Array.isArray(nestedData) ? nestedData : []) as EmployeeMessageLog[],
        meta: (nestedMeta || typed.meta) as EmployeeMessagesMeta | undefined,
      };
    }

    return {
      data: response.data as EmployeeMessageLog[],
      meta: undefined,
    };
  },
  /**
   * Upload a profile photo for an employee.
   * Step 1 of the two-step photo flow: POST /files with multipart/form-data.
   * Returns { fid, uri } — pass fid as userPictureFid in the subsequent PATCH.
   */
  async uploadProfilePhoto(file: File): Promise<{ fid: number; uri: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosClient.post<{ fid: number; uri?: string }>(
      '/files',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    const fid = response.data?.fid;
    if (!fid) throw new Error('Upload succeeded but no fid was returned.');
    return { fid, uri: response.data.uri ?? '' };
  },

  async sendFollowUp(params: {
    employeeIds: number[];
    channels?: Array<'email' | 'sms'>;
    customSubject?: string;
    customMessage?: string;
    smsMessage?: string;
  }): Promise<{ success: boolean; count: number; smsSent?: number; smsErrors?: string[] }> {
    const response = await axiosClient.post<ApiResponse<{ success: boolean; count: number; smsSent?: number; smsErrors?: string[] }>>(
      '/employees/follow-up',
      params,
    );
    return response.data?.data ?? { success: true, count: 0 };
  },

  async generateMagicLink(employeeId: string): Promise<string> {
    const response = await axiosClient.post<ApiResponse<{ url: string }>>(`/employees/${employeeId}/magic-link`);
    const url = response.data?.data?.url;
    if (!url) throw new Error('Failed to generate magic link');
    return url;
  },
};

