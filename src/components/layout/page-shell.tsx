import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Menu } from 'lucide-react';

interface PageShellProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  fullWidth?: boolean;
}

export const PageShell: React.FC<PageShellProps> = ({ children, sidebar, fullWidth }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="bg-gray-50 h-screen flex flex-col overflow-hidden">
      <div
        className={
          fullWidth
            ? 'w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 overflow-auto'
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 overflow-auto w-full'
        }
      >
        {sidebar && (
          <div className="mb-4 flex justify-end lg:hidden">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
              <span className="text-sm">Open sidebar</span>
            </Button>
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 h-full">
          <div className="flex-1 min-w-0 flex flex-col">{children}</div>
          {sidebar && (
            <div className="w-full lg:w-80 flex-shrink-0 hidden lg:block">
              <div className="sticky top-6">{sidebar}</div>
            </div>
          )}
        </div>
      </div>
      {sidebar && (
        <Dialog open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <DialogContent className="w-full max-w-md mx-0 sm:mx-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Sidebar</DialogTitle>
            </DialogHeader>
            <div className="mt-4">{sidebar}</div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};


