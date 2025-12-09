export const employeesRoutes = {
  list: '/employees',
  add: '/employees/add',
  statistics: '/employees/statistics',
  statisticsDetail: (id: string) => `/employees/${id}/statistics`,
  messageLogs: '/employees/message-logs',
  messageLogsDetail: (id: string) => `/employees/${id}/message-logs`,
} as const;

