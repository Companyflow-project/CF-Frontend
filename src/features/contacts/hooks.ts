import { useState, useEffect, useCallback } from 'react';
import { Contact } from '@/types/models';
import { contactsApi } from './api';

export const useContacts = (params?: { page?: number; limit?: number }) => {
  const [data, setData] = useState<Contact[]>([]);
  const [meta, setMeta] = useState<{ page: number; limit: number; total: number } | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const result = await contactsApi.listContacts(params);
      setData(result.data);
      setMeta(result.meta);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch contacts'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [params?.page, params?.limit]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, meta, loading, error, refetch };
};

export const usePotentialContacts = () => {
  const [data, setData] = useState<{ uid: number; name: string }[]>([]);
  const [meta, setMeta] = useState<{ total: number } | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const result = await contactsApi.listPotentialContacts();
      setData(result.data);
      setMeta(result.meta);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch potential contacts'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, meta, loading, error, refetch };
};

export const useContactAreas = (lang?: string) => {
  const [data, setData] = useState<{ tid: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    contactsApi
      .getContactAreas(lang)
      .then((areas) => {
        if (!cancelled) setData(areas);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  return { data, loading };
};
