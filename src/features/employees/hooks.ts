import { useState, useEffect } from 'react';
import { Employee } from '@/types/models';
import { employeesApi } from './api';

export const useEmployees = (params?: {
  search?: string;
  sort?: string;
  page?: number;
}) => {
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const result = await employeesApi.listEmployees(params);
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
  }, [params?.search, params?.sort, params?.page]);

  return { data, loading, error, refetch: () => {} };
};

