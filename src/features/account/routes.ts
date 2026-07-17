export const accountRoutes = {
  account: '/account',
  editCompanyProfile: '/account/company-profile/edit',
  appearance: '/account/appearance',
  departments: '/account/departments',
  addDepartment: '/account/departments/add',
  editDepartment: '/account/departments/edit/:id',
  employmentTypes: '/account/employment-types',
  // Employment types are created via a dialog on the list page (there is no
  // standalone /add page). The `add=1` flag auto-opens that dialog, so links such
  // as the "Create employment type" CTA in the invite-employee form land on a real
  // page instead of an unrouted blank one.
  addEmploymentType: '/account/employment-types?add=1',
  editEmploymentType: '/account/employment-types/edit/:id',
  subscription: '/account/subscription',
  dataRetention: '/account/data-retention',
  myProfile: '/my-profile',
  myActivity: '/my-activity',
  myDocuments: '/my-documents',
} as const;

