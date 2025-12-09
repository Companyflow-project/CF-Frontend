import React from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { HelpBanner } from '@/components/common/help-banner';
import { AddEmployeeForm } from '../components/add-employee-form';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export const AddEmployeePage: React.FC = () => {
  return (
    <PageShell>
      <div className="flex justify-between items-start mb-6">
        <PageHeader title="Add employee" />
        <Button className="sticky top-4">
          <Save className="h-4 w-4 mr-2" />
          Save information
        </Button>
      </div>
      <HelpBanner />
      <AddEmployeeForm />
    </PageShell>
  );
};

