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

// Note: backend list response may include extra metadata; we normalize rows individually.

export interface CreateDepartmentPayload {
    name: string;
    description?: string;
    email?: string;
    telephone?: string;
    managerName?: string;
    managerId?: number | null;
    companyId: string | number;
}

export interface UpdateDepartmentPayload {
    name: string;
    description?: string;
    email?: string;
    telephone?: string;
    managerName?: string;
    managerId?: number | null;
}

function normalizeDepartment(raw: Record<string, unknown>): Department {
    return {
        // Prefer the actual department node id (nid), then department_id, then generic id
        id: Number((raw as any).nid ?? raw.department_id ?? raw.id ?? 0),
        name: String(raw.name ?? raw.department_name ?? ''),
        description: String(raw.description ?? ''),
        email: String(raw.email ?? ''),
        telephone: String(raw.telephone ?? ''),
        managerName: String(raw.managerName ?? raw.manager_name ?? ''),
        managerId: raw.managerId != null ? Number(raw.managerId) : raw.manager_id != null ? Number(raw.manager_id) : null,
        logoUrl: raw.logoUrl != null ? String(raw.logoUrl) : raw.logo_url != null ? String(raw.logo_url) : null,
    };
}

export const departmentsApi = {
    async getDepartments(companyId: string | number): Promise<Department[]> {
        const response = await axiosClient.get<any>('/departments', {
            params: { companyId },
        });
        const rawList = response.data?.data ?? response.data;
        if (!Array.isArray(rawList)) {
            throw new Error('Invalid departments list response');
        }
        return rawList.map((row: Record<string, unknown>) => normalizeDepartment(row));
    },

    async getDepartment(id: string | number): Promise<Department> {
        const response = await axiosClient.get<any>(`/departments/${id}`);
        // Handle various response shapes
        let raw = response.data?.data ?? response.data;

        // If raw has a 'department' property that looks like an object, use that (unwrap it)
        if (raw && typeof raw === 'object' && 'department' in raw && typeof raw.department === 'object') {
            raw = raw.department;
        }

        if (!raw || typeof raw !== 'object') throw new Error('Invalid department response');
        return normalizeDepartment(raw as Record<string, unknown>);
    },

    async createDepartment(payload: CreateDepartmentPayload): Promise<Department> {
        const response = await axiosClient.post<{ data: Department; error: null }>('/departments', payload);
        return response.data.data;
    },

    async updateDepartment(id: string | number, payload: UpdateDepartmentPayload): Promise<Department> {
        const response = await axiosClient.put<{ data: Department; error: null }>(`/departments/${id}`, payload);
        return response.data.data;
    },

    async deleteDepartment(id: string | number): Promise<{ message: string }> {
        const response = await axiosClient.delete<{ data: { message: string }; error: null }>(`/departments/${id}`);
        return response.data.data;
    },
};
