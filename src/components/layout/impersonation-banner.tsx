import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react';
import { getImpersonation, exitImpersonation } from '@/features/admin/impersonation';

/**
 * Shown across the user console while a platform admin is "viewing as" a company.
 * Reads the impersonation stash from localStorage; renders nothing otherwise.
 */
export const ImpersonationBanner: React.FC = () => {
  const { t } = useTranslation('common');
  const stash = getImpersonation();
  if (!stash) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium text-amber-900">
          <Eye className="h-4 w-4 shrink-0" />
          {t('banner.viewAs', 'Viewing as {{name}}', { name: stash.companyName })}
        </span>
        <button
          onClick={exitImpersonation}
          className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-5 py-2 rounded-[10px] transition-colors shrink-0"
        >
          {t('banner.exitViewAsCompany', 'Exit')}
        </button>
      </div>
    </div>
  );
};
