import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminHandbookPage } from '../../handbook-hooks';
import { calculateLix, type LixStats } from './lix';

interface Props {
  nid: number;
  langcode?: string;
}

const DIFFICULTY_CLASS: Record<LixStats['difficulty'], string> = {
  very_easy: 'bg-emerald-50 text-emerald-700',
  easy: 'bg-green-50 text-green-700',
  medium: 'bg-yellow-50 text-yellow-700',
  difficult: 'bg-orange-50 text-orange-700',
  very_difficult: 'bg-red-50 text-red-700',
};

export const AdminHandbookLixTab: React.FC<Props> = ({ nid, langcode }) => {
  const { t } = useTranslation('admin');
  const { data: page, isLoading } = useAdminHandbookPage(nid, langcode);
  if (isLoading || !page) return <div className="text-sm text-gray-500">{t('handbook.common.loading', 'Loading…')}</div>;

  const stats = calculateLix(page.body);
  const diffClass = DIFFICULTY_CLASS[stats.difficulty];

  const plainText = page.body
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .split(/\n{2,}/)
    .map(s => s.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#0d0e0e]">{t('handbook.lix.title', 'Lix counter')}</h2>
      <div className="flex items-center gap-3">
        <div className="text-base">
          <span className="font-bold">{t('handbook.lix.number', 'Number')} {stats.lix}</span>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${diffClass}`}>
          {t(`handbook.lix.difficulty.${stats.difficulty}`, stats.difficulty)}
        </span>
      </div>
      <div className="space-y-1 text-sm">
        <div><span className="font-bold">{stats.words}</span> {t('handbook.lix.words', 'words')}</div>
        <div><span className="font-bold">{stats.sentences}</span> {t('handbook.lix.sentences', 'sentences')}</div>
      </div>

      <ul className="space-y-1 text-sm text-blue-600">
        <li className="flex items-center gap-2">
          <input type="checkbox" readOnly checked={stats.longSentences > 0} className="rounded border-gray-300" />
          {t('handbook.lix.longSentences', '{{count}} long sentences (>120 characters)', { count: stats.longSentences })}
        </li>
        <li className="flex items-center gap-2">
          <input type="checkbox" readOnly checked={stats.longWords > 0} className="rounded border-gray-300" />
          {t('handbook.lix.longWords', '{{count}} long words (>7 characters)', { count: stats.longWords })}
        </li>
        <li className="flex items-center gap-2">
          <input type="checkbox" readOnly checked={stats.veryLongWords > 0} className="rounded border-gray-300" />
          {t('handbook.lix.veryLongWords', '{{count}} very long words (>10 characters)', { count: stats.veryLongWords })}
        </li>
        <li className="flex items-center gap-2">
          <input type="checkbox" readOnly checked={stats.frequentWords > 0} className="rounded border-gray-300" />
          {t('handbook.lix.frequentWords', '{{count}} frequent words (>3 times >7 characters)', { count: stats.frequentWords })}
        </li>
      </ul>

      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm text-gray-700 leading-relaxed space-y-2">
        {plainText.length === 0 && <p className="text-gray-400">{t('handbook.lix.noContent', 'No content yet.')}</p>}
        {plainText.map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </div>
  );
};
