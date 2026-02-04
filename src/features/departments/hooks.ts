import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi, UpdateDepartmentPayload, CreateDepartmentPayload, Department } from './api';

export const useDepartments = (companyId: string | undefined) => {
    return useQuery({
        queryKey: ['departments', companyId],
        queryFn: (): Promise<Department[]> => {
            if (!companyId) throw new Error('Company ID is required');
            return departmentsApi.getDepartments(companyId);
        },
        enabled: !!companyId,
    });
};

function isValidDepartmentId(id: string | undefined): id is string {
    return !!id && id !== 'undefined';
}

export const useDepartment = (id: string | undefined) => {
    return useQuery({
        queryKey: ['department', id],
        queryFn: () => {
            if (!isValidDepartmentId(id)) throw new Error('Department ID is required');
            return departmentsApi.getDepartment(id);
        },
        enabled: isValidDepartmentId(id),
    });
};

export const useCreateDepartment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateDepartmentPayload) => departmentsApi.createDepartment(payload),
        onSuccess: () => {
            // Invalidate departments list to show the new department
            queryClient.invalidateQueries({ queryKey: ['departments'] });
        },
    });
};

export const useUpdateDepartment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string | number; payload: UpdateDepartmentPayload }) =>
            departmentsApi.updateDepartment(id, payload),
        onSuccess: (data) => {
            // Invalidate and refetch department details
            queryClient.invalidateQueries({ queryKey: ['department', String(data.id)] });
            // Invalidate departments list
            queryClient.invalidateQueries({ queryKey: ['departments'] });
        },
    });
};

export const useDeleteDepartment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string | number) => departmentsApi.deleteDepartment(id),
        onSuccess: () => {
            // Invalidate departments list to refresh after deletion
            queryClient.invalidateQueries({ queryKey: ['departments'] });
        },
    });
};
