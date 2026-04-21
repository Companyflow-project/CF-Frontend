import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface StatusVersionInfoValue {
  bookId: string;
  weight: number;
  logMessage: string;
  writtenBy: string;
  writtenOnDate: string;
  writtenOnTime: string;
  promotedToFrontPage: boolean;
  sticky: boolean;
}

export const defaultStatusVersionInfoValue = (
  authorLabel: string,
): StatusVersionInfoValue => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    bookId: '',
    weight: 0,
    logMessage: '',
    writtenBy: authorLabel,
    writtenOnDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    writtenOnTime: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    promotedToFrontPage: false,
    sticky: false,
  };
};

export interface BookOption {
  value: string;
  label: string;
}

type TabKey = 'status' | 'toc' | 'version' | 'author' | 'promotion';

interface Props {
  value: StatusVersionInfoValue;
  onChange: (next: StatusVersionInfoValue) => void;
  published: boolean;
  onPublishedChange: (next: boolean) => void;
  authorDisplay: string;
  lastSavedLabel?: string;
  bookOptions?: BookOption[];
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}

export const StatusVersionInfoCard: React.FC<Props> = ({
  value,
  onChange,
  published,
  onPublishedChange,
  authorDisplay,
  lastSavedLabel,
  bookOptions = [],
  onSave,
  onCancel,
  saving = false,
}) => {
  const { t } = useTranslation('admin');
  const [active, setActive] = useState<TabKey>('status');

  const set = <K extends keyof StatusVersionInfoValue>(
    key: K,
    v: StatusVersionInfoValue[K],
  ) => onChange({ ...value, [key]: v });

  const tocSubtitle = value.bookId
    ? bookOptions.find((b) => b.value === value.bookId)?.label ??
      t('svi.toc.subtitleInBook', 'In book')
    : t('svi.toc.subtitleNotInBook', 'Not in book');

  const versionSubtitle = value.logMessage.trim()
    ? t('svi.version.subtitleHasLog', 'Has log')
    : t('svi.version.subtitleNoVersion', 'No version');

  const promotionSubtitle =
    value.promotedToFrontPage || value.sticky
      ? t('svi.promotion.subtitlePromoted', 'Promoted')
      : t('svi.promotion.subtitleNotPromoted', 'Not promoted');

  const authorSubtitle = t('svi.author.subtitle', 'By {{name}}, {{date}}', {
    name: value.writtenBy || authorDisplay,
    date: value.writtenOnDate,
  });

  const tabs: Array<{
    key: TabKey;
    title: string;
    subtitle?: React.ReactNode;
  }> = [
    {
      key: 'status',
      title: t('svi.status.title', 'Status'),
      subtitle: (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
            published
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {published
            ? t('svi.status.published', 'Published')
            : t('svi.status.notPublished', 'Not Published')}
        </span>
      ),
    },
    {
      key: 'toc',
      title: t('svi.toc.title', 'Table of contents'),
      subtitle: <span className="text-xs text-gray-500">{tocSubtitle}</span>,
    },
    {
      key: 'version',
      title: t('svi.version.title', 'Version info'),
      subtitle: (
        <span className="text-xs text-gray-500">{versionSubtitle}</span>
      ),
    },
    {
      key: 'author',
      title: t('svi.author.title', 'Author'),
      subtitle: (
        <span className="text-xs text-gray-500">{authorSubtitle}</span>
      ),
    },
    {
      key: 'promotion',
      title: t('svi.promotion.title', 'Promotion settings'),
      subtitle: (
        <span className="text-xs text-gray-500">{promotionSubtitle}</span>
      ),
    },
  ];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h2 className="text-base sm:text-lg font-semibold text-[#0d0e0e]">
          {t('svi.sectionTitle', 'Status & Version Info')}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
        <nav
          role="tablist"
          aria-label={t('svi.sectionTitle', 'Status & Version Info')}
          className="border-b md:border-b-0 md:border-r border-gray-200 bg-white"
        >
          {tabs.map((tab) => {
            const isActive = active === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setActive(tab.key)}
                className={`w-full text-left px-5 py-4 border-l-2 transition-colors ${
                  isActive
                    ? 'border-[#0d0e0e] bg-gray-50'
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-semibold text-[#0d0e0e]">
                  {tab.title}
                </div>
                {tab.subtitle && <div className="mt-1">{tab.subtitle}</div>}
              </button>
            );
          })}
        </nav>

        <div className="p-5 sm:p-6 min-h-[260px]">
          {active === 'status' && (
            <dl className="text-sm text-gray-700 space-y-3">
              <div className="flex">
                <dt className="w-32 text-gray-500">
                  {t('svi.status.lastSaved', 'Last saved:')}
                </dt>
                <dd className="text-[#0d0e0e]">
                  {lastSavedLabel ?? t('svi.status.notSavedYet', 'Not saved yet')}
                </dd>
              </div>
              <div className="flex">
                <dt className="w-32 text-gray-500">
                  {t('svi.status.author', 'Author:')}
                </dt>
                <dd className="text-[#0d0e0e]">{authorDisplay}</dd>
              </div>
            </dl>
          )}

          {active === 'toc' && (
            <div className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="svi-book">{t('svi.toc.book', 'Book')}</Label>
                <select
                  id="svi-book"
                  value={value.bookId}
                  onChange={(e) => set('bookId', e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-lg text-sm px-3 py-2 bg-white"
                >
                  <option value="">
                    {t('svi.toc.nothingSelected', '– Nothing selected –')}
                  </option>
                  {bookOptions.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {t('svi.toc.bookHint', 'The page becomes part of the selected book.')}
                </p>
                {!value.bookId && (
                  <p className="mt-1 text-xs text-red-600">
                    {t('svi.toc.noBookSelected', 'No book selected.')}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="svi-weight">
                  {t('svi.toc.weight', 'Weight')}
                </Label>
                <Input
                  id="svi-weight"
                  type="number"
                  value={value.weight}
                  onChange={(e) =>
                    set('weight', Number.parseInt(e.target.value || '0', 10))
                  }
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t(
                    'svi.toc.weightHint',
                    'Pages at a given level are sorted first by weight and then by title.',
                  )}
                </p>
              </div>
            </div>
          )}

          {active === 'version' && (
            <div className="max-w-xl">
              <Label htmlFor="svi-log">
                {t('svi.version.logMessage', 'Log message')}
              </Label>
              <Textarea
                id="svi-log"
                value={value.logMessage}
                onChange={(e) => set('logMessage', e.target.value)}
                placeholder={t(
                  'svi.version.logPlaceholder',
                  'Please provide a brief description of your changes.',
                )}
                rows={5}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t(
                  'svi.version.logHint',
                  'Please provide a brief description of your changes.',
                )}
              </p>
            </div>
          )}

          {active === 'author' && (
            <div className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="svi-written-by">
                  {t('svi.author.writtenBy', 'Written by')}
                </Label>
                <Input
                  id="svi-written-by"
                  value={value.writtenBy}
                  onChange={(e) => set('writtenBy', e.target.value)}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t('svi.author.writtenByHint', "The author's username.")}
                </p>
              </div>

              <div>
                <Label htmlFor="svi-written-on-date">
                  {t('svi.author.writtenOn', 'Written on')}
                </Label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <Input
                    id="svi-written-on-date"
                    type="date"
                    value={value.writtenOnDate}
                    onChange={(e) => set('writtenOnDate', e.target.value)}
                  />
                  <Input
                    id="svi-written-on-time"
                    type="time"
                    step={1}
                    value={value.writtenOnTime}
                    onChange={(e) => set('writtenOnTime', e.target.value)}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {t(
                    'svi.author.writtenOnHint',
                    'The time when the content item was created.',
                  )}
                </p>
              </div>
            </div>
          )}

          {active === 'promotion' && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.promotedToFrontPage}
                  onChange={(e) => set('promotedToFrontPage', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                {t('svi.promotion.promotedToFrontPage', 'Promoted to front page')}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.sticky}
                  onChange={(e) => set('sticky', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                {t('svi.promotion.sticky', 'Sticky')}
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 bg-white">
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => onPublishedChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          {t('svi.published', 'Published')}
        </label>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90"
            onClick={onSave}
            disabled={saving}
          >
            {saving
              ? t('common.saving', 'Saving…')
              : t('svi.saveActivity', 'Save Activity')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StatusVersionInfoCard;
