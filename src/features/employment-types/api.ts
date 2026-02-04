import { axiosClient } from '@/lib/axios-client';

export interface EmploymentType {
    id: number;
    name: string;
    description: string;
    companyId: number | null;
}

export interface EmploymentTypesResponse {
    data: EmploymentType[];
    error: null;
}

export interface CreateEmploymentTypePayload {
    name: string;
    description?: string;
    companyId: string;
}

export interface AssignEmploymentTypePayload {
    employeeIds: number[];
    employmentTypeId: number;
}

export interface AssignEmploymentTypeResponse {
    data: {
        success: boolean;
        message: string;
    };
    error: null;
}

export const employmentTypesApi = {
    async getEmploymentTypes(companyId: string | number): Promise<EmploymentType[]> {
        const response = await axiosClient.get<EmploymentTypesResponse>('/employment-types', {
            params: { companyId },
        });
        return response.data.data;
    },

    async getEmploymentType(id: string | number): Promise<EmploymentType> {
        const response = await axiosClient.get<{ data: EmploymentType; error: null }>(`/employment-types/${id}`);
        return response.data.data;
    },

    async createEmploymentType(payload: CreateEmploymentTypePayload): Promise<EmploymentType> {
        const response = await axiosClient.post<{ data: EmploymentType; error: null }>('/employment-types', payload);
        return response.data.data;
    },

    async assignEmploymentType(payload: AssignEmploymentTypePayload): Promise<AssignEmploymentTypeResponse['data']> {
        const response = await axiosClient.post<AssignEmploymentTypeResponse>('/employees/assign-type', payload);
        return response.data.data;
    },

    async updateEmploymentType(id: string | number, payload: Partial<CreateEmploymentTypePayload>): Promise<EmploymentType> {
        const response = await axiosClient.put<{ data: EmploymentType; error: null }>(`/employment-types/${id}`, payload);
        return response.data.data;
    },

    async deleteEmploymentType(id: string | number): Promise<void> {
        await axiosClient.delete(`/employment-types/${id}`);
    },
};
