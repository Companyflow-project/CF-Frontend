import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from '@/layouts/app-layout';
import { AuthLayout } from '@/layouts/auth-layout';
import { authRoutes } from '@/features/auth/routes';
import { useAuth } from '@/context/auth-context';
import { employeesRoutes } from '@/features/employees/routes';
import { handbookRoutes } from '@/features/handbook/routes';
import { contactsRoutes } from '@/features/contacts/routes';
import { accountRoutes } from '@/features/account/routes';
import { companiesRoutes } from '@/features/companies/routes';
import { userManualRoutes } from '@/features/user-manual/routes';

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

const RedirectIfAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
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
                <AppLayout>
                  <EmployeesPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={employeesRoutes.add}
            element={
              <RequireAuth>
                <AppLayout>
                  <AddEmployeePage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/employees/:id/edit"
            element={
              <RequireAuth>
                <AppLayout>
                  <EditEmployeePage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={employeesRoutes.statistics}
            element={
              <RequireAuth>
                <AppLayout>
                  <EmployeeStatsAllPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/employees/:id/statistics"
            element={
              <RequireAuth>
                <AppLayout>
                  <EmployeeStatsDetailPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={employeesRoutes.messageLogs}
            element={
              <RequireAuth>
                <AppLayout>
                  <EmployeeMessageLogsAllPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/employees/:id/message-logs"
            element={
              <RequireAuth>
                <AppLayout>
                  <EmployeeMessageLogsDetailPage />
                </AppLayout>
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
                <AppLayout>
                  <InformationListLinksPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={handbookRoutes.manage}
            element={
              <RequireAuth>
                <AppLayout>
                  <ManageHandbookPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/handbook/print-view"
            element={
              <RequireAuth>
                <AppLayout>
                  <HandbookPrintPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={handbookRoutes.pages}
            element={
              <RequireAuth>
                <AppLayout>
                  <HandbookPagesPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/handbook/publish/:id"
            element={
              <RequireAuth>
                <AppLayout>
                  <PublishHandbookPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={handbookRoutes.createPage}
            element={
              <RequireAuth>
                <AppLayout>
                  <HandbookPageEditPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/handbook/pages/:id/edit"
            element={
              <RequireAuth>
                <AppLayout>
                  <HandbookPageEditPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={handbookRoutes.addTheme}
            element={
              <RequireAuth>
                <AppLayout>
                  <AddThemePage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/handbook/edit-theme/:id"
            element={
              <RequireAuth>
                <AppLayout>
                  <EditThemePage />
                </AppLayout>
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
                <AppLayout>
                  <HandbookNotesPage />
                </AppLayout>
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
                <AppLayout>
                  <ContactsPage />
                </AppLayout>
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
                <AppLayout>
                  <AccountPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={accountRoutes.editCompanyProfile}
            element={
              <RequireAuth>
                <AppLayout>
                  <EditCompanyProfilePage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={accountRoutes.appearance}
            element={
              <RequireAuth>
                <AppLayout>
                  <AppearancePage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={accountRoutes.departments}
            element={
              <RequireAuth>
                <AppLayout>
                  <ViewDepartmentsPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={accountRoutes.addDepartment}
            element={
              <RequireAuth>
                <AppLayout>
                  <AddDepartmentPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={accountRoutes.editDepartment}
            element={
              <RequireAuth>
                <AppLayout>
                  <EditDepartmentPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path={accountRoutes.employmentTypes}
            element={
              <RequireAuth>
                <AppLayout>
                  <ViewEmploymentTypesPage />
                </AppLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/account/employment-types/:id/assign"
            element={
              <RequireAuth>
                <AppLayout>
                  <AssignEmploymentTypePage />
                </AppLayout>
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
    </BrowserRouter>
  );
};
