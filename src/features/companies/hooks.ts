import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesApi, UpdateCompanyProfileRequest } from './api';
import { ApiErrorResponse } from '@/lib/api-types';

export const useCompanyProfile = (companyId: number | undefined) => {
    return useQuery({
        queryKey: ['company-profile', companyId],
        queryFn: async () => {
            if (!companyId) {
                throw new Error('Company ID is required');
            }
            try {
                const response = await companiesApi.getProfile(companyId);
                // Backend may return error: {} (empty object) alongside data: null —
                // only treat as real error if there's an actual message/code.
                const err = response.error as { message?: string; code?: string } | null | undefined;
                if (err && (err.message || err.code)) {
                    throw new Error(err.message || 'Failed to fetch company profile');
                }
                return response.data ?? null;
            } catch (err: unknown) {
                // 404 = company profile not created yet — treat as empty, not as error
                const status =
                    err && typeof err === 'object' && 'response' in err
                        ? (err as { response?: { status?: number } }).response?.status
                        : undefined;
                if (status === 404) return null;
                throw err;
            }
        },
        enabled: !!companyId,
        retry: false, // don't hammer the endpoint on failure
    });
};

export const useUpdateCompanyProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            companyId,
            data,
        }: {
            companyId: number;
            data: UpdateCompanyProfileRequest;
        }) => {
            const response = await companiesApi.updateProfile(companyId, data);
            // Cast to unknowns to check if it's an error response
            if ('error' in response && response.error) {
                const errorResponse = response as unknown as ApiErrorResponse;
                throw new Error(errorResponse.error.message || 'Failed to update company profile');
            }
            return response.data;
        },
        onSuccess: async (_data, variables) => {
            // Invalidate and refetch company profile to get updated data (including logo)
            await queryClient.invalidateQueries({ queryKey: ['company-profile', variables.companyId] });
            // Optionally refetch immediately
            await queryClient.refetchQueries({ queryKey: ['company-profile', variables.companyId] });
        },
    });
};
