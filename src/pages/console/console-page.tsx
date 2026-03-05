import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
}) => (
  <Card className="bg-white border border-[#e5efea] rounded-[18px] shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
    <CardHeader className="pb-3">
      <div className="flex items-center gap-3 mb-1">
        <div className={`h-9 w-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <CardTitle className="text-lg font-bold text-[#0d0e0e]">{title}</CardTitle>
      </div>
      <CardDescription className="text-sm text-[#6b7280]">{description}</CardDescription>
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

export const ConsolePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'company_admin';
  const [rolesModalOpen, setRolesModalOpen] = useState(false);

  const companyId = user?.companyId ? String(user.companyId) : undefined;
  const { data: subscription } = useSubscription(companyId);

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
                ? 'Your free trial is active.'
                : 'Your free trial has ended.'}
            </p>
            <p className="text-sm text-[#6b7280] mt-0.5">
              {daysRemaining !== null && daysRemaining > 0
                ? `You have ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining.`
                : 'Upgrade your plan to continue using all features.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => navigate(employeesRoutes.add)}
              className="bg-[#3d997d] hover:bg-[#3d997d]/90 text-white rounded-[999px] px-5 py-2 h-auto text-sm shadow-[0_8px_16px_rgba(23,102,79,0.3)]"
            >
              Invite Employees
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(accountRoutes.account)}
              className="border-[rgba(15,23,42,0.1)] text-[#0d0e0e] rounded-[999px] px-5 py-2 h-auto text-sm bg-white"
            >
              Manage Billing
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0b0c0c]">Dashboard</h1>
        <p className="text-sm text-[#6b7280] mt-1">Manage your company from one place.</p>
      </div>

      {/* Top row — 2 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <ConsoleCard
          canEdit={isAdmin}
          title="Employees"
          description="Add people, set roles, and manage access."
          icon={<Users className="h-5 w-5 text-[#1a5948]" />}
          iconBg="bg-[#d4f4e6]"
          actions={[
            { label: 'Go to Employees →', onClick: () => navigate(employeesRoutes.list), variant: 'primary' },
            { label: 'Invite employees', onClick: () => navigate(employeesRoutes.add), adminOnly: true },
            { label: 'Roles & permissions', onClick: () => setRolesModalOpen(true), adminOnly: true },
          ]}
        />
        <ConsoleCard
          canEdit={isAdmin}
          title="Manage Handbook"
          description="Create and publish your company handbook for employees."
          icon={<BookOpen className="h-5 w-5 text-[#1a5948]" />}
          iconBg="bg-[#d4f4e6]"
          actions={[
            { label: 'Open Handbook →', onClick: () => navigate(handbookRoutes.manage), variant: 'primary' },
            { label: 'New handbook page', onClick: () => navigate(`${handbookRoutes.pages}?open=add`), adminOnly: true },
          ]}
        />
      </div>

      {/* Bottom row — 3 cols */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <ConsoleCard
          canEdit={isAdmin}
          title="Contacts"
          description="Store vendors, clients, and emergency contacts."
          icon={<Phone className="h-5 w-5 text-[#1e40af]" />}
          iconBg="bg-[#dbeafe]"
          actions={[
            { label: 'Manage Contacts →', onClick: () => navigate(contactsRoutes.list), variant: 'primary' },
            {
              label: 'Add contact',
              adminOnly: true,
              onClick: () => navigate(`${contactsRoutes.list}?open=add`),
            },
            {
              label: 'Import CSV',
              adminOnly: true,
              onClick: () => navigate(`${contactsRoutes.list}?open=import`),
            },
          ]}
        />
        <ConsoleCard
          canEdit={isAdmin}
          title="Account"
          description="Profile, security, and billing preferences."
          icon={<Settings className="h-5 w-5 text-[#7c3aed]" />}
          iconBg="bg-[#ede9fe]"
          actions={[
            { label: 'Open Account →', onClick: () => navigate(accountRoutes.account), variant: 'primary' },
            { label: 'Company profile', onClick: () => navigate(accountRoutes.editCompanyProfile) },
            { label: 'Appearance', onClick: () => navigate(accountRoutes.appearance) },
          ]}
        />
        <ConsoleCard
          canEdit={isAdmin}
          title="Get Started"
          description="Recommended next steps to make the most of your trial."
          icon={<Star className="h-5 w-5 text-[#d97706]" />}
          iconBg="bg-[#fef3c7]"
          actions={[
            { label: 'Invite your team', onClick: () => navigate(employeesRoutes.add) },
            { label: 'Publish a handbook section', onClick: () => navigate(handbookRoutes.pages) },
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
