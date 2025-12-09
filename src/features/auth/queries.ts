export const authQueries = {
  all: ['auth'] as const,
  me: () => [...authQueries.all, 'me'] as const,
} as const;

