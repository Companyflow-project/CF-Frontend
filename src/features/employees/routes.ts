export const employeesRoutes = {
  list: '/employees',
  add: '/employees/add',
  edit: (id: string) => `/employees/${id}/edit`,
  statistics: '/employees/statistics',
  statisticsDetail: (id: string) => `/employees/${id}/statistics`,
  messageLogs: '/employees/message-logs',
  messageLogsDetail: (id: string) => `/employees/${id}/message-logs`,
  informationList: '/employees/information-list',
  informationListLinks: '/employees/information-list/links',
  followUp: (id: string) => `/employees/${id}/follow-up`,
} as const;