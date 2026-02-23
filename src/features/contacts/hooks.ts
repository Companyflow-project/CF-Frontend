import { useQuery } from '@tanstack/react-query';
import { contactsApi } from './api';
import { contactsQueries } from './queries';

export const useContacts = (params?: { page?: number; limit?: number }) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: contactsQueries.list(params),
    queryFn: () => contactsApi.listContacts(params),
    staleTime: 30_000,
  });

  return {
    data: data?.data ?? [],
    meta: data?.meta,
    loading: isLoading,
    error: error as Error | null,
    refetch,
  };
};

export const usePotentialContacts = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: contactsQueries.potential(),
    queryFn: () => contactsApi.listPotentialContacts(),
    staleTime: 60_000,
  });

  return {
    data: data?.data ?? [],
    meta: data?.meta,
    loading: isLoading,
    error: error as Error | null,
    refetch,
  };
};

export const useContactAreas = (lang?: string) => {
  const { data, isLoading } = useQuery({
    queryKey: contactsQueries.areas(lang),
    queryFn: () => contactsApi.getContactAreas(lang),
    staleTime: 5 * 60_000,
  });

  return {
    data: data ?? [],
    loading: isLoading,
  };
};
