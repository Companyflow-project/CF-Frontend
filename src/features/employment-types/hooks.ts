import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employmentTypesApi, CreateEmploymentTypePayload, AssignEmploymentTypePayload } from './api';

export const useEmploymentTypes = (companyId?: string | number) => {
    return useQuery({
        queryKey: ['employment-types', companyId],
        queryFn: () => employmentTypesApi.getEmploymentTypes(companyId!),
        enabled: !!companyId,
    });
};

export const useEmploymentType = (id?: string | number) => {
    return useQuery({
        queryKey: ['employment-type', id],
        queryFn: () => employmentTypesApi.getEmploymentType(id!),
        enabled: !!id,
    });
};

export const useCreateEmploymentType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateEmploymentTypePayload) =>
            employmentTypesApi.createEmploymentType(payload),
        onSuccess: () => {
            // Invalidate and refetch employment types list
            queryClient.invalidateQueries({ queryKey: ['employment-types'] });
        },
    });
};

export const useAssignEmploymentType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: AssignEmploymentTypePayload) =>
            employmentTypesApi.assignEmploymentType(payload),
        onSuccess: () => {
            // Invalidate employees list to refresh with updated employment types
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });
};

export const useUpdateEmploymentType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string | number; payload: Partial<CreateEmploymentTypePayload> }) =>
            employmentTypesApi.updateEmploymentType(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employment-types'] });
            queryClient.invalidateQueries({ queryKey: ['employment-type'] });
        },
    });
};

export const useDeleteEmploymentType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string | number) =>
            employmentTypesApi.deleteEmploymentType(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employment-types'] });
        },
    });
};

