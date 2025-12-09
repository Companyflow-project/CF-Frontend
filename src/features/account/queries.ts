export const accountQueries = {
  all: ['account'] as const,
  detail: () => [...accountQueries.all, 'detail'] as const,
} as const;

