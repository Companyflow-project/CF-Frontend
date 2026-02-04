export const contactsQueries = {
  all: ['contacts'] as const,
  lists: () => [...contactsQueries.all, 'list'] as const,
  list: (params?: { search?: string; sort?: string; page?: number }) =>
    [...contactsQueries.lists(), params] as const,
  detail: (id: string) => [...contactsQueries.all, 'detail', id] as const,
} as const;

