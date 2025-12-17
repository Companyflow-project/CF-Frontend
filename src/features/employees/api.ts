import {
  Employee,
  EmployeeSummaryStat,
  EmployeePageViewStat,
  EmployeeMessageLog,
} from '@/types/models';

export const employeesApi = {
  async listEmployees(_params?: {
    search?: string;
    sort?: string;
    page?: number;
  }): Promise<Employee[]> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get('/employees', { params });
    // return response.data;
    
    return [];
  },

  async getEmployee(_id: string): Promise<Employee | null> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get(`/employees/${id}`);
    // return response.data;
    
    return null;
  },

  async createEmployee(_payload: Partial<Employee>): Promise<Employee> {
    // TODO: Replace with real API call
    // const response = await axiosClient.post('/employees', payload);
    // return response.data;
    
    throw new Error('Not implemented yet');
  },

  async updateEmployee(
    _id: string,
    _payload: Partial<Employee>
  ): Promise<Employee> {
    // TODO: Replace with real API call
    // const response = await axiosClient.put(`/employees/${id}`, payload);
    // return response.data;
    
    throw new Error('Not implemented yet');
  },

  async deleteEmployee(_id: string): Promise<void> {
    // TODO: Replace with real API call
    // await axiosClient.delete(`/employees/${id}`);
    
    throw new Error('Not implemented yet');
  },

  async listEmployeeStats(_params?: {
    employeeId?: string;
  }): Promise<EmployeeSummaryStat[]> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get('/employees/stats', { params });
    // return response.data;
    
    return [];
  },

  async listEmployeePageViewStats(
    _employeeId: string
  ): Promise<EmployeePageViewStat[]> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get(`/employees/${employeeId}/page-views`);
    // return response.data;
    
    return [];
  },

  async listEmployeeMessageLogs(_params?: {
    employeeId?: string;
    page?: number;
  }): Promise<EmployeeMessageLog[]> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get('/employees/message-logs', { params });
    // return response.data;
    
    return [];
  },
};

