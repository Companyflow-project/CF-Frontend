import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopNav } from '@/components/layout/top-nav';
import { ImpersonationBanner } from '@/components/layout/impersonation-banner';
import { useViewAsEmployee } from '@/context/view-as-employee-context';
import { useAuth } from '@/context/auth-context';
import { useCompanyProfile } from '@/features/companies/hooks';
import { isAdminRole } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

const ViewAsEmployeeBanner: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { viewAsEmployee, exitEmployeeView } = useViewAsEmployee();
  const { t } = useTranslation('common');
  const isAdmin = isAdminRole(user?.role);

  if (!isAdmin || !viewAsEmployee) return null;

  return (
    <div className="bg-[#f0faf6] border-b border-[#cde9dc] px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-[1360px] mx-auto flex items-center justify-between">
        <span className="text-sm font-medium text-[#1a5948]">
          {t('banner.viewAsEmployee')}
        </span>
        <button
          onClick={() => { exitEmployeeView(); navigate('/employees'); }}
          className="bg-[#1a5948] hover:bg-[#15473a] text-white text-sm font-medium px-5 py-2 rounded-[10px] transition-colors"
        >
          {t('banner.exitViewAsEmployee')}
        </button>
      </div>
    </div>
  );
};

const AppLayoutInner: React.FC<AppLayoutProps> = ({ children }) => {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const companyId = user?.companyId ? Number(user.companyId) : undefined;
  const { data: companyProfile } = useCompanyProfile(companyId);
  const companyName = companyProfile?.businessName || 'CompanyFlow';

  // Build full logo URL from company profile
  const companyLogoUrl = (() => {
    if (!companyProfile?.logoUrl) return null;
    if (companyProfile.logoUrl.startsWith('http')) return companyProfile.logoUrl;
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');
    return `${baseUrl}${companyProfile.logoUrl}`;
  })();

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav companyLogoUrl={companyLogoUrl} companyName={companyName} />
      <ImpersonationBanner />
      <ViewAsEmployeeBanner />
      <main className="flex-1 bg-gray-50">{children}</main>
      <footer className="border-t py-4 text-center text-sm" style={{ backgroundColor: 'var(--cf-nav-bg, #000000)', color: 'var(--cf-nav-text, #ffffff)' }}>
        {t('footer.copyright', { companyName })}
      </footer>
    </div>
  );
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return <AppLayoutInner>{children}</AppLayoutInner>;
};
