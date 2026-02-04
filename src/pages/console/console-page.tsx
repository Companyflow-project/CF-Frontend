import React from 'react';
import { useNavigate } from 'react-router-dom';
import { employeesRoutes } from '@/features/employees/routes';
import { handbookRoutes } from '@/features/handbook/routes';
import { contactsRoutes } from '@/features/contacts/routes';
import { accountRoutes } from '@/features/account/routes';

export const ConsolePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white border border-[#e5efea] rounded-[22px] shadow-[0_12px_30px_rgba(14,51,38,0.08)] px-5 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#1a5948]">Your free trial is active.</p>
            <p className="text-sm text-[#4b5652]">You have 21 days remaining.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="bg-[#2f946f] hover:bg-[#2f946f]/90 text-white rounded-[999px] px-5 py-2 text-sm shadow-[0_10px_20px_rgba(13,94,67,0.3)]"
              onClick={() => navigate(employeesRoutes.add)}
            >
              Invite Employees
            </button>
            <button
              className="border border-[#d0e3da] text-[#0d0e0e] rounded-[999px] px-5 py-2 text-sm bg-white"
              onClick={() => navigate(accountRoutes.account)}
            >
              Manage Billing
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ConsoleCard
              title="Employees"
              description="Add people, set roles, and manage access."
              primaryAction={{
                label: 'Go to Employees →',
                onClick: () => navigate(employeesRoutes.list),
              }}
              links={[
                { label: 'Invite employees', onClick: () => navigate(employeesRoutes.add) },
                { label: 'Roles & permissions' },
              ]}
            />
            <ConsoleCard
              title="Manage Handbook"
              description="Create and publish your company handbook for employees."
              primaryAction={{
                label: 'Open Handbook →',
                onClick: () => navigate(handbookRoutes.list),
              }}
              links={[
                { label: 'New handbook section' },
                { label: 'Handbook settings' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <ConsoleCard
              title="Contacts"
              description="Store vendors, clients, and emergency contacts."
              primaryAction={{
                label: 'Manage Contacts →',
                onClick: () => navigate(contactsRoutes.list),
              }}
              links={[
                { label: 'Add contact', trailing: '+' },
                { label: 'Import CSV', trailing: '⇢' },
              ]}
            />
            <ConsoleCard
              title="Account"
              description="Profile, security, and billing preferences."
              primaryAction={{
                label: 'Open Account →',
                onClick: () => navigate(accountRoutes.account),
              }}
              links={[
                { label: 'Profile' },
                { label: 'Billing' },
                { label: 'Security' },
              ]}
            />
            <ConsoleCard
              title="Get Started"
              description="Recommended next steps to make the most of your trial."
              hidePrimaryAction
              links={[
                { label: 'Invite your team', trailing: '1' },
                { label: 'Publish a handbook section', trailing: '2' },
                { label: 'Customize theme', trailing: '3' },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface ConsoleCardProps {
  title: string;
  description: string;
  primaryAction?: { label: string; onClick?: () => void };
  links: { label: string; trailing?: string; onClick?: () => void }[];
  hidePrimaryAction?: boolean;
}

const ConsoleCard: React.FC<ConsoleCardProps> = ({
  title,
  description,
  primaryAction,
  links,
  hidePrimaryAction,
}) => {
  return (
    <div className="bg-white border border-[#e5efea] rounded-[22px] shadow-[0_18px_45px_rgba(14,51,38,0.08)] p-5 flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-bold text-[#0d0e0e]">{title}</h3>
        <p className="text-sm text-[#4b5652]">{description}</p>
      </div>
      {!hidePrimaryAction && primaryAction && (
        <button
          className="inline-flex items-center justify-center bg-[#e1f3ec] border border-[#2f946f] text-[#1a5948] rounded-[999px] px-5 py-3 text-sm font-semibold w-full sm:w-auto"
          onClick={primaryAction.onClick}
        >
          {primaryAction.label}
        </button>
      )}
      <div className="flex flex-col gap-2">
        {links.map((link) => (
          <button
            key={link.label}
            onClick={link.onClick}
            className="flex items-center justify-between px-4 py-3 rounded-[12px] border border-[#cce3da] bg-white text-sm text-[#0d0e0e]"
          >
            <span>{link.label}</span>
            <span className="text-base text-[#0d0e0e]">{link.trailing ?? '⇢'}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
