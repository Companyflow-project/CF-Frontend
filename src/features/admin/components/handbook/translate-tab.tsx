import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminHandbookPage } from '../../handbook-hooks';
import { adminRoutes } from '../../routes';

interface Props {
  nid: number;
  langcode?: string;
}

const SUPPORTED_LANGS: Array<{ code: string; labelKey: string; fallback: string }> = [
  { code: 'da', labelKey: 'handbook.translate.danish', fallback: 'Danish' },
  { code: 'en', labelKey: 'handbook.translate.english', fallback: 'English' },
];

export const AdminHandbookTranslateTab: React.FC<Props> = ({ nid, langcode }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('admin');
  const { data: page, isLoading } = useAdminHandbookPage(nid, langcode);

  if (isLoading || !page) return <div className="text-sm text-gray-500">{t('handbook.common.loading', 'Loading…')}</div>;

  const available = new Set(page.availableLangcodes);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#0d0e0e]">{t('handbook.translate.title', 'Translate')}</h2>
      <p className="text-sm text-gray-600">
        {t('handbook.translate.description', 'Translations supported for this page. Click Edit to open the version in a specific language — if a translation is missing, opening Edit will let you add it.')}
      </p>
      <table className="w-full text-sm">
        <thead className="text-xs text-gray-500 uppercase">
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-2">{t('handbook.translate.columnLanguage', 'Language')}</th>
            <th className="text-left py-2 px-2">{t('handbook.translate.columnCode', 'Code')}</th>
            <th className="text-left py-2 px-2">{t('handbook.translate.columnStatus', 'Status')}</th>
            <th className="text-left py-2 px-2">{t('handbook.translate.columnAction', 'Action')}</th>
          </tr>
        </thead>
        <tbody>
          {SUPPORTED_LANGS.map(lang => {
            const isAvailable = available.has(lang.code);
            const isCurrent = lang.code === (langcode ?? page.langcode);
            return (
              <tr key={lang.code} className="border-b border-gray-100">
                <td className="py-2 px-2 font-medium">
                  {t(lang.labelKey, lang.fallback)}
                  {isCurrent && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-green-50 text-green-700">
                      {t('handbook.translate.current', 'current')}
                    </span>
                  )}
                </td>
                <td className="py-2 px-2 text-gray-600 font-mono">{lang.code}</td>
                <td className="py-2 px-2">
                  {isAvailable ? (
                    <span className="text-xs text-green-700">{t('handbook.translate.translated', 'Translated')}</span>
                  ) : (
                    <span className="text-xs text-gray-500">{t('handbook.translate.notTranslated', 'Not translated')}</span>
                  )}
                </td>
                <td className="py-2 px-2">
                  <button
                    type="button"
                    onClick={() => navigate(`${adminRoutes.handbookPageTab.replace(':nid', String(nid)).replace(':tab', 'edit')}?lang=${lang.code}`)}
                    className="text-[#0d0e0e] hover:underline text-sm"
                  >
                    {isAvailable ? t('handbook.translate.edit', 'Edit') : t('handbook.translate.add', 'Add translation')}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
