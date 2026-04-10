import React from 'react';
import { AdminTopNav } from '../components/admin-top-nav';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AdminTopNav />
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
      <footer className="py-6 text-center text-sm text-gray-500 bg-black text-white/60">
        &copy; {new Date().getFullYear()} CompanyFlow. All rights reserved.
      </footer>
    </div>
  );
};
