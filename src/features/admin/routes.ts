export const adminRoutes = {
  dashboard: '/admin',
  companies: '/admin/companies',
  companyDetail: '/admin/companies/:id',
  createCompany: '/admin/companies/create',
  users: '/admin/users',
  subscriptions: '/admin/subscriptions',
  activity: '/admin/activity',
  analytics: '/admin/analytics',
  settings: '/admin/settings',
} as const;
