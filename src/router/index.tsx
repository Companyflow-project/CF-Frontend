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
import { HandbookPage } from '@/features/handbook/pages/handbook-page';
import { EditThemePage } from '@/features/handbook/pages/edit-theme-page';
import { ContactsPage } from '@/features/contacts/pages/contacts-page';
import { AccountPage } from '@/features/account/pages/account-page';
import { EditCompanyProfilePage } from '@/features/account/pages/edit-company-profile-page';
import { AddDepartmentPage } from '@/features/account/pages/add-department-page';
import { ViewDepartmentsPage } from '@/features/account/pages/view-departments-page';
import { EditDepartmentPage } from '@/features/account/pages/edit-department-page';
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
          path={handbookRoutes.list}
          element={
            <RequireAuth>
              <AppLayout>
                <HandbookPage />
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
