import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { HelpBanner } from '@/components/common/help-banner';
import { EmployeeMessageLogsTable } from '../components/employee-message-logs-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { employeesRoutes } from '../routes';

export const EmployeeMessageLogsDetailPage: React.FC = () => {
  const { id: _id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [employeeName] = useState('Employee');

  // TODO: Fetch employee message logs
  const logs: any[] = [];

  return (
    <PageShell>
      <PageHeader
        title={`Employee Message Logs – ${employeeName}`}
        actions={
          <Button variant="outline" onClick={() => navigate(employeesRoutes.messageLogs)}>
            View All Message Logs
          </Button>
        }
      />
      <HelpBanner />
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate(employeesRoutes.list)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Employees
        </Button>
      </div>
      <div className="flex items-center gap-4 mb-6">
        <Input
          placeholder="Search message logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button>
          <Send className="h-4 w-4 mr-2" />
          Send Follow Up
        </Button>
      </div>
      <EmployeeMessageLogsTable logs={logs} />
      <div className="mt-4 flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" disabled>
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page 1 of 1</span>
        <Button variant="outline" size="sm" disabled>
          Next
        </Button>
      </div>
    </PageShell>
  );
};

