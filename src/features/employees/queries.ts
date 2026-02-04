export const employeesQueries = {
  all: ['employees'] as const,
  lists: () => [...employeesQueries.all, 'list'] as const,
  list: (params?: { search?: string; sort?: string; page?: number }) =>
    [...employeesQueries.lists(), params] as const,
  detail: (id: string) => [...employeesQueries.all, 'detail', id] as const,
  stats: (params?: { employeeId?: string }) =>
    [...employeesQueries.all, 'stats', params] as const,
  pageViews: (employeeId: string) =>
    [...employeesQueries.all, 'page-views', employeeId] as const,
  messageLogs: (params?: { employeeId?: string; page?: number }) =>
    [...employeesQueries.all, 'message-logs', params] as const,
} as const;

