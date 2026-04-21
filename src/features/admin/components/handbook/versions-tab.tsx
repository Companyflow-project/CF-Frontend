import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminHandbookVersions } from '../../handbook-hooks';

interface Props {
  nid: number;
}

export const AdminHandbookVersionsTab: React.FC<Props> = ({ nid }) => {
  const { t } = useTranslation('admin');
  const { data: versions = [], isLoading } = useAdminHandbookVersions(nid);

  if (isLoading) return <div className="text-sm text-gray-500">{t('handbook.common.loading', 'Loading…')}</div>;

  if (versions.length === 0) {
    return <div className="text-sm text-gray-500">{t('handbook.versions.empty', 'No revision history available for this page.')}</div>;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-[#0d0e0e]">{t('handbook.versions.title', 'Versions')}</h2>
      <table className="w-full text-sm">
        <thead className="text-xs text-gray-500 uppercase">
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-2">{t('handbook.versions.columnVersion', 'Version')}</th>
            <th className="text-left py-2 px-2">{t('handbook.versions.columnTitle', 'Title')}</th>
            <th className="text-left py-2 px-2">{t('handbook.versions.columnAuthor', 'Author')}</th>
            <th className="text-left py-2 px-2">{t('handbook.versions.columnChanged', 'Changed')}</th>
            <th className="text-left py-2 px-2">{t('handbook.versions.columnLog', 'Log')}</th>
          </tr>
        </thead>
        <tbody>
          {versions.map(v => (
            <tr key={v.vid} className="border-b border-gray-100">
              <td className="py-2 px-2 font-mono text-xs">
                {v.vid}
                {v.isCurrent && (
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-green-50 text-green-700">
                    {t('handbook.versions.current', 'current')}
                  </span>
                )}
              </td>
              <td className="py-2 px-2">{v.title}</td>
              <td className="py-2 px-2 text-gray-600">{v.authorName || '—'}</td>
              <td className="py-2 px-2 text-gray-600">
                {v.changed ? new Date(v.changed * 1000).toISOString().slice(0, 16).replace('T', ' ') : '—'}
              </td>
              <td className="py-2 px-2 text-gray-600 truncate max-w-xs">{v.logMessage || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
