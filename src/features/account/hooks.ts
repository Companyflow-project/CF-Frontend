import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Account } from '@/types/models';
import { accountApi, CompanyAppearance } from './api';

export const useAccount = () => {
  const [data, setData] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        setLoading(true);
        const result = await accountApi.getAccount();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch account'));
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, []);

  return { data, loading, error, refetch: () => { } };
};

export const useCompanyAppearance = () => {
  return useQuery({
    queryKey: ['company-appearance'],
    queryFn: () => accountApi.getCompanyAppearance(),
  });
};

export const useUpdateCompanyAppearance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CompanyAppearance) => accountApi.updateCompanyAppearance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-appearance'] });
    },
  });
};

