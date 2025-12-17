import React from 'react';

interface PageShellProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({ children, sidebar }) => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="flex-1 min-w-0">{children}</div>
          {sidebar && (
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="sticky top-6">{sidebar}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

