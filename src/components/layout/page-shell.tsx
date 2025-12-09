import React from 'react';

interface PageShellProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({ children, sidebar }) => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          <div className="flex-1">{children}</div>
          {sidebar && <div className="w-80">{sidebar}</div>}
        </div>
      </div>
    </div>
  );
};

