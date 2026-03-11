import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { ArrowRight } from 'lucide-react';
import { handbookRoutes } from '@/features/handbook/routes';
import { handbookApi } from '@/features/handbook/api';
import { employeesRoutes } from '@/features/employees/routes';
import { contactsRoutes } from '@/features/contacts/routes';

interface EmployeeCardAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'outline';
}

interface EmployeeCardProps {
  title: string;
  description: string;
  actions: EmployeeCardAction[];
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ title, description, actions }) => (
  <div className="bg-white border border-[#e5e7eb] rounded-[18px] shadow-sm p-6">
    <h3 className="text-lg font-bold text-[#0d0e0e] mb-1">{title}</h3>
    <p className="text-sm text-[#6b7280] mb-5">{description}</p>
    <div className="space-y-2">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-[10px] text-sm font-medium transition-all ${
            action.variant === 'primary'
              ? 'bg-[#d4f4e6] text-[#1a5948] hover:bg-[#c0edd9]'
              : 'bg-white border border-[#e5efea] text-[#0d0e0e] hover:bg-[#f6fbf9]'
          }`}
        >
          <span>{action.label}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      ))}
    </div>
  </div>
);

export const EmployeeDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('console');
  const [handbookBid, setHandbookBid] = useState<number | null>(null);

  useEffect(() => {
    handbookApi.getHandbookTree(i18n.language).then(({ bid }) => setHandbookBid(bid)).catch(() => {});
  }, [i18n.language]);

  return (
    <PageShell>
      {/* Top row — 2 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <EmployeeCard
          title={t('employeeDashboard.handbook.title')}
          description={t('employeeDashboard.handbook.desc')}
          actions={[
            { label: t('employeeDashboard.handbook.view'), onClick: () => handbookBid ? navigate(`/handbooks/${handbookBid}/viewer`) : navigate(handbookRoutes.tableOfContents), variant: 'primary' },
            { label: t('employeeDashboard.handbook.toc'), onClick: () => navigate(handbookRoutes.tableOfContents) },
          ]}
        />
        <EmployeeCard
          title={t('employeeDashboard.infoList.title')}
          description={t('employeeDashboard.infoList.desc')}
          actions={[
            { label: t('employeeDashboard.infoList.viewContacts'), onClick: () => navigate(contactsRoutes.informationList), variant: 'primary' },
            { label: t('employeeDashboard.infoList.viewEmployees'), onClick: () => navigate(employeesRoutes.informationList) },
          ]}
        />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <EmployeeCard
          title={t('employeeDashboard.handbookInfo.title')}
          description={t('employeeDashboard.handbookInfo.desc')}
          actions={[
            { label: t('employeeDashboard.handbookInfo.viewLinks'), onClick: () => navigate(handbookRoutes.links) },
            { label: t('employeeDashboard.handbookInfo.viewDocuments'), onClick: () => navigate(handbookRoutes.documents) },
          ]}
        />
      </div>
    </PageShell>
  );
};
