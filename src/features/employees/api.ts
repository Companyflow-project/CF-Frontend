import { axiosClient } from '@/lib/axios-client';
import { transformEmployee, BackendEmployeeLike } from '@/lib/api-transformers';
import {
  Employee,
  EmployeeSummaryStat,
  EmployeePageViewStat,
  EmployeeMessageLog,
} from '@/types/models';

// Helper type for standard API response
interface ApiResponse<T> {
  data: T;
  meta?: any;
  error: any;
}

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

export const employeesApi = {
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
    employmentType?: string;
    status?: boolean;
    isSeniorEmployee?: boolean;
    isBusinessAdmin?: boolean;
    sendEmailType?: string;
    photoFile?: File;
  }): Promise<Employee> {
    // Backend expects JSON, not FormData
    // Note: photoFile is not sent in this implementation
    // If photo upload is needed, it should be handled via a separate endpoint
    const requestBody = {
      name: payload.name,
      email: payload.email,
      mobileNumber: payload.mobileNumber,
      ...(payload.alternateNumber && { alternateNumber: payload.alternateNumber }),
      ...(payload.isPublic !== undefined && { isPublic: payload.isPublic }),
      ...(payload.emergencyContactName && { emergencyContactName: payload.emergencyContactName }),
      ...(payload.emergencyContactMobile && { emergencyContactMobile: payload.emergencyContactMobile }),
      ...(payload.emergencyContactIsPublic !== undefined && { emergencyContactIsPublic: payload.emergencyContactIsPublic }),
      ...(payload.employmentType && { employmentType: payload.employmentType }),
      ...(payload.status !== undefined && { status: payload.status }),
      ...(payload.isSeniorEmployee !== undefined && { isSeniorEmployee: payload.isSeniorEmployee }),
      ...(payload.isBusinessAdmin !== undefined && { isBusinessAdmin: payload.isBusinessAdmin }),
      ...(payload.sendEmailType && { sendEmailType: payload.sendEmailType }),
    };

    const response = await axiosClient.post<ApiResponse<BackendEmployeeLike> | BackendEmployeeLike>('/employees', requestBody);

    // Check if response is wrapped in { data: ... }
    const data = 'data' in response.data ? (response.data as ApiResponse<BackendEmployeeLike>).data : (response.data as BackendEmployeeLike);

    return transformEmployee(data);
  },

  async updateEmployee(
    _id: string,
    _payload: Partial<Employee>
  ): Promise<Employee> {
    // Backend is read-only, this would need to be implemented if write operations are added
    throw new Error('Update employee not supported by read-only API');
  },

  async deleteEmployee(id: string): Promise<void> {
    await axiosClient.delete(`/employees/${id}`);
  },

  async listEmployeeStats(_params?: {
    employeeId?: string;
  }): Promise<EmployeeSummaryStat[]> {
    // Endpoint not in OpenAPI spec - may need to be implemented
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
};

