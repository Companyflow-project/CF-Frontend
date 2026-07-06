export const accountRoutes = {
  account: '/account',
  editCompanyProfile: '/account/company-profile/edit',
  appearance: '/account/appearance',
  departments: '/account/departments',
  addDepartment: '/account/departments/add',
  editDepartment: '/account/departments/edit/:id',
  employmentTypes: '/account/employment-types',
  addEmploymentType: '/account/employment-types/add',
  editEmploymentType: '/account/employment-types/edit/:id',
  subscription: '/account/subscription',
  dataRetention: '/account/data-retention',
  myProfile: '/my-profile',
  myActivity: '/my-activity',
  myDocuments: '/my-documents',
} as const;

