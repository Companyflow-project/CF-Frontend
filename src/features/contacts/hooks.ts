import { useState, useEffect } from 'react';
import { Contact } from '@/types/models';
import { contactsApi } from './api';

export const useContacts = (params?: {
  search?: string;
  sort?: string;
  page?: number;
}) => {
  const [data, setData] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const result = await contactsApi.listContacts(params);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch contacts'));
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [params?.search, params?.sort, params?.page]);

  return { data, loading, error, refetch: () => {} };
};

