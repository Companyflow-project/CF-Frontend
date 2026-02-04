import React from 'react';
import { TopNav } from '@/components/layout/top-nav';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 bg-gray-50">{children}</main>
      <footer className="bg-white border-t py-4 text-center text-sm text-gray-600">
        © 2025 CompanyFlow. All rights reserved.
      </footer>
    </div>
  );
};

