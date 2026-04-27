import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAdminHandbookPage } from '../../handbook-hooks';
import { adminRoutes } from '../../routes';

interface Props {
  nid: number;
  langcode?: string;
}

type SupportedLang = { code: string; labelKey: string; fallback: string };

const SUPPORTED_LANGS: SupportedLang[] = [
  { code: 'da', labelKey: 'handbook.translate.danish', fallback: 'Danish' },
  { code: 'en', labelKey: 'handbook.translate.english', fallback: 'English' },
  { code: 'bg', labelKey: 'handbook.translate.bulgarian', fallback: 'Bulgarian' },
];

export const AdminHandbookTranslateTab: React.FC<Props> = ({ nid, langcode }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('admin');
  const { data: page, isLoading } = useAdminHandbookPage(nid, langcode);

  if (isLoading || !page) return <div className="text-sm text-gray-500">{t('handbook.common.loading', 'Loading…')}</div>;

  const translationByLang = new Map(
    (page.translations ?? []).map((tr) => [tr.langcode, tr])
  );
  const originalLang = page.langcode;

  const openEdit = (code: string) => {
    navigate(`${adminRoutes.handbookPageTab.replace(':nid', String(nid)).replace(':tab', 'edit')}?lang=${code}`);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#0d0e0e]">
        {t('handbook.translate.heading', 'Translations of the {{title}}', { title: page.title })}
      </h2>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="text-left py-3 px-4 font-semibold">{t('handbook.translate.columnLanguage', 'Language')}</th>
              <th className="text-left py-3 px-4 font-semibold">{t('handbook.translate.columnTranslation', 'Translation')}</th>
              <th className="text-left py-3 px-4 font-semibold">{t('handbook.translate.columnStatus', 'Status')}</th>
              <th className="text-left py-3 px-4 font-semibold">{t('handbook.translate.columnAction', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {SUPPORTED_LANGS.map((lang) => {
              const tr = translationByLang.get(lang.code);
              const isOriginal = lang.code === originalLang;
              const exists = Boolean(tr);
              const published = tr?.published ?? false;

              return (
                <tr key={lang.code} className="border-t border-gray-100">
                  <td className="py-3 px-4 font-medium text-[#0d0e0e]">
                    {t(lang.labelKey, lang.fallback)}
                    {isOriginal && (
                      <span className="ml-2 text-xs text-gray-500 font-normal">
                        ({t('handbook.translate.originalLanguage', 'original language')})
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {exists ? (
                      <button
                        type="button"
                        onClick={() => openEdit(lang.code)}
                        className="text-blue-600 hover:underline"
                      >
                        {tr!.title}
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {exists ? (
                      published ? (
                        <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded border bg-green-50 text-green-700 border-green-200">
                          {t('handbook.translate.published', 'Published')}
                        </span>
                      ) : (
                        <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded border bg-gray-50 text-gray-700 border-gray-200">
                          {t('handbook.translate.unpublished', 'Unpublished')}
                        </span>
                      )
                    ) : (
                      <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">
                        {t('handbook.translate.notTranslated', 'Not translated')}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {exists ? (
                      <Button
                        size="sm"
                        className="h-8 bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90"
                        onClick={() => openEdit(lang.code)}
                      >
                        {t('handbook.translate.edit', 'Edit')}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => openEdit(lang.code)}
                      >
                        {t('handbook.translate.add', 'Add')}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
