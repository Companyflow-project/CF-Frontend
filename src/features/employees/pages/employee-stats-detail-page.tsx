import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { HelpBanner } from '@/components/common/help-banner';
import { EmployeeStatsTable } from '../components/employee-stats-table';
import { EmployeeStatsModal } from '../components/employee-stats-modal';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send } from 'lucide-react';
import { employeesApi } from '../api';
import { employeesRoutes } from '../routes';

export const EmployeeStatsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [pageViewStats, setPageViewStats] = useState<any[]>([]);
  const [employeeName] = useState('Employee');

  // TODO: Fetch employee data
  const stats: any[] = [];

  const handleViewStats = async () => {
    if (!id) return;
    try {
      const stats = await employeesApi.listEmployeePageViewStats(id);
      setPageViewStats(stats);
      setModalOpen(true);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title={`Employee Statistics – ${employeeName}`}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(employeesRoutes.statistics)}>
              View All Employees
            </Button>
            <Button onClick={handleViewStats}>
              <Send className="h-4 w-4 mr-2" />
              Send Follow Up
            </Button>
          </>
        }
      />
      <HelpBanner />
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate(employeesRoutes.list)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Employees
        </Button>
      </div>
      <EmployeeStatsTable
        stats={stats}
        onViewStats={handleViewStats}
        onSendMessage={(employeeId) => {
          // TODO: Implement send message
          console.log('Send message to', employeeId);
        }}
      />
      <EmployeeStatsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        stats={pageViewStats}
        employeeName={employeeName}
        onSendFollowUp={() => {
          // TODO: Implement send follow up
          console.log('Send follow up');
        }}
      />
    </PageShell>
  );
};

