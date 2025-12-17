import {
  Employee,
  EmployeeSummaryStat,
  EmployeePageViewStat,
  EmployeeMessageLog,
} from '@/types/models';
import { employeesMock } from './mock-data';

export const employeesApi = {
  async listEmployees(_params?: {
    search?: string;
    sort?: string;
    page?: number;
  }): Promise<Employee[]> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get('/employees', { params });
    // return response.data;

    // basic mock data with simple client-side filtering to mimic backend behaviour
    const params = _params ?? {};
    let data = [...employeesMock];

    if (params.search) {
      const query = params.search.toLowerCase();
      data = data.filter((employee) => {
        const name = employee.name.toLowerCase();
        const email = employee.email.toLowerCase();
        const telephone = (employee.telephone ?? '').toLowerCase();
        return (
          name.includes(query) ||
          email.includes(query) ||
          telephone.includes(query)
        );
      });
    }

    if (params.sort === 'name') {
      data.sort((a, b) => a.name.localeCompare(b.name));
    }

    return data;
  },

  async getEmployee(_id: string): Promise<Employee | null> {
    // TODO: Replace with real API call
    // const response = await axiosClient.get(`/employees/${id}`);
    // return response.data;

    const employee = employeesMock.find((emp) => emp.id === _id);
    return employee ?? null;
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

