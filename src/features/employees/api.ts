import {
  Employee,
  EmployeeSummaryStat,
  EmployeePageViewStat,
  EmployeeMessageLog,
} from '@/types/models';
import { axiosClient } from '@/lib/axios-client';

export const employeesApi = {
  async listEmployees(params?: {
    search?: string;
    sort?: string;
    page?: number;
  }): Promise<Employee[]> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get('/employees', { params });
    // return response.data;
    
    return [];
  },

  async getEmployee(id: string): Promise<Employee | null> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get(`/employees/${id}`);
    // return response.data;
    
    return null;
  },

  async createEmployee(payload: Partial<Employee>): Promise<Employee> {
    // TODO: Replace with real API call
    // const response = await axiosClient.post('/employees', payload);
    // return response.data;
    
    throw new Error('Not implemented yet');
  },

  async updateEmployee(
    id: string,
    payload: Partial<Employee>
  ): Promise<Employee> {
    // TODO: Replace with real API call
    // const response = await axiosClient.put(`/employees/${id}`, payload);
    // return response.data;
    
    throw new Error('Not implemented yet');
  },

  async deleteEmployee(id: string): Promise<void> {
    // TODO: Replace with real API call
    // await axiosClient.delete(`/employees/${id}`);
    
    throw new Error('Not implemented yet');
  },

  async listEmployeeStats(params?: {
    employeeId?: string;
  }): Promise<EmployeeSummaryStat[]> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get('/employees/stats', { params });
    // return response.data;
    
    return [];
  },

  async listEmployeePageViewStats(
    employeeId: string
  ): Promise<EmployeePageViewStat[]> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get(`/employees/${employeeId}/page-views`);
    // return response.data;
    
    return [];
  },

  async listEmployeeMessageLogs(params?: {
    employeeId?: string;
    page?: number;
  }): Promise<EmployeeMessageLog[]> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get('/employees/message-logs', { params });
    // return response.data;
    
    return [];
  },
};

