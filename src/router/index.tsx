import React, { Suspense, lazy, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/app-layout';
import { AuthLayout } from '@/layouts/auth-layout';
import { authRoutes } from '@/features/auth/routes';
import { useAuth } from '@/context/auth-context';
import { ViewAsEmployeeProvider, useViewAsEmployee } from '@/context/view-as-employee-context';
import { employeesRoutes } from '@/features/employees/routes';
import { handbookRoutes } from '@/features/handbook/routes';
import { contactsRoutes } from '@/features/contacts/routes';
import { accountRoutes } from '@/features/account/routes';
import { companiesRoutes } from '@/features/companies/routes';
import { userManualRoutes } from '@/features/user-manual/routes';

const MagicLinkPage = lazy(() => import('@/features/auth/pages/magic-link-page').then((m) => ({ default: m.MagicLinkPage })));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/forgot-password-page').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/reset-password-page').then((m) => ({ default: m.ResetPasswordPage })));
const ConsolePage = lazy(() => import('@/pages/console/console-page').then((m) => ({ default: m.ConsolePage })));
const LoginPage = lazy(() => import('@/features/auth/pages/login-page').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('@/features/auth/pages/signup-page').then((m) => ({ default: m.SignupPage })));
const EmployeesPage = lazy(() => import('@/features/employees/pages/employees-page').then((m) => ({ default: m.EmployeesPage })));
const AddEmployeePage = lazy(() => import('@/features/employees/pages/add-employee-page').then((m) => ({ default: m.AddEmployeePage })));
const EditEmployeePage = lazy(() => import('@/features/employees/pages/edit-employee-page').then((m) => ({ default: m.EditEmployeePage })));
const EmployeeStatsAllPage = lazy(() => import('@/features/employees/pages/employee-stats-all-page').then((m) => ({ default: m.EmployeeStatsAllPage })));
const EmployeeStatsDetailPage = lazy(() => import('@/features/employees/pages/employee-stats-detail-page').then((m) => ({ default: m.EmployeeStatsDetailPage })));
const EmployeeMessageLogsAllPage = lazy(() => import('@/features/employees/pages/employee-message-logs-all-page').then((m) => ({ default: m.EmployeeMessageLogsAllPage })));
const EmployeeMessageLogsDetailPage = lazy(() => import('@/features/employees/pages/employee-message-logs-detail-page').then((m) => ({ default: m.EmployeeMessageLogsDetailPage })));
const FollowUpPage = lazy(() => import('@/features/employees/pages/follow-up-page').then((m) => ({ default: m.FollowUpPage })));
const InformationListPage = lazy(() => import('@/features/employees/pages/information-list-page').then((m) => ({ default: m.InformationListPage })));
const InformationListLinksPage = lazy(() => import('@/features/employees/pages/information-list-links-page').then((m) => ({ default: m.InformationListLinksPage })));
const ManageHandbookPage = lazy(() => import('@/features/handbook/pages/manage-handbook-page').then((m) => ({ default: m.ManageHandbookPage })));
const HandbookPagesPage = lazy(() => import('@/features/handbook/pages/handbook-pages-page').then((m) => ({ default: m.HandbookPagesPage })));
const HandbookPageEditPage = lazy(() => import('@/features/handbook/pages/handbook-page-edit-page').then((m) => ({ default: m.HandbookPageEditPage })));
const PublishHandbookPage = lazy(() => import('@/features/handbook/pages/publish-handbook-page').then((m) => ({ default: m.PublishHandbookPage })));
const AddThemePage = lazy(() => import('@/features/handbook/pages/add-theme-page').then((m) => ({ default: m.AddThemePage })));
const EditThemePage = lazy(() => import('@/features/handbook/pages/edit-theme-page').then((m) => ({ default: m.EditThemePage })));
const HandbookLinksPage = lazy(() => import('@/features/handbook/pages/handbook-links-page').then((m) => ({ default: m.HandbookLinksPage })));
const HandbookNotesPage = lazy(() => import('@/features/handbook/pages/handbook-notes-page').then((m) => ({ default: m.HandbookNotesPage })));
const HandbookDocumentsPage = lazy(() => import('@/features/handbook/pages/handbook-documents-page').then((m) => ({ default: m.HandbookDocumentsPage })));
const HandbookTableOfContentsPage = lazy(() => import('@/features/handbook/pages/handbook-table-of-contents-page').then((m) => ({ default: m.HandbookTableOfContentsPage })));
const HandbookPrintPage = lazy(() => import('@/features/handbook/pages/handbook-print-page').then((m) => ({ default: m.HandbookPrintPage })));
const HandbookViewerPage = lazy(() => import('@/features/handbook/pages/handbook-viewer-page').then((m) => ({ default: m.HandbookViewerPage })));
const ContactsPage = lazy(() => import('@/features/contacts/pages/contacts-page').then((m) => ({ default: m.ContactsPage })));
const PublicContactsPage = lazy(() => import('@/features/contacts/pages/public-contacts-page').then((m) => ({ default: m.PublicContactsPage })));
const AccountPage = lazy(() => import('@/features/account/pages/account-page').then((m) => ({ default: m.AccountPage })));
const EditCompanyProfilePage = lazy(() => import('@/features/account/pages/edit-company-profile-page').then((m) => ({ default: m.EditCompanyProfilePage })));
const AppearancePage = lazy(() => import('@/features/account/pages/appearance-page').then((m) => ({ default: m.AppearancePage })));
const AddDepartmentPage = lazy(() => import('@/features/account/pages/add-department-page').then((m) => ({ default: m.AddDepartmentPage })));
const ViewDepartmentsPage = lazy(() => import('@/features/account/pages/view-departments-page').then((m) => ({ default: m.ViewDepartmentsPage })));
const EditDepartmentPage = lazy(() => import('@/features/account/pages/edit-department-page').then((m) => ({ default: m.EditDepartmentPage })));
const SubscriptionPage = lazy(() => import('@/features/account/pages/subscription-page').then((m) => ({ default: m.SubscriptionPage })));
const ViewEmploymentTypesPage = lazy(() => import('@/features/employment-types/pages').then((m) => ({ default: m.ViewEmploymentTypesPage })));
const AssignEmploymentTypePage = lazy(() => import('@/features/employment-types/pages').then((m) => ({ default: m.AssignEmploymentTypePage })));
const CompaniesPage = lazy(() => import('@/features/companies/pages/companies-page').then((m) => ({ default: m.CompaniesPage })));
const CompanyDetailPage = lazy(() => import('@/features/companies/pages/company-detail-page').then((m) => ({ default: m.CompanyDetailPage })));
const UserManualPage = lazy(() => import('@/features/user-manual/pages/user-manual-page').then((m) => ({ default: m.UserManualPage })));

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <span className="text-[#373b3b]">Loading…</span>
  </div>
);

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return <PageFallback />;
  }
  if (!isAuthenticated) {
    return <Navigate to={authRoutes.login} state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

const ADMIN_ROLES = new Set(['ADMIN', 'company_admin', 'MANAGER']);

const RequireAdminRole: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const { viewAsEmployee } = useViewAsEmployee();
  if (loading) return <PageFallback />;
  if (!user || !ADMIN_ROLES.has(user.role) || viewAsEmployee) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const STRICT_ADMIN_ROLES = new Set(['ADMIN', 'company_admin']);

const RequireStrictAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const { viewAsEmployee } = useViewAsEmployee();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const [dismissed, setDismissed] = useState(false);

  if (loading) return <PageFallback />;

  if (viewAsEmployee) {
    return <Navigate to="/" replace />;
  }

  if (!user || !STRICT_ADMIN_ROLES.has(user.role)) {
    if (dismissed) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-[18px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] max-w-md w-full mx-4 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-[#fef3c7] flex items-center justify-center flex-shrink-0">
              <svg className="h-5 w-5 text-[#d97706]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#0d0e0e]">{t('accessRestricted.title')}</h2>
          </div>
          <p className="text-sm text-[#6b7280] mb-6">
            {t('accessRestricted.message')}
          </p>
          <button
            onClick={() => {
              setDismissed(true);
              navigate('/', { replace: true });
            }}
            className="w-full px-4 py-2.5 bg-[#0d0e0e] text-white text-sm font-medium rounded-[10px] hover:bg-[#0d0e0e]/90 transition-colors"
          >
            {t('accessRestricted.goHome')}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const RedirectIfAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ViewAsEmployeeProvider>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route
            path={authRoutes.login}
            element={
              <RedirectIfAuth>
                <AuthLayout>
                  <LoginPage />
                </AuthLayout>
              </RedirectIfAuth>
            }
          />
          <Route
            path={authRoutes.signup}
            element={
              <RedirectIfAuth>
                <AuthLayout>
                  <SignupPage />
                </AuthLayout>
              </RedirectIfAuth>
            }
          />
          <Route
            path="/magic-link/:token"
            element={
              <AuthLayout>
                <MagicLinkPage />
              </AuthLayout>
            }
          />
          <Route
            path={authRoutes.forgotPassword}
            element={
              <RedirectIfAuth>
                <AuthLayout>
                  <ForgotPasswordPage />
                </AuthLayout>
              </RedirectIfAuth>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <RedirectIfAuth>
                <AuthLayout>
                  <ResetPasswordPage />
                </AuthLayout>
              </RedirectIfAuth>
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppLayout>
                  <ConsolePage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={userManualRoutes.root}
            element={
              <RequireAuth>
                <UserManualPage />
              </RequireAuth>
            }
          />
          <Route
            path={`${userManualRoutes.root}/:nid`}
            element={
              <RequireAuth>
                <UserManualPage />
              </RequireAuth>
            }
          />
          <Route
            path={employeesRoutes.list}
            element={
              <RequireAuth>
                <RequireAdminRole>
                  <AppLayout>
                    <EmployeesPage />
                  </AppLayout>
                </RequireAdminRole>
              </RequireAuth>
            }
          />
          <Route
            path={employeesRoutes.add}
            element={
              <RequireAuth>
                <RequireAdminRole>
                  <AppLayout>
                    <AddEmployeePage />
                  </AppLayout>
                </RequireAdminRole>
              </RequireAuth>
            }
          />
          <Route
            path="/employees/:id/edit"
            element={
              <RequireAuth>
                <RequireAdminRole>
                  <AppLayout>
                    <EditEmployeePage />
                  </AppLayout>
                </RequireAdminRole>
              </RequireAuth>
            }
          />
          <Route
            path={employeesRoutes.statistics}
            element={
              <RequireAuth>
                <RequireAdminRole>
                  <AppLayout>
                    <EmployeeStatsAllPage />
                  </AppLayout>
                </RequireAdminRole>
              </RequireAuth>
            }
          />
          <Route
            path="/employees/:id/statistics"
            element={
              <RequireAuth>
                <RequireAdminRole>
                  <AppLayout>
                    <EmployeeStatsDetailPage />
                  </AppLayout>
                </RequireAdminRole>
              </RequireAuth>
            }
          />
          <Route
            path={employeesRoutes.messageLogs}
            element={
              <RequireAuth>
                <RequireAdminRole>
                  <AppLayout>
                    <EmployeeMessageLogsAllPage />
                  </AppLayout>
                </RequireAdminRole>
              </RequireAuth>
            }
          />
          <Route
            path="/employees/:id/message-logs"
            element={
              <RequireAuth>
                <RequireAdminRole>
                  <AppLayout>
                    <EmployeeMessageLogsDetailPage />
                  </AppLayout>
                </RequireAdminRole>
              </RequireAuth>
            }
          />
          <Route
            path="/employees/:id/follow-up"
            element={
              <RequireAuth>
                <RequireAdminRole>
                  <AppLayout>
                    <FollowUpPage />
                  </AppLayout>
                </RequireAdminRole>
              </RequireAuth>
            }
          />
          <Route
            path={employeesRoutes.informationList}
            element={
              <RequireAuth>
                <AppLayout>
                  <InformationListPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={employeesRoutes.informationListLinks}
            element={
              <RequireAuth>
                <RequireAdminRole>
                  <AppLayout>
                    <InformationListLinksPage />
                  </AppLayout>
                </RequireAdminRole>
              </RequireAuth>
            }
          />
          <Route
            path={handbookRoutes.manage}
            element={
              <RequireAuth>
                <RequireAdminRole>
                  <AppLayout>
                    <ManageHandbookPage />
                  </AppLayout>
                </RequireAdminRole>
              </RequireAuth>
            }
          />
          <Route
            path="/handbook/print-view"
            element={
              <RequireAuth>
                <RequireAdminRole>
                  <AppLayout>
                    <HandbookPrintPage />
                  </AppLayout>
                </RequireAdminRole>
              </RequireAuth>
            }
          />
          <Route
            path={handbookRoutes.pages}
            element={
              <RequireAuth>
                <RequireAdminRole>
                  <AppLayout>
                    <HandbookPagesPage />
                  </AppLayout>
                </RequireAdminRole>
              </RequireAuth>
            }
          />
          <Route
            path="/handbook/publish/:id"
            element={
              <RequireAuth>
                <RequireStrictAdmin>
                  <AppLayout>
                    <PublishHandbookPage />
                  </AppLayout>
                </RequireStrictAdmin>
              </RequireAuth>
            }
          />
          <Route
            path={handbookRoutes.createPage}
            element={
              <RequireAuth>
                <RequireStrictAdmin>
                  <AppLayout>
                    <HandbookPageEditPage />
                  </AppLayout>
                </RequireStrictAdmin>
              </RequireAuth>
            }
          />
          <Route
            path="/handbook/pages/:id/edit"
            element={
              <RequireAuth>
                <RequireStrictAdmin>
                  <AppLayout>
                    <HandbookPageEditPage />
                  </AppLayout>
                </RequireStrictAdmin>
              </RequireAuth>
            }
          />
          <Route
            path={handbookRoutes.addTheme}
            element={
              <RequireAuth>
                <RequireStrictAdmin>
                  <AppLayout>
                    <AddThemePage />
                  </AppLayout>
                </RequireStrictAdmin>
              </RequireAuth>
            }
          />
          <Route
            path="/handbook/edit-theme/:id"
            element={
              <RequireAuth>
                <RequireStrictAdmin>
                  <AppLayout>
                    <EditThemePage />
                  </AppLayout>
                </RequireStrictAdmin>
              </RequireAuth>
            }
          />
          <Route
            path={handbookRoutes.links}
            element={
              <RequireAuth>
                <AppLayout>
                  <HandbookLinksPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={handbookRoutes.notes}
            element={
              <RequireAuth>
                <RequireAdminRole>
                  <AppLayout>
                    <HandbookNotesPage />
                  </AppLayout>
                </RequireAdminRole>
              </RequireAuth>
            }
          />
          <Route
            path={handbookRoutes.documents}
            element={
              <RequireAuth>
                <AppLayout>
                  <HandbookDocumentsPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={handbookRoutes.tableOfContents}
            element={
              <RequireAuth>
                <AppLayout>
                  <HandbookTableOfContentsPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={contactsRoutes.list}
            element={
              <RequireAuth>
                <RequireAdminRole>
                  <AppLayout>
                    <ContactsPage />
                  </AppLayout>
                </RequireAdminRole>
              </RequireAuth>
            }
          />
          <Route
            path={contactsRoutes.informationList}
            element={
              <RequireAuth>
                <AppLayout>
                  <PublicContactsPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={accountRoutes.account}
            element={
              <RequireAuth>
                <RequireStrictAdmin>
                  <AppLayout>
                    <AccountPage />
                  </AppLayout>
                </RequireStrictAdmin>
              </RequireAuth>
            }
          />
          <Route
            path={accountRoutes.editCompanyProfile}
            element={
              <RequireAuth>
                <RequireStrictAdmin>
                  <AppLayout>
                    <EditCompanyProfilePage />
                  </AppLayout>
                </RequireStrictAdmin>
              </RequireAuth>
            }
          />
          <Route
            path={accountRoutes.appearance}
            element={
              <RequireAuth>
                <RequireStrictAdmin>
                  <AppLayout>
                    <AppearancePage />
                  </AppLayout>
                </RequireStrictAdmin>
              </RequireAuth>
            }
          />
          <Route
            path={accountRoutes.departments}
            element={
              <RequireAuth>
                <RequireStrictAdmin>
                  <AppLayout>
                    <ViewDepartmentsPage />
                  </AppLayout>
                </RequireStrictAdmin>
              </RequireAuth>
            }
          />
          <Route
            path={accountRoutes.addDepartment}
            element={
              <RequireAuth>
                <RequireStrictAdmin>
                  <AppLayout>
                    <AddDepartmentPage />
                  </AppLayout>
                </RequireStrictAdmin>
              </RequireAuth>
            }
          />
          <Route
            path={accountRoutes.editDepartment}
            element={
              <RequireAuth>
                <RequireStrictAdmin>
                  <AppLayout>
                    <EditDepartmentPage />
                  </AppLayout>
                </RequireStrictAdmin>
              </RequireAuth>
            }
          />
          <Route
            path={accountRoutes.subscription}
            element={
              <RequireAuth>
                <RequireStrictAdmin>
                  <AppLayout>
                    <SubscriptionPage />
                  </AppLayout>
                </RequireStrictAdmin>
              </RequireAuth>
            }
          />
          <Route
            path={accountRoutes.employmentTypes}
            element={
              <RequireAuth>
                <RequireStrictAdmin>
                  <AppLayout>
                    <ViewEmploymentTypesPage />
                  </AppLayout>
                </RequireStrictAdmin>
              </RequireAuth>
            }
          />
          <Route
            path="/account/employment-types/:id/assign"
            element={
              <RequireAuth>
                <RequireStrictAdmin>
                  <AppLayout>
                    <AssignEmploymentTypePage />
                  </AppLayout>
                </RequireStrictAdmin>
              </RequireAuth>
            }
          />
          <Route
            path="/employees/assign-employment-type"
            element={
              <RequireAuth>
                <AppLayout>
                  <AssignEmploymentTypePage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={companiesRoutes.list}
            element={
              <RequireAuth>
                <AppLayout>
                  <CompaniesPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={companiesRoutes.detail}
            element={
              <RequireAuth>
                <AppLayout>
                  <CompanyDetailPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/handbooks/:handbookId/viewer"
            element={
              <RequireAuth>
                <AppLayout>
                  <HandbookViewerPage />
                </AppLayout>
              </RequireAuth>
            }
          />
        </Routes>
      </Suspense>
      </ViewAsEmployeeProvider>
    </BrowserRouter>
  );
};
