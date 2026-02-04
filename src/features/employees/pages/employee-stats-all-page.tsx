import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { HelpBanner } from '@/components/common/help-banner';
import { SidebarCard } from '@/components/common/sidebar-card';
import { EmployeeStatsTable } from '../components/employee-stats-table';
import { EmployeeStatsModal } from '../components/employee-stats-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { employeesApi } from '../api';
import { employeesRoutes } from '../routes';

export const EmployeeStatsAllPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [, setSelectedEmployeeId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pageViewStats, setPageViewStats] = useState<any[]>([]);

  // TODO: Replace with real data fetching
  const stats: any[] = [];

  const handleViewStats = async (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    try {
      const stats = await employeesApi.listEmployeePageViewStats(employeeId);
      setPageViewStats(stats);
      setModalOpen(true);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <PageShell
      sidebar={
        <>
          <SidebarCard title="License usage">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Used</span>
                <span>0 / 10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
          </SidebarCard>
          <SidebarCard title="Shortcuts">
            <div className="space-y-1 text-sm">
              <button className="text-left hover:underline">View all employees</button>
              <button className="text-left hover:underline">Export statistics</button>
            </div>
          </SidebarCard>
        </>
      }
    >
      <PageHeader
        title="Employee Statistics – All"
        actions={
          <Button variant="outline" onClick={() => navigate(employeesRoutes.list)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />
      <HelpBanner />
      <div className="flex items-center gap-4 mb-6">
        <Input
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button>
          <Send className="h-4 w-4 mr-2" />
          Send Follow Up
        </Button>
      </div>
      <EmployeeStatsTable
        stats={stats}
        onViewStats={handleViewStats}
        onSendMessage={(id) => {
          // TODO: Implement send message
          console.log('Send message to', id);
        }}
      />
      <EmployeeStatsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        stats={pageViewStats}
        onSendFollowUp={() => {
          // TODO: Implement send follow up
          console.log('Send follow up');
        }}
      />
    </PageShell>
  );
};

