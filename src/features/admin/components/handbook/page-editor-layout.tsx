import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminRoutes } from '../../routes';

export type HandbookTab = 'preview' | 'edit' | 'lix' | 'toc' | 'delete' | 'versions' | 'translate';

interface Props {
  nid: number;
  bookTitle: string;
  activeTab: HandbookTab;
  langcode?: string;
  children: React.ReactNode;
}

const TABS: Array<{ key: HandbookTab; destructive?: boolean }> = [
  { key: 'preview' },
  { key: 'edit' },
  { key: 'lix' },
  { key: 'toc' },
  { key: 'delete', destructive: true },
  { key: 'versions' },
  { key: 'translate' },
];

const TAB_DEFAULT: Record<HandbookTab, string> = {
  preview: 'Preview',
  edit: 'Edit',
  lix: 'Lix info',
  toc: 'Table of Contents',
  delete: 'Delete',
  versions: 'Versions',
  translate: 'Translate',
};

export const AdminHandbookPageEditorLayout: React.FC<Props> = ({ nid, bookTitle, activeTab, langcode, children }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('admin');
  const langSuffix = langcode && langcode !== 'da' ? `?lang=${langcode}` : '';

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div>
        <div className="text-sm text-gray-500">
          <Link to={adminRoutes.dashboard} className="hover:underline">{t('nav.console', 'Console')}</Link>
          {' › '}
          <Link to={adminRoutes.handbook} className="hover:underline">{t('handbook.title', 'Management Handbook')}</Link>
          {' › '}
          <span className="text-gray-700">{t(`handbook.tabs.${activeTab}`, TAB_DEFAULT[activeTab])}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">
          {t('handbook.editorHeading', 'Edit Simple Page')} {bookTitle || t('handbook.title', 'Management Handbook')}
        </h1>
      </div>

      <nav className="border border-gray-200 rounded-xl bg-white px-3 py-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(tab => {
            const active = tab.key === activeTab;
            const destructive = tab.destructive && !active;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => navigate(adminRoutes.handbookPageTab.replace(':nid', String(nid)).replace(':tab', tab.key) + langSuffix)}
                className={[
                  'px-4 py-2 rounded-md text-sm transition-colors',
                  active ? 'bg-[#0d0e0e] text-white' : 'text-gray-700 hover:bg-gray-50',
                  destructive ? 'text-red-600 hover:bg-red-50' : '',
                ].filter(Boolean).join(' ')}
              >
                {t(`handbook.tabs.${tab.key}`, TAB_DEFAULT[tab.key])}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="border border-gray-200 rounded-xl bg-white p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
};
