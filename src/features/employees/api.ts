import { axiosClient } from '@/lib/axios-client';
import { transformEmployee } from '@/lib/api-transformers';
import {
  Employee,
  EmployeeSummaryStat,
  EmployeePageViewStat,
  EmployeeMessageLog,
} from '@/types/models';

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

    const response = await axiosClient.get<unknown>('/employees', { params: queryParams });
    const employees = Array.isArray(response.data) ? response.data : [];
    return employees.map((emp: unknown) => transformEmployee(emp as Parameters<typeof transformEmployee>[0]));
  },

  async getEmployee(id: string): Promise<Employee | null> {
    try {
      const response = await axiosClient.get<unknown>(`/employees/${id}`);
      return transformEmployee(response.data as Parameters<typeof transformEmployee>[0]);
    } catch (error) {
      return null;
    }
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

    const response = await axiosClient.post<unknown>('/employees', requestBody);

    return transformEmployee(response.data as Parameters<typeof transformEmployee>[0]);
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
    _employeeId: string
  ): Promise<EmployeePageViewStat[]> {
    // Endpoint not in OpenAPI spec - may need to be implemented
    return [];
  },

  async listEmployeeMessageLogs(_params?: {
    employeeId?: string;
    page?: number;
  }): Promise<EmployeeMessageLog[]> {
    // Endpoint not in OpenAPI spec - may need to be implemented
    return [];
  },
};

