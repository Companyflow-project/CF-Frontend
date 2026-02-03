import { useQuery } from '@tanstack/react-query';
import { departmentsApi } from './api';

export const useDepartments = (companyId: string | undefined) => {
    return useQuery({
        queryKey: ['departments', companyId],
        queryFn: () => {
            if (!companyId) throw new Error('Company ID is required');
            return departmentsApi.getDepartments(companyId);
        },
        enabled: !!companyId,
    });
};

export const useDepartment = (id: string | undefined) => {
    return useQuery({
        queryKey: ['department', id],
        queryFn: () => {
            if (!id) throw new Error('Department ID is required');
            return departmentsApi.getDepartment(id);
        },
        enabled: !!id,
    });
};
