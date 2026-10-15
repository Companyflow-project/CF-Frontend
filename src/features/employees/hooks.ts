import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Employee } from '@/types/models';
import { employeesApi, type SaveInfoListLinksPayload } from './api';
import { employeesQueries } from './queries';
import { useAuth } from '@/context/auth-context';

export const useEmployees = (params?: {
  companyId?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchEmployees = async () => {
      // Prioritize passed companyId, fallback to user.companyId
      const targetCompanyId = params?.companyId || (user?.companyId ? String(user.companyId) : undefined);

      if (!targetCompanyId) {
        // If no company ID available, strictly don't fetch
        setLoading(false);
        // Optional: Could set an error here if "No Company" state needs to be explicit
        // setError(new Error('No company linked'));
        return;
      }

      try {
        setLoading(true);
        const result = await employeesApi.listEmployees({
          ...params,
          companyId: targetCompanyId
        });
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch employees'));
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [
    params?.search,
    params?.sort,
    params?.page,
    params?.limit,
    params?.companyId,
    user?.companyId,
    refreshKey
  ]);

  return {
    data,
    loading,
    error,
    refetch: () => setRefreshKey(prev => prev + 1)
  };
};

/** The caller's company Info List links (fixed links + other links). */
export const useInfoListLinks = () => {
  const { user } = useAuth();
  const companyId = user?.companyId ?? null;
  return useQuery({
    queryKey: employeesQueries.infoListLinks(companyId),
    queryFn: () => employeesApi.getInfoListLinks(),
    enabled: companyId != null,
    staleTime: 30_000,
  });
};

/** Save the caller's company Info List links (company admins only). */
export const useSaveInfoListLinks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const companyId = user?.companyId ?? null;
  return useMutation({
    mutationFn: (payload: SaveInfoListLinksPayload) => employeesApi.saveInfoListLinks(payload),
    onSuccess: (saved) => {
      queryClient.setQueryData(employeesQueries.infoListLinks(companyId), saved);
    },
  });
};
