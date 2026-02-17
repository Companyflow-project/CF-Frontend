import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from '@/layouts/app-layout';
import { AuthLayout } from '@/layouts/auth-layout';
import { ConsolePage } from '@/pages/console/console-page';
import { LoginPage } from '@/features/auth/pages/login-page';
import { SignupPage } from '@/features/auth/pages/signup-page';
import { EmployeesPage } from '@/features/employees/pages/employees-page';
import { AddEmployeePage } from '@/features/employees/pages/add-employee-page';
import { EmployeeStatsAllPage } from '@/features/employees/pages/employee-stats-all-page';
import { EmployeeStatsDetailPage } from '@/features/employees/pages/employee-stats-detail-page';
import { EmployeeMessageLogsAllPage } from '@/features/employees/pages/employee-message-logs-all-page';
import { EmployeeMessageLogsDetailPage } from '@/features/employees/pages/employee-message-logs-detail-page';

import { ManageHandbookPage } from '@/features/handbook/pages/manage-handbook-page';
import { HandbookPagesPage } from '@/features/handbook/pages/handbook-pages-page';
import { HandbookPageEditPage } from '@/features/handbook/pages/handbook-page-edit-page';
import { EditThemePage } from '@/features/handbook/pages/edit-theme-page';
import { HandbookLinksPage } from '@/features/handbook/pages/handbook-links-page';
import { HandbookNotesPage } from '@/features/handbook/pages/handbook-notes-page';
import { HandbookDocumentsPage } from '@/features/handbook/pages/handbook-documents-page';
import { ContactsPage } from '@/features/contacts/pages/contacts-page';
import { AccountPage } from '@/features/account/pages/account-page';
import { EditCompanyProfilePage } from '@/features/account/pages/edit-company-profile-page';
import { AppearancePage } from '@/features/account/pages/appearance-page';
import { AddDepartmentPage } from '@/features/account/pages/add-department-page';
import { ViewDepartmentsPage } from '@/features/account/pages/view-departments-page';
import { EditDepartmentPage } from '@/features/account/pages/edit-department-page';
import { ViewEmploymentTypesPage, AssignEmploymentTypePage } from '@/features/employment-types/pages';
import { CompaniesPage } from '@/features/companies/pages/companies-page';
import { CompanyDetailPage } from '@/features/companies/pages/company-detail-page';
import { HandbookViewerPage } from '@/features/handbook/pages/handbook-viewer-page';
import { authRoutes } from '@/features/auth/routes';
import { useAuth } from '@/context/auth-context';
import { employeesRoutes } from '@/features/employees/routes';
import { handbookRoutes } from '@/features/handbook/routes';
import { contactsRoutes } from '@/features/contacts/routes';
import { accountRoutes } from '@/features/account/routes';
import { companiesRoutes } from '@/features/companies/routes';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-[#373b3b]">Loading…</span>
      </div>
    );
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
    </BrowserRouter>
  );
};
