import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { axiosClient } from '@/lib/axios-client';
import { toast } from 'sonner';
import {
  useAdminHandbookPage,
  useAdminHandbookHelpCategories,
  useUpdateAdminHandbookPage,
  useDeleteAdminHandbookPage,
} from '../../handbook-hooks';
import { useNavigate } from 'react-router-dom';
import { adminRoutes } from '../../routes';
import { calculateLix } from './lix';
import { StatusVersionInfoCard, defaultStatusVersionInfoValue, type StatusVersionInfoValue } from '../status-version-info-card';

interface Props {
  nid: number;
  langcode?: string;
}

export const AdminHandbookEditTab: React.FC<Props> = ({ nid, langcode }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('admin');
  const { data: page, isLoading } = useAdminHandbookPage(nid, langcode);
  const { data: categories = [] } = useAdminHandbookHelpCategories();
  const updatePage = useUpdateAdminHandbookPage();
  const deletePage = useDeleteAdminHandbookPage();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [bodyFormat, setBodyFormat] = useState('basic_html');
  const [helpPage, setHelpPage] = useState(false);
  const [excludeHelp, setExcludeHelp] = useState(false);
  const [helpCategoryTid, setHelpCategoryTid] = useState<number | null>(null);
  const [userManual, setUserManual] = useState('');
  const [routeUrl, setRouteUrl] = useState('');
  const [status, setStatus] = useState(true);
  const [heroImageFid, setHeroImageFid] = useState<number | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [heroImageName, setHeroImageName] = useState<string>('');
  const [heroUploading, setHeroUploading] = useState(false);
  const heroInputRef = useRef<HTMLInputElement | null>(null);

  const [sviValue, setSviValue] = useState<StatusVersionInfoValue>(() =>
    defaultStatusVersionInfoValue(''),
  );

  useEffect(() => {
    if (!page) return;
    setTitle(page.title);
    setBody(page.body);
    setBodyFormat(page.bodyFormat || 'basic_html');
    setHelpPage(page.helpPage);
    setExcludeHelp(page.excludeFromHelpOverview);
    setHelpCategoryTid(page.helpCategoryTid);
    setUserManual(page.userManual);
    setRouteUrl(page.routeUrl);
    setStatus(page.status === 1);
    setHeroImageFid(page.heroImageFid);
    setHeroImageUrl(page.heroImageUrl);
    setHeroImageName(page.heroImageUrl ? page.heroImageUrl.split('/').pop() ?? '' : '');
    if (page.authorName) {
      setSviValue((prev) => ({ ...prev, writtenBy: `By ${page.authorName}, ${new Date(page.changed * 1000).toISOString().slice(0, 10)}` }));
    }
  }, [page]);

  if (isLoading || !page) {
    return <div className="text-sm text-gray-500">{t('handbook.common.loading', 'Loading…')}</div>;
  }

  const lix = calculateLix(body);

  const handleHeroFile = async (file: File) => {
    setHeroUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const resp = await axiosClient.post<{ fid: number; uri?: string }>('/files', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (resp.data?.fid) {
        setHeroImageFid(resp.data.fid);
        setHeroImageUrl(resp.data.uri ?? null);
        setHeroImageName(file.name);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('handbook.edit.heroUploadFailed', 'Hero image upload failed'));
    } finally {
      setHeroUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updatePage.mutateAsync({
        nid,
        payload: {
          title,
          body,
          bodyFormat,
          helpPage,
          excludeFromHelpOverview: excludeHelp,
          helpCategoryTid,
          userManual,
          routeUrl,
          status,
          heroImageFid,
        },
      });
      toast.success(t('handbook.edit.saved', 'Page saved'));
    } catch {
      toast.error(t('handbook.edit.saveFailed', 'Failed to save page'));
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('handbook.edit.deleteConfirm', 'Delete this page? This cannot be undone.'))) return;
    try {
      await deletePage.mutateAsync(nid);
      toast.success(t('handbook.edit.deleted', 'Page deleted'));
      navigate(adminRoutes.handbook);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('handbook.edit.deleteFailed', 'Failed to delete page'));
    }
  };

  const selectedCategory = categories.find((c) => c.tid === helpCategoryTid) ?? null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="text-sm font-medium text-[#0d0e0e] mb-1 block">
          {t('handbook.edit.title', 'Title')} <span className="text-red-500">*</span>
        </label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      {/* Body */}
      <div>
        <label className="text-sm font-medium text-[#0d0e0e] mb-1 block">
          {t('handbook.edit.body', 'Body text (Edit intro)')}
        </label>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <RichTextEditor content={body} onChange={setBody} className="min-h-[200px]" />
        </div>
        <div className="text-xs text-gray-500 mt-1">{t('handbook.edit.aboutTextFormats', 'About text formats')}</div>

        <div className="mt-3">
          <label className="text-sm font-medium text-[#0d0e0e] mb-1 block">
            {t('handbook.edit.textFormat', 'Text format')}
          </label>
          <select
            value={bodyFormat}
            onChange={(e) => setBodyFormat(e.target.value)}
            className="w-full sm:max-w-xs border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="basic_html">{t('handbook.edit.simpleHtml', 'Simple HTML')}</option>
            <option value="full_html">{t('handbook.edit.fullHtml', 'Full HTML')}</option>
            <option value="plain_text">{t('handbook.edit.plainText', 'Plain text')}</option>
          </select>
        </div>

        <div className="mt-3 text-xs text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-100 pt-2">
          <span>{t('handbook.lix.label', 'Lix')}: {lix.lix || '–'}</span>
          <span className="text-gray-300">|</span>
          <span>{t('handbook.lix.words', 'Words')}: {lix.words || '–'}</span>
          <span className="text-gray-300">|</span>
          <span>{t('handbook.lix.sentences', 'Sentences')}: {lix.sentences || '–'}</span>
          <span className="text-gray-300">|</span>
          <span>{t('handbook.edit.longWordsLabel', 'Long words')}: {lix.longWords || '–'}</span>
        </div>
      </div>

      {/* Help / overview flags */}
      <div className="space-y-3 border-t border-gray-100 pt-4">
        <label className="flex items-start gap-2">
          <Checkbox checked={helpPage} onChange={(e) => setHelpPage(e.target.checked)} />
          <span>
            <div className="text-sm font-medium text-[#0d0e0e]">
              {t('handbook.edit.helpPage', 'Help page')}
            </div>
            <div className="text-xs text-gray-500">
              {t('handbook.edit.helpPageHint', 'Tick if the page is a guide or help page for businesses.')}
            </div>
          </span>
        </label>
        <label className="flex items-start gap-2">
          <Checkbox checked={excludeHelp} onChange={(e) => setExcludeHelp(e.target.checked)} />
          <span>
            <div className="text-sm font-medium text-[#0d0e0e]">
              {t('handbook.edit.excludeFromOverview', 'Exclude from help overview')}
            </div>
            <div className="text-xs text-gray-500">
              {t('handbook.edit.excludeHint', 'Do not show this page in the overview of help texts for business leaders')}
            </div>
          </span>
        </label>
      </div>

      {/* Help category — Drupal multi-value field card (Figma) */}
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <label className="text-sm font-semibold text-[#0d0e0e]">
          {t('handbook.edit.helpCategory', 'Help category')}
        </label>

        <div className="rounded-md border border-gray-200 overflow-hidden">
          {/* Black drag-handle bar that frames the row, matching the Figma. */}
          <div className="h-2 bg-[#0d0e0e]" />
          <div className="p-3 sm:p-4 flex items-center gap-3">
            <span className="text-gray-500 text-base font-medium select-none">+</span>
            <select
              value={helpCategoryTid ?? ''}
              onChange={(e) => setHelpCategoryTid(e.target.value ? Number(e.target.value) : null)}
              className="flex-1 border border-red-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
            >
              <option value="">{t('handbook.edit.helpCategoryPlaceholder', 'Search categories…')}</option>
              {categories.map((c) => (
                <option key={c.tid} value={c.tid}>{c.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setHelpCategoryTid(null)}
              disabled={!selectedCategory}
              className="text-sm font-semibold text-red-700 border border-red-200 bg-red-50 rounded-md px-5 py-2 hover:bg-red-100 disabled:text-gray-300 disabled:bg-transparent disabled:border-gray-200 disabled:hover:bg-transparent"
            >
              {t('common.remove', 'Remove')}
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          {t('handbook.edit.helpCategoryHint', 'Place this help page in a category on the help page overview.')}
        </div>

        <button
          type="button"
          disabled
          title={t('handbook.edit.singleValueOnly', 'Only one value supported')}
          className="inline-block text-sm font-semibold text-green-800 bg-green-100 border border-green-200 rounded-md px-4 py-2 hover:bg-green-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          + {t('handbook.edit.addAnother', 'Add Another Item')}
        </button>
      </div>

      {/* User manual — plain single field per Figma (no +/Remove) */}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        <label className="text-sm font-semibold text-[#0d0e0e]">
          {t('handbook.edit.userManual', 'User manual')}
        </label>
        <Input value={userManual} onChange={(e) => setUserManual(e.target.value)} />
      </div>

      {/* Route/URL — Drupal-style multi-value field row (Figma) */}
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <label className="text-sm font-semibold text-[#0d0e0e]">
          {t('handbook.edit.routeUrl', 'Route/URL')}
        </label>
        <div className="flex items-stretch gap-2">
          <span className="text-gray-500 text-base self-center">+</span>
          <Input
            className="flex-1"
            value={routeUrl}
            onChange={(e) => setRouteUrl(e.target.value)}
            placeholder="/this/url"
          />
          <button
            type="button"
            onClick={() => setRouteUrl('')}
            disabled={!routeUrl}
            className="text-sm font-medium text-red-700 border border-red-200 bg-red-50 rounded-md px-5 py-2 hover:bg-red-100 disabled:text-gray-300 disabled:bg-transparent disabled:border-gray-200 disabled:hover:bg-transparent"
          >
            {t('common.remove', 'Remove')}
          </button>
        </div>
        <div className="text-xs text-gray-500">
          {t('handbook.edit.routeHint', 'Can be used on help pages to tie function and help together. Use the patterns this.is.route (route) or /this/url (url)')}
        </div>
        <button
          type="button"
          disabled
          title={t('handbook.edit.singleValueOnly', 'Only one value supported')}
          className="inline-block text-sm font-semibold text-green-800 bg-green-100 border border-green-200 rounded-md px-4 py-2 hover:bg-green-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          + {t('handbook.edit.addAnother', 'Add Another Item')}
        </button>
      </div>

      {/* Hero image */}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        <label className="text-sm font-medium text-[#0d0e0e]">
          {t('handbook.edit.heroImage', 'Hero image')}
        </label>
        <div className="flex items-center gap-3">
          <input
            ref={heroInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void handleHeroFile(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => heroInputRef.current?.click()}
            disabled={heroUploading}
          >
            {heroUploading
              ? t('handbook.edit.heroUploading', 'Uploading…')
              : t('handbook.edit.chooseFile', 'Choose File')}
          </Button>
          <span className="text-sm text-gray-500 truncate">
            {heroImageName || t('handbook.edit.noFileChosen', 'No file chosen')}
          </span>
          {heroImageFid !== null && (
            <button
              type="button"
              onClick={() => {
                setHeroImageFid(null);
                setHeroImageUrl(null);
                setHeroImageName('');
              }}
              className="text-sm text-red-600 hover:underline"
            >
              {t('common.remove', 'Remove')}
            </button>
          )}
        </div>
        {heroImageUrl && (
          <img src={heroImageUrl} alt="" className="mt-2 max-h-32 rounded-md border border-gray-200" />
        )}
        <div className="text-xs text-gray-500">
          {t(
            'handbook.edit.heroHint',
            'Image displayed in the page header. Allowed: png, gif, jpg, jpeg. Recommended at least 1200×450 pixels.',
          )}
        </div>
      </div>

      {/* Status & Version Info */}
      <StatusVersionInfoCard
        value={sviValue}
        onChange={setSviValue}
        published={status}
        onPublishedChange={setStatus}
        authorDisplay={page.authorName || '—'}
        lastSavedLabel={page.changed ? new Date(page.changed * 1000).toISOString().slice(0, 10) : undefined}
        onSave={handleSave}
        onCancel={() => navigate(adminRoutes.handbook)}
        saving={updatePage.isPending}
      />

      {/* Bottom action row — Published toggle + Cancel/Delete/Save Activity */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-100 pt-4">
        <label className="flex items-center gap-2">
          <Checkbox checked={status} onChange={(e) => setStatus(e.target.checked)} />
          <span className="text-sm font-medium text-[#0d0e0e]">
            {t('handbook.common.published', 'Published')}
          </span>
        </label>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(adminRoutes.handbook)}>
            {t('handbook.common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleDelete}
            disabled={deletePage.isPending}
          >
            {t('handbook.common.delete', 'Delete')}
          </Button>
          <Button
            className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90"
            onClick={handleSave}
            disabled={updatePage.isPending}
          >
            {updatePage.isPending
              ? t('handbook.common.saving', 'Saving…')
              : t('handbook.edit.saveActivity', 'Save Activity')}
          </Button>
        </div>
      </div>
    </div>
  );
};
