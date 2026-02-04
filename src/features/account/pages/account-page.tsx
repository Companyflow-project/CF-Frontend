import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { accountRoutes } from '../routes';
import { AddEmploymentTypeDialog } from '@/features/employment-types/pages';

interface ActionItem {
  type: 'button-green' | 'button-blue' | 'list-item';
  label: string;
  onClick?: () => void;
}

interface AccountCardProps {
  title: string;
  description: string;
  actions: ActionItem[];
}

const AccountCard: React.FC<AccountCardProps> = ({ title, description, actions }) => {
  return (
    <Card className="bg-white border text-card-foreground shadow-sm rounded-xl p-6 flex flex-col gap-4 h-full">
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-lg leading-none tracking-tight text-[#0d0e0e]">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="flex flex-col gap-3 mt-auto pt-2">
        {actions.map((action, index) => {
          if (action.type === 'button-green') {
            return (
              <Button
                key={index}
                className="w-fit bg-[#e2f0e9] hover:bg-[#d4e8dd] text-[#1a5948] font-medium text-sm px-4 py-2 h-auto rounded-md shadow-sm justify-between gap-2"
                onClick={action.onClick}
              >
                {action.label}
                <ArrowRight className="h-4 w-4" />
              </Button>
            );
          }
          if (action.type === 'button-blue') {
            return (
              <Button
                key={index}
                className="w-fit bg-[#e0eff5] hover:bg-[#d0e5ee] text-[#2b5c70] font-medium text-sm px-4 py-2 h-auto rounded-md shadow-sm justify-between gap-2"
                onClick={action.onClick}
              >
                {action.label}
                <ArrowRight className="h-4 w-4" />
              </Button>
            );
          }
          // list-item
          return (
            <div
              key={index}
              className="group flex items-center justify-between p-3 bg-[#f9fafb] border border-gray-100 rounded-lg hover:bg-gray-50 hover:border-gray-200 transition-colors cursor-pointer"
              onClick={action.onClick}
            >
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAddEmploymentTypeDialogOpen, setIsAddEmploymentTypeDialogOpen] = useState(false);

  const cards: AccountCardProps[] = [
    {
      title: 'Company Profile',
      description: 'Update your company information here.',
      actions: [
        { type: 'button-green', label: 'Edit Company Profile', onClick: () => navigate(accountRoutes.editCompanyProfile) },
        { type: 'list-item', label: 'Update SMS sender name', onClick: () => navigate(accountRoutes.editCompanyProfile) },
      ],
    },
    {
      title: 'Subcriptions',
      description: 'Update your subscription here.',
      actions: [
        { type: 'button-green', label: 'Update Subscription' },
        { type: 'list-item', label: 'View subscription' },
        { type: 'list-item', label: 'Add more licenses' },
      ],
    },
    {
      title: 'Department',
      description: 'Add and manage departments here.',
      actions: [
        { type: 'button-blue', label: 'Add Department', onClick: () => navigate(accountRoutes.addDepartment) },
        { type: 'list-item', label: 'View departments', onClick: () => navigate(accountRoutes.departments) },
      ],
    },
    {
      title: 'Employment Types',
      description: 'Add and manage employment types here.',
      actions: [
        { type: 'button-blue', label: 'Add Employment Type', onClick: () => setIsAddEmploymentTypeDialogOpen(true) },
        { type: 'list-item', label: 'View employment types', onClick: () => navigate(accountRoutes.employmentTypes) },
      ],
    },
    {
      title: 'Appearance',
      description: 'Update the look and feel of your handbook.',
      actions: [
        { type: 'button-green', label: 'Edit Appearance', onClick: () => navigate(accountRoutes.appearance) },
      ],
    },
    {
      title: 'Others',
      description: 'Recommended next steps to make the most of your trial.',
      actions: [
        { type: 'list-item', label: 'Setup whistleblower system' },
      ],
    },
  ];

  return (
    <PageShell>
      <PageHeader title="Account" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <AccountCard
            key={index}
            title={card.title}
            description={card.description}
            actions={card.actions}
          />
        ))}
      </div>

      {/* Add Employment Type Dialog */}
      <AddEmploymentTypeDialog
        open={isAddEmploymentTypeDialogOpen}
        onOpenChange={setIsAddEmploymentTypeDialogOpen}
      />
    </PageShell>
  );
};
