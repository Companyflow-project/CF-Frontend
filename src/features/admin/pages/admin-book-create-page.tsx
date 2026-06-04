import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { adminRoutes } from '../routes';
import { useCreateAdminHandbookBook } from '../handbook-hooks';
import type { CreateBookPageInput } from '../handbook-types';

const TEXT_FORMATS: { value: string; labelKey: string; fallback: string }[] = [
  { value: 'basic_html', labelKey: 'books.create.formats.basic_html', fallback: 'Simple HTML' },
  { value: 'full_html', labelKey: 'books.create.formats.full_html', fallback: 'Full HTML' },
  { value: 'plain_text', labelKey: 'books.create.formats.plain_text', fallback: 'Plain text' },
];

const TRANSLATABLE_LANGS: { code: string; labelKey: string; fallback: string }[] = [
  { code: 'da', labelKey: 'books.create.langs.da', fallback: 'Danish' },
  { code: 'en', labelKey: 'books.create.langs.en', fallback: 'English' },
  { code: 'bg', labelKey: 'books.create.langs.bg', fallback: 'Bulgarian' },
];

function SectionCard({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-5 sm:p-6 bg-white">
      {(title || description) && (
        <div className="mb-5">
          {title && <h2 className="text-base sm:text-lg font-semibold text-[#0d0e0e]">{title}</h2>}
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

type DraftPage = CreateBookPageInput & { _id: string };

let pageCounter = 0;
const newDraftPage = (): DraftPage => {
  pageCounter += 1;
  return { _id: `p-${pageCounter}`, title: '', body: '', bodyFormat: 'basic_html', isPublished: true };
};

export const AdminBookCreatePage: React.FC = () => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const createMutation = useCreateAdminHandbookBook();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [bodyFormat, setBodyFormat] = useState('basic_html');
  const [published, setPublished] = useState(true);
  const [machineTranslatedLangs, setMachineTranslatedLangs] = useState<string[]>([]);
  const [pages, setPages] = useState<DraftPage[]>(() => [newDraftPage()]);

  const valid = title.trim().length > 0
    && pages.length > 0
    && pages.every((p) => p.title.trim().length > 0);

  const updatePage = (id: string, patch: Partial<DraftPage>) => {
    setPages((prev) => prev.map((p) => (p._id === id ? { ...p, ...patch } : p)));
  };

  const removePage = (id: string) => {
    setPages((prev) => (prev.length > 1 ? prev.filter((p) => p._id !== id) : prev));
  };

  const addPage = () => setPages((prev) => [...prev, newDraftPage()]);

  const toggleLang = (code: string) => {
    setMachineTranslatedLangs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const submit = () => {
    if (!valid || createMutation.isPending) return;
    createMutation.mutate(
      {
        title: title.trim(),
        body,
        bodyFormat,
        isPublished: published,
        machineTranslatedLangs,
        pages: pages.map((p) => ({
          title: p.title.trim(),
          body: p.body ?? '',
          bodyFormat: p.bodyFormat ?? 'basic_html',
          isPublished: p.isPublished ?? true,
        })),
      },
      {
        onSuccess: () => {
          toast.success(t('books.create.success', 'Book created'));
          navigate(adminRoutes.books);
        },
        onError: (e: unknown) => {
          const msg = (e as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message;
          toast.error(msg ?? t('books.create.failed', 'Could not create book'));
        },
      },
    );
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb */}
      <p className="text-xs sm:text-sm text-gray-500">
        <Link to={adminRoutes.accountDashboard} className="hover:underline">
          {t('books.breadcrumb.account', 'Account')}
        </Link>
        <span className="mx-1">›</span>
        <Link to={adminRoutes.accountDashboard} className="hover:underline">
          {t('books.breadcrumb.superadminDashboard', 'Superadmin Dashboard')}
        </Link>
        <span className="mx-1">›</span>
        <Link to={adminRoutes.books} className="hover:underline">
          {t('books.breadcrumb.manageBooks', 'Manage Books')}
        </Link>
        <span className="mx-1">›</span>
        <span className="text-gray-700">{t('books.create.title', 'Create Book')}</span>
      </p>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e]">
          {title.trim() || t('books.create.heading', 'Book Title')}
        </h1>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={() => navigate(adminRoutes.books)}
            disabled={createMutation.isPending}
          >
            <X className="h-4 w-4 mr-1.5" />
            {t('books.create.cancel', 'Cancel')}
          </Button>
          <Button
            className="bg-[#0d0e0e] hover:bg-black text-white"
            onClick={submit}
            disabled={!valid || createMutation.isPending}
          >
            {createMutation.isPending
              ? t('books.create.saving', 'Saving…')
              : t('books.create.save', 'Save')}
          </Button>
        </div>
      </div>

      {/* Book root fields */}
      <SectionCard>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="book-title">
              {t('books.create.fields.title', 'Title')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="book-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('books.create.fields.titlePlaceholder', 'Add book title here')}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t('books.create.fields.bodyText', 'Body text (Geniet tekst)')}</Label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <RichTextEditor content={body} onChange={setBody} className="min-h-[180px]" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="book-format">{t('books.create.fields.textFormat', 'Text format')}</Label>
            <Select
              id="book-format"
              value={bodyFormat}
              onChange={(e) => setBodyFormat(e.target.value)}
              className="w-full sm:w-64"
            >
              {TEXT_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>{t(f.labelKey, f.fallback)}</option>
              ))}
            </Select>
            <p className="text-xs text-gray-500">
              {t('books.create.fields.notesHint', 'Enter any notes that the company can choose from for this page.')}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Add Pages section */}
      <SectionCard>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500">
              {t('books.create.pages.hint', 'Add at least one page to create the book')}
            </p>
            <Label className="mt-1 block">
              {t('books.create.pages.heading', 'Add Pages')} <span className="text-red-500">*</span>
            </Label>
          </div>

          <div className="space-y-6">
            {pages.map((page, idx) => (
              <div
                key={page._id}
                className="border border-gray-200 rounded-lg p-4 sm:p-5 space-y-4 bg-gray-50/40"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t('books.create.pages.pageLabel', { defaultValue: 'Page {{n}}', n: idx + 1 })}
                  </p>
                  {pages.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => removePage(page._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      {t('books.create.pages.remove', 'Remove')}
                    </Button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`page-title-${page._id}`}>
                    {t('books.create.pages.title', 'Page title')}
                  </Label>
                  <Input
                    id={`page-title-${page._id}`}
                    value={page.title}
                    onChange={(e) => updatePage(page._id, { title: e.target.value })}
                    placeholder={t('books.create.pages.titlePlaceholder', 'Add page title here')}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>{t('books.create.fields.bodyText', 'Body text (Geniet tekst)')}</Label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <RichTextEditor
                      content={page.body ?? ''}
                      onChange={(html) => updatePage(page._id, { body: html })}
                      className="min-h-[160px]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`page-format-${page._id}`}>
                    {t('books.create.fields.textFormat', 'Text format')}
                  </Label>
                  <Select
                    id={`page-format-${page._id}`}
                    value={page.bodyFormat ?? 'basic_html'}
                    onChange={(e) => updatePage(page._id, { bodyFormat: e.target.value })}
                    className="w-full sm:w-64"
                  >
                    {TEXT_FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>{t(f.labelKey, f.fallback)}</option>
                    ))}
                  </Select>
                  <p className="text-xs text-gray-500">
                    {t('books.create.fields.notesHint', 'Enter any notes that the company can choose from for this page.')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="text-[#1a8a5a] border-[#1a8a5a]/40 hover:bg-[#1a8a5a]/10"
            onClick={addPage}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {t('books.create.pages.addAnother', 'Add another page')}
          </Button>
        </div>
      </SectionCard>

      {/* Machine translated languages */}
      <SectionCard>
        <div className="space-y-3">
          <Label>{t('books.create.translatedLangs.heading', 'Machine translated languages on this page')}</Label>
          <div className="space-y-2">
            {TRANSLATABLE_LANGS.map((lang) => (
              <label
                key={lang.code}
                className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
              >
                <Checkbox
                  checked={machineTranslatedLangs.includes(lang.code)}
                  onChange={() => toggleLang(lang.code)}
                />
                <span>{t(lang.labelKey, lang.fallback)}</span>
              </label>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Status & Version Info */}
      <SectionCard title={t('books.create.status.heading', 'Status & Version Info')}>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={published} onCheckedChange={setPublished} />
            <span className="text-sm text-gray-700">
              {t('books.create.status.published', 'Published')}
            </span>
          </label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(adminRoutes.books)}
              disabled={createMutation.isPending}
            >
              {t('books.create.cancel', 'Cancel')}
            </Button>
            <Button
              className="bg-[#0d0e0e] hover:bg-black text-white"
              onClick={submit}
              disabled={!valid || createMutation.isPending}
            >
              {createMutation.isPending
                ? t('books.create.saving', 'Saving…')
                : t('books.create.saveActivity', 'Save Activity')}
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};
