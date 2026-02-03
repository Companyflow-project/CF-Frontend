import { useState, useEffect } from 'react';
import { Employee } from '@/types/models';
import { employeesApi } from './api';
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

