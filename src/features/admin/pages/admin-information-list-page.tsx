import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminCompanies } from '../hooks';
import { adminRoutes } from '../routes';
import { Input } from '@/components/ui/input';
import { Search, ArrowRight } from 'lucide-react';

export const AdminInformationListPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useAdminCompanies({
    search: search.trim() || undefined,
    sort: 'title',
    page: 1,
    limit: 50,
  });

  const companies = data?.data ?? [];

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="text-sm text-gray-500">
        <Link to={adminRoutes.dashboard} className="hover:underline">
          {t('nav.console', 'Console')}
        </Link>
        <span className="mx-1">›</span>
        <span className="text-gray-700">{t('informationList.title', 'Info List')}</span>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e]">
          {t('informationList.title', 'Info List')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t(
            'informationList.pickCompany',
            'Select a company to view its info list (links and employees).',
          )}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('companies.searchPlaceholder', 'Search companies...')}
          className="pl-9"
        />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="px-5 sm:px-6 py-6 text-sm text-gray-500">
            {t('common.loading', 'Loading…')}
          </div>
        ) : companies.length === 0 ? (
          <div className="px-5 sm:px-6 py-6 text-sm text-gray-500">
            {t('companies.empty', 'No companies found.')}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {companies.map((c) => (
              <li key={c.nid}>
                <Link
                  to={adminRoutes.companyInformationList.replace(':id', String(c.nid))}
                  className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#0d0e0e] truncate">{c.title}</div>
                    {c.customerNumber ? (
                      <div className="text-xs text-gray-500">
                        {t('informationList.customerNumber', 'Customer #')}
                        {c.customerNumber}
                      </div>
                    ) : null}
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
