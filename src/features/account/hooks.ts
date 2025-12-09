import { useState, useEffect } from 'react';
import { Account } from '@/types/models';
import { accountApi } from './api';

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

  return { data, loading, error, refetch: () => {} };
};

