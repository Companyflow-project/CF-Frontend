import { axiosClient } from '@/lib/axios-client';

export interface Department {
    id: number;
    name: string;
    description: string;
    email: string;
    telephone: string;
    managerName: string;
    managerId: number | null;
    logoUrl: string | null;
}

export interface DepartmentsResponse {
    data: Department[];
    meta: {
        page: number;
        limit: number;
        total: number;
    };
}

export const departmentsApi = {
    async getDepartments(companyId: string | number): Promise<DepartmentsResponse> {
        const response = await axiosClient.get<DepartmentsResponse>('/departments', {
            params: { companyId },
        });
        return response.data;
    },

    async getDepartment(id: string | number): Promise<Department> {
        const response = await axiosClient.get<{ data: Department }>(`/departments/${id}`);
        return response.data.data;
    },
};
