import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { List, Printer } from 'lucide-react';
import { adminRoutes } from '../routes';
import { HandbookHelpSection } from '../components/handbook/help-section';

export const AdminHandbookPage: React.FC = () => {
  const { t } = useTranslation('admin');

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <div className="text-sm text-gray-500">
          <Link to={adminRoutes.dashboard} className="hover:underline">
            {t('nav.console', 'Console')}
          </Link>
          {' › '}
          <span className="text-gray-700">{t('handbook.title', 'Management Handbook')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">
          {t('handbook.title', 'Management Handbook')}
        </h1>
      </div>

      <HandbookHelpSection />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto w-full">
        <Link
          to={adminRoutes.handbookTableOfContents}
          className="border border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-[#0d0e0e] hover:shadow-sm transition-all"
        >
          <List className="h-8 w-8 text-[#0d0e0e] mb-4" />
          <h3 className="font-semibold text-[#0d0e0e]">
            {t('handbook.tocTitle', 'Table of contents')}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('handbook.tocDesc', 'Searchable overview')}
          </p>
        </Link>

        <Link
          to={adminRoutes.handbookPrint}
          className="border border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-[#0d0e0e] hover:shadow-sm transition-all"
        >
          <Printer className="h-8 w-8 text-[#0d0e0e] mb-4" />
          <h3 className="font-semibold text-[#0d0e0e]">
            {t('handbook.print', 'Printer-Friendly version')}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('handbook.printDesc', 'The entire handbook')}
          </p>
        </Link>
      </div>
    </div>
  );
};
