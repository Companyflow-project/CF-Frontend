import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
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
  }, [page]);

  if (isLoading || !page) {
    return <div className="text-sm text-gray-500">{t('handbook.common.loading', 'Loading…')}</div>;
  }

  const lix = calculateLix(body);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium text-[#0d0e0e] mb-1 block">
            {t('handbook.edit.title', 'Title')} <span className="text-red-500">*</span>
          </label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium text-[#0d0e0e] mb-1 block">{t('handbook.edit.body', 'Body text (Edit intro)')}</label>
          <div className="border border-gray-200 rounded-lg">
            <RichTextEditor content={body} onChange={setBody} className="min-h-[200px]" />
          </div>
          <div className="text-xs text-gray-500 mt-1">{t('handbook.edit.aboutTextFormats', 'About text formats')}</div>

          <div className="mt-3">
            <label className="text-sm font-medium text-[#0d0e0e] mb-1 block">{t('handbook.edit.textFormat', 'Text format')}</label>
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

          <div className="mt-3 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 pt-2">
            <span>Lix: {lix.lix || '–'}</span>
            <span>{t('handbook.lix.words', 'words')}: {lix.words || '–'}</span>
            <span>{t('handbook.lix.sentences', 'sentences')}: {lix.sentences || '–'}</span>
            <span>{t('handbook.edit.longWordsLabel', 'Long words')}: {lix.longWords || '–'}</span>
          </div>
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-4">
          <label className="flex items-start gap-2">
            <Checkbox checked={helpPage} onChange={(e) => setHelpPage(e.target.checked)} />
            <span>
              <div className="text-sm font-medium text-[#0d0e0e]">{t('handbook.edit.helpPage', 'Help page')}</div>
              <div className="text-xs text-gray-500">{t('handbook.edit.helpPageHint', 'Tick if the page is a guide or help page for businesses.')}</div>
            </span>
          </label>
          <label className="flex items-start gap-2">
            <Checkbox checked={excludeHelp} onChange={(e) => setExcludeHelp(e.target.checked)} />
            <span>
              <div className="text-sm font-medium text-[#0d0e0e]">{t('handbook.edit.excludeFromOverview', 'Exclude from help overview')}</div>
              <div className="text-xs text-gray-500">{t('handbook.edit.excludeHint', 'Do not show this page in the overview of help texts for business leaders.')}</div>
            </span>
          </label>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="text-sm font-medium text-[#0d0e0e] mb-1 block">{t('handbook.edit.helpCategory', 'Help category')}</label>
          <select
            value={helpCategoryTid ?? ''}
            onChange={(e) => setHelpCategoryTid(e.target.value ? Number(e.target.value) : null)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="">{t('handbook.edit.helpCategoryPlaceholder', 'Search categories…')}</option>
            {categories.map(c => (
              <option key={c.tid} value={c.tid}>{c.name}</option>
            ))}
          </select>
          <div className="text-xs text-gray-500 mt-1">{t('handbook.edit.helpCategoryHint', 'Place this help page in a category on the help page overview.')}</div>
        </div>

        <div>
          <label className="text-sm font-medium text-[#0d0e0e] mb-1 block">{t('handbook.edit.userManual', 'User manual')}</label>
          <Input value={userManual} onChange={(e) => setUserManual(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium text-[#0d0e0e] mb-1 block">{t('handbook.edit.routeUrl', 'Route/URL')}</label>
          <Input value={routeUrl} onChange={(e) => setRouteUrl(e.target.value)} placeholder="/this/url" />
          <div className="text-xs text-gray-500 mt-1">{t('handbook.edit.routeHint', 'Can be used on help pages to tie function and help together. Use the patterns this.is.route (route) or /this/url (url)')}</div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="flex items-center gap-2">
            <Checkbox checked={status} onChange={(e) => setStatus(e.target.checked)} />
            <span className="text-sm font-medium text-[#0d0e0e]">{t('handbook.common.published', 'Published')}</span>
          </label>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-[#0d0e0e] mb-3">{t('handbook.edit.sidebarTitle', 'Status & Version Info')}</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <div className="text-xs text-gray-500">{t('handbook.edit.status', 'Status')}</div>
              <div className={`inline-block px-2 py-0.5 rounded text-xs ${status ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {status ? t('handbook.common.published', 'Published') : t('handbook.common.unpublished', 'Unpublished')}
              </div>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate(adminRoutes.handbookPageMeta.replace(':nid', String(nid)))}
                className="text-left font-medium text-[#0d0e0e] border-l-2 border-transparent hover:border-[#0d0e0e] pl-2 -ml-2"
              >
                {t('handbook.edit.metaTags', 'Meta tags')}
              </button>
            </li>
            <li>
              <div className="font-medium text-[#0d0e0e]">{t('handbook.edit.tocSidebar', 'Table of contents')}</div>
              <div className="text-xs text-gray-500">{page.bid ? t('handbook.common.inBook', 'In book') : t('handbook.common.notInBook', 'Not in book')}</div>
            </li>
            <li>
              <div className="font-medium text-[#0d0e0e]">{t('handbook.edit.versionInfo', 'Version info')}</div>
              <div className="text-xs text-gray-500">vid {page.nid}</div>
            </li>
            <li>
              <div className="font-medium text-[#0d0e0e]">{t('handbook.edit.author', 'Author')}</div>
              <div className="text-xs text-gray-500">
                By {page.authorName || '—'}, {new Date(page.changed * 1000).toISOString().slice(0, 10)}
              </div>
            </li>
          </ul>
        </div>
      </aside>

      <div className="lg:col-span-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
        <Button variant="outline" onClick={() => navigate(adminRoutes.handbook)}>{t('handbook.common.cancel', 'Cancel')}</Button>
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
          {updatePage.isPending ? t('handbook.common.saving', 'Saving…') : t('handbook.edit.saveActivity', 'Save Activity')}
        </Button>
      </div>
    </div>
  );
};
