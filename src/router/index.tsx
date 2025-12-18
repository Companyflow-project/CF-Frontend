import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks';
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
import { authRoutes } from '@/features/auth/routes';
import { employeesRoutes } from '@/features/employees/routes';
import { handbookRoutes } from '@/features/handbook/routes';
import { contactsRoutes } from '@/features/contacts/routes';
import { accountRoutes } from '@/features/account/routes';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={authRoutes.login} replace />;
  }

  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route
          path={authRoutes.login}
          element={
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          }
        />
        <Route
          path={authRoutes.signup}
          element={
            <AuthLayout>
              <SignupPage />
            </AuthLayout>
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
      </Routes>
    </BrowserRouter>
  );
};
