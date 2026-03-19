import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, BookOpen, Phone, Settings, Star, Lock } from 'lucide-react';
import { employeesRoutes } from '@/features/employees/routes';
import { handbookRoutes } from '@/features/handbook/routes';
import { contactsRoutes } from '@/features/contacts/routes';
import { accountRoutes } from '@/features/account/routes';
import { useAuth } from '@/context/auth-context';
import { RolesPermissionsModal } from '@/features/employees/components/roles-permissions-modal';
import { useSubscription } from '@/features/account/hooks';
import { useViewAsEmployee } from '@/context/view-as-employee-context';
import { isAdminRole } from '@/lib/utils';
import { EmployeeDashboardPage } from './employee-dashboard-page';

/** Returns the number of whole days between now and an ISO date string, or null if not available. */
function getDaysRemaining(isoEnd: string | null | undefined): number | null {
  if (!isoEnd) return null;
  const end = new Date(isoEnd);
  if (isNaN(end.getTime())) return null;
  const diff = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

interface ConsoleAction {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'outline';
  adminOnly?: boolean;
}

interface ConsoleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  actions: ConsoleAction[];
}

const ConsoleCard: React.FC<ConsoleCardProps & { canEdit: boolean }> = ({
  title,
  description,
  icon,
  iconBg,
  actions,
  canEdit,
}) => {
  const { t } = useTranslation('console');
  return (
  <Card className="border border-[#e5efea] rounded-[18px] shadow-[0_4px_12px_rgba(15,23,42,0.06)]" style={{ backgroundColor: 'var(--cf-card-bg, #ffffff)' }}>
    <CardHeader className="pb-3">
      <div className="flex items-center gap-3 mb-1">
        <div className={`h-9 w-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <CardTitle className="text-lg font-bold" style={{ color: 'var(--cf-card-heading, #0d0e0e)' }}>{title}</CardTitle>
      </div>
      <CardDescription className="text-sm" style={{ color: 'var(--cf-card-text, #6b7280)' }}>{description}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-2">
      {actions.map((action, index) => {
        const isLocked = action.adminOnly && !canEdit;
        return (
          <div
            key={index}
            title={isLocked ? t('adminOnly') : undefined}
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
};

export const ConsolePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('console');
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);
  const { viewAsEmployee } = useViewAsEmployee();
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const companyId = user?.companyId ? String(user.companyId) : undefined;
  const { data: subscription } = useSubscription(companyId);

  // Non-admin users or admin in "View as Employee" mode → employee dashboard
  if (!isAdmin || viewAsEmployee) {
    return <EmployeeDashboardPage />;
  }

  const daysRemaining = getDaysRemaining(subscription?.subscriptionEnd);
  // Show the trial banner only when we have an end date (and it hasn't fully expired beyond 0)
  const showTrialBanner = subscription !== undefined && subscription.subscriptionEnd !== null;

  return (
    <PageShell>
      {/* Trial Banner — only shown when the subscription has an end date */}
      {showTrialBanner && (
        <div className="mb-8 bg-white border border-[#e5efea] rounded-[18px] shadow-[0_4px_12px_rgba(15,23,42,0.06)] px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1a5948]">
              {daysRemaining !== null && daysRemaining > 0
                ? t('trial.active')
                : t('trial.ended')}
            </p>
            <p className="text-sm text-[#6b7280] mt-0.5">
              {daysRemaining !== null && daysRemaining > 0
                ? t('trial.daysRemaining', { count: daysRemaining })
                : t('trial.upgradePrompt')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => navigate(employeesRoutes.add)}
              className="rounded-[999px] px-5 py-2 h-auto text-sm shadow-[0_8px_16px_rgba(23,102,79,0.3)]"
              style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
            >
              {t('trial.inviteEmployees')}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(accountRoutes.account)}
              className="border-[rgba(15,23,42,0.1)] text-[#0d0e0e] rounded-[999px] px-5 py-2 h-auto text-sm bg-white"
            >
              {t('trial.manageBilling')}
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--cf-page-headline, #0b0c0c)' }}>{t('dashboard.title')}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--cf-page-subhead, #6b7280)' }}>{t('dashboard.subtitle')}</p>
      </div>

      {/* Top row — 2 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <ConsoleCard
          canEdit={isAdmin}
          title={t('card.employees.title')}
          description={t('card.employees.desc')}
          icon={<Users className="h-5 w-5" style={{ color: 'var(--cf-card-icon, #1a5948)' }} />}
          iconBg="bg-[#d4f4e6]"
          actions={[
            { label: t('card.employees.goTo'), onClick: () => navigate(employeesRoutes.list), variant: 'primary' },
            { label: t('card.employees.invite'), onClick: () => navigate(employeesRoutes.add), adminOnly: true },
            { label: t('card.employees.roles'), onClick: () => setRolesModalOpen(true), adminOnly: true },
          ]}
        />
        <ConsoleCard
          canEdit={isAdmin}
          title={t('card.handbook.title')}
          description={t('card.handbook.desc')}
          icon={<BookOpen className="h-5 w-5" style={{ color: 'var(--cf-card-icon, #1a5948)' }} />}
          iconBg="bg-[#d4f4e6]"
          actions={[
            { label: t('card.handbook.open'), onClick: () => navigate(handbookRoutes.manage), variant: 'primary' },
            { label: t('card.handbook.newPage'), onClick: () => navigate(`${handbookRoutes.pages}?open=add`), adminOnly: true },
          ]}
        />
      </div>

      {/* Bottom row — 3 cols */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <ConsoleCard
          canEdit={isAdmin}
          title={t('card.contacts.title')}
          description={t('card.contacts.desc')}
          icon={<Phone className="h-5 w-5 text-[#1e40af]" />}
          iconBg="bg-[#dbeafe]"
          actions={[
            { label: t('card.contacts.manage'), onClick: () => navigate(contactsRoutes.list), variant: 'primary' },
            {
              label: t('card.contacts.add'),
              adminOnly: true,
              onClick: () => navigate(`${contactsRoutes.list}?open=add`),
            },
            {
              label: t('card.contacts.importCsv'),
              adminOnly: true,
              onClick: () => navigate(`${contactsRoutes.list}?open=import`),
            },
          ]}
        />
        <ConsoleCard
          canEdit={isAdmin}
          title={t('card.account.title')}
          description={t('card.account.desc')}
          icon={<Settings className="h-5 w-5 text-[#7c3aed]" />}
          iconBg="bg-[#ede9fe]"
          actions={[
            { label: t('card.account.open'), onClick: () => navigate(accountRoutes.account), variant: 'primary' },
            { label: t('card.account.companyProfile'), onClick: () => navigate(accountRoutes.editCompanyProfile) },
            { label: t('card.account.appearance'), onClick: () => navigate(accountRoutes.appearance) },
          ]}
        />
        <ConsoleCard
          canEdit={isAdmin}
          title={t('card.getStarted.title')}
          description={t('card.getStarted.desc')}
          icon={<Star className="h-5 w-5 text-[#d97706]" />}
          iconBg="bg-[#fef3c7]"
          actions={[
            { label: t('card.getStarted.inviteTeam'), onClick: () => navigate(employeesRoutes.add) },
            { label: t('card.getStarted.publishSection'), onClick: () => navigate(handbookRoutes.pages) },
          ]}
        />
      </div>

      <RolesPermissionsModal
        open={rolesModalOpen}
        onOpenChange={setRolesModalOpen}
      />
    </PageShell>
  );
};
