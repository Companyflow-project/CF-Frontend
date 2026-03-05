import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight,
  Lock,
  Building2,
  CreditCard,
  LayoutList,
  Briefcase,
  Palette,
  MoreHorizontal,
} from 'lucide-react';
import { accountRoutes } from '../routes';
import { AddEmploymentTypeDialog } from '@/features/employment-types/pages';
import { useAuth } from '@/context/auth-context';

interface AccountAction {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'outline';
  adminOnly?: boolean;
}

interface AccountCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  actions: AccountAction[];
  canEdit: boolean;
}

const AccountCard: React.FC<AccountCardProps> = ({ title, description, icon, iconBg, actions, canEdit }) => (
  <Card className="bg-white border border-[#e5efea] rounded-[18px] shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
    <CardHeader className="pb-3">
      <div className="flex items-center gap-3 mb-1">
        <div className={`h-9 w-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <CardTitle className="text-lg font-bold text-[#0d0e0e]">{title}</CardTitle>
      </div>
      <CardDescription className="text-sm text-[#6b7280] mt-0.5">{description}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-2">
      {actions.map((action, index) => {
        const isLocked = action.adminOnly && !canEdit;
        return (
          <div
            key={index}
            title={isLocked ? 'Only admins can perform this action' : undefined}
            className={isLocked ? 'cursor-not-allowed' : undefined}
          >
            <button
              onClick={isLocked ? undefined : action.onClick}
              disabled={isLocked}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-[10px] text-sm font-medium transition-all ${isLocked
                ? 'bg-white border border-[#e5efea] text-[#9ca3af] opacity-60 cursor-not-allowed'
                : action.variant === 'primary'
                  ? 'bg-[#d4f4e6] text-[#1a5948] hover:bg-[#c0edd9]'
                  : 'bg-white border border-[#e5efea] text-[#0d0e0e] hover:bg-[#f6fbf9]'
                }`}
            >
              <span>{action.label}</span>
              {isLocked ? (
                <Lock className="h-3.5 w-3.5 text-[#9ca3af]" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </button>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'company_admin';
  const [isAddEmploymentTypeDialogOpen, setIsAddEmploymentTypeDialogOpen] = useState(false);

  const cards: Omit<AccountCardProps, 'canEdit'>[] = [
    {
      title: 'Company Profile',
      description: 'Update your company information and SMS sender name.',
      icon: <Building2 className="h-5 w-5 text-[#1a5948]" />,
      iconBg: 'bg-[#d4f4e6]',
      actions: [
        {
          label: 'Edit Company Profile →',
          onClick: () => navigate(accountRoutes.editCompanyProfile),
          variant: 'primary',
          adminOnly: true,
        },
        {
          label: 'Update SMS sender name',
          onClick: () => navigate(accountRoutes.editCompanyProfile),
          adminOnly: true,
        },
      ],
    },
    {
      title: 'Subscriptions',
      description: 'Manage licenses and billing for your plan.',
      icon: <CreditCard className="h-5 w-5 text-[#1e40af]" />,
      iconBg: 'bg-[#dbeafe]',
      actions: [
        {
          label: 'Update Subscription →',
          onClick: () =>
            window.open('https://companyflow.digibida.com/contact-us/', '_blank', 'noopener,noreferrer'),
          variant: 'primary',
          adminOnly: true,
        },
        {
          label: 'View subscription',
          onClick: () => navigate(accountRoutes.subscription),
        },
        {
          label: 'Add more licenses',
          onClick: () =>
            window.open('https://companyflow.digibida.com/contact-us/', '_blank', 'noopener,noreferrer'),
          adminOnly: true,
        },
      ],
    },
    {
      title: 'Department',
      description: 'Add and manage departments within your company.',
      icon: <LayoutList className="h-5 w-5 text-[#7c3aed]" />,
      iconBg: 'bg-[#ede9fe]',
      actions: [
        {
          label: 'Add Department →',
          onClick: () => navigate(accountRoutes.addDepartment),
          variant: 'primary',
          adminOnly: true,
        },
        {
          label: 'View departments',
          onClick: () => navigate(accountRoutes.departments),
        },
      ],
    },
    {
      title: 'Employment Types',
      description: 'Define and manage employment categories.',
      icon: <Briefcase className="h-5 w-5 text-[#d97706]" />,
      iconBg: 'bg-[#fef3c7]',
      actions: [
        {
          label: 'Add Employment Type →',
          onClick: () => setIsAddEmploymentTypeDialogOpen(true),
          variant: 'primary',
          adminOnly: true,
        },
        {
          label: 'View employment types',
          onClick: () => navigate(accountRoutes.employmentTypes),
        },
      ],
    },
    {
      title: 'Appearance',
      description: 'Update the look and feel of your handbook.',
      icon: <Palette className="h-5 w-5 text-[#db2777]" />,
      iconBg: 'bg-[#fce7f3]',
      actions: [
        {
          label: 'Edit Appearance →',
          onClick: () => navigate(accountRoutes.appearance),
          variant: 'primary',
          adminOnly: true,
        },
      ],
    },
    {
      title: 'Others',
      description: 'Additional settings and compliance tools.',
      icon: <MoreHorizontal className="h-5 w-5 text-[#6b7280]" />,
      iconBg: 'bg-[#f3f4f6]',
      actions: [
        { label: 'Setup whistleblower system', onClick: () => window.open('https://companyflow.digibida.com/whistleblowerordning/', '_blank', 'noopener,noreferrer') },
      ],
    },
  ];

  return (
    <PageShell>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0b0c0c]">Account</h1>
          <p className="text-sm text-[#6b7280] mt-1">Manage your company profile, billing, and settings.</p>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <AccountCard
            key={index}
            title={card.title}
            description={card.description}
            icon={card.icon}
            iconBg={card.iconBg}
            actions={card.actions}
            canEdit={isAdmin}
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
