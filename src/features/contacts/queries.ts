export const contactsQueries = {
  all: ['contacts'] as const,
  lists: () => [...contactsQueries.all, 'list'] as const,
  list: (params?: { page?: number; limit?: number }) =>
    [...contactsQueries.lists(), params] as const,
  detail: (id: string) => [...contactsQueries.all, 'detail', id] as const,
  potential: () => [...contactsQueries.all, 'potential'] as const,
  areas: (lang?: string) => [...contactsQueries.all, 'areas', lang ?? null] as const,
} as const;
