import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  ShieldCheck,
} from 'lucide-react';
import { accountRoutes } from '../routes';
import { AddEmploymentTypeDialog } from '@/features/employment-types/pages';
import { useAuth } from '@/context/auth-context';
import { isAdminRole } from '@/lib/utils';

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
  adminOnlyLabel: string;
}

const AccountCard: React.FC<AccountCardProps> = ({ title, description, icon, iconBg, actions, canEdit, adminOnlyLabel }) => (
  <Card className="border border-[#e5efea] rounded-[18px] shadow-[0_4px_12px_rgba(15,23,42,0.06)]" style={{ backgroundColor: 'var(--cf-card-bg, #ffffff)' }}>
    <CardHeader className="pb-3">
      <div className="flex items-center gap-3 mb-1">
        <div className={`h-9 w-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <CardTitle className="text-lg font-bold" style={{ color: 'var(--cf-card-heading, #0d0e0e)' }}>{title}</CardTitle>
      </div>
      <CardDescription className="text-sm mt-0.5" style={{ color: 'var(--cf-card-text, #6b7280)' }}>{description}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-2">
      {actions.map((action, index) => {
        const isLocked = action.adminOnly && !canEdit;
        return (
          <div
            key={index}
            title={isLocked ? adminOnlyLabel : undefined}
            className={isLocked ? 'cursor-not-allowed' : undefined}
          >
            <button
              onClick={isLocked ? undefined : action.onClick}
              disabled={isLocked}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-[10px] text-sm font-medium transition-all ${isLocked
                ? 'bg-white border border-[#e5efea] text-[#9ca3af] opacity-60 cursor-not-allowed'
                : action.variant === 'primary'
                  ? ''
                  : 'bg-white border border-[#e5efea] hover:bg-[#f6fbf9]'
                }`}
              style={
                !isLocked && action.variant === 'primary'
                  ? { backgroundColor: 'var(--cf-card-btn, #d4f4e6)', color: 'var(--cf-card-btn-text, #1a5948)' }
                  : !isLocked && action.variant !== 'primary'
                    ? { color: 'var(--cf-card-heading, #0d0e0e)' }
                    : undefined
              }
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
  const { t } = useTranslation('account');
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);
  const [isAddEmploymentTypeDialogOpen, setIsAddEmploymentTypeDialogOpen] = useState(false);

  const cards: Omit<AccountCardProps, 'canEdit' | 'adminOnlyLabel'>[] = [
    {
      title: t('card.companyProfile.title'),
      description: t('card.companyProfile.desc'),
      icon: <Building2 className="h-5 w-5 text-[#1a5948]" />,
      iconBg: 'bg-[#d4f4e6]',
      actions: [
        {
          label: t('card.companyProfile.edit'),
          onClick: () => navigate(accountRoutes.editCompanyProfile),
          variant: 'primary',
          adminOnly: true,
        },
        // "Update SMS sender name" opened this same page — the sender name is a
        // field inside Edit Company Profile, so it was a second door to one room.
      ],
    },
    {
      title: t('card.subscriptions.title'),
      description: t('card.subscriptions.desc'),
      icon: <CreditCard className="h-5 w-5 text-[#1e40af]" />,
      iconBg: 'bg-[#dbeafe]',
      actions: [
        {
          label: t('card.subscriptions.upgrade'),
          onClick: () =>
            window.open('https://companyflow.digibida.com/contact-us/', '_blank', 'noopener,noreferrer'),
          variant: 'primary',
          adminOnly: true,
        },
        {
          label: t('card.subscriptions.view'),
          onClick: () => navigate(accountRoutes.subscription),
        },
        {
          label: t('card.subscriptions.moreLicenses'),
          onClick: () =>
            window.open('https://companyflow.digibida.com/contact-us/', '_blank', 'noopener,noreferrer'),
          adminOnly: true,
        },
      ],
    },
    {
      title: t('card.department.title'),
      description: t('card.department.desc'),
      icon: <LayoutList className="h-5 w-5 text-[#7c3aed]" />,
      iconBg: 'bg-[#ede9fe]',
      actions: [
        {
          label: t('card.department.add'),
          onClick: () => navigate(accountRoutes.addDepartment),
          variant: 'primary',
          adminOnly: true,
        },
        {
          label: t('card.department.view'),
          onClick: () => navigate(accountRoutes.departments),
        },
      ],
    },
    {
      title: t('card.employmentTypes.title'),
      description: t('card.employmentTypes.desc'),
      icon: <Briefcase className="h-5 w-5 text-[#d97706]" />,
      iconBg: 'bg-[#fef3c7]',
      actions: [
        {
          label: t('card.employmentTypes.add'),
          onClick: () => setIsAddEmploymentTypeDialogOpen(true),
          variant: 'primary',
          adminOnly: true,
        },
        {
          label: t('card.employmentTypes.view'),
          onClick: () => navigate(accountRoutes.employmentTypes),
        },
      ],
    },
    {
      title: t('card.appearance.title'),
      description: t('card.appearance.desc'),
      icon: <Palette className="h-5 w-5 text-[#db2777]" />,
      iconBg: 'bg-[#fce7f3]',
      actions: [
        {
          label: t('card.appearance.edit'),
          onClick: () => navigate(accountRoutes.appearance),
          variant: 'primary',
          adminOnly: true,
        },
      ],
    },
    {
      title: t('retention.menuTitle'),
      description: t('retention.menuDesc'),
      icon: <ShieldCheck className="h-5 w-5 text-[#1a5948]" />,
      iconBg: 'bg-[#dcfce7]',
      actions: [
        {
          label: t('retention.title'),
          onClick: () => navigate(accountRoutes.dataRetention),
          variant: 'primary',
          adminOnly: true,
        },
      ],
    },
    {
      title: t('card.others.title'),
      description: t('card.others.desc'),
      icon: <MoreHorizontal className="h-5 w-5 text-[#6b7280]" />,
      iconBg: 'bg-[#f3f4f6]',
      actions: [
        { label: t('card.others.whistleblower'), onClick: () => navigate('/account/whistleblower'), adminOnly: true },
      ],
    },
  ];

  return (
    <PageShell>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--cf-page-headline, #0b0c0c)' }}>{t('page.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--cf-page-subhead, #6b7280)' }}>{t('page.subtitle')}</p>
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
            adminOnlyLabel={t('adminOnly')}
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
