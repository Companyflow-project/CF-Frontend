import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { ChevronDown } from 'lucide-react';
import { adminRoutes } from '../routes';
import {
  useAdminNewsletter,
  useAdminNewsletterCategories,
  useCreateAdminNewsletter,
  useUpdateAdminNewsletter,
} from '../newsletter-hooks';
import type {
  NewsletterBodyFormat,
  CreateAdminNewsletterPayload,
} from '../newsletter-types';

const TEXT_FORMATS: Array<{ value: NewsletterBodyFormat; labelKey: string; fallback: string }> = [
  { value: 'basic_html', labelKey: 'newsletters.format.basicHtml', fallback: 'Basic HTML' },
  { value: 'full_html', labelKey: 'newsletters.format.fullHtml', fallback: 'Full HTML' },
  { value: 'plain_text', labelKey: 'newsletters.format.plain', fallback: 'Plain text' },
];

const LANGUAGES = [
  { value: 'da', label: 'Danish' },
  { value: 'en', label: 'English' },
] as const;

type SendMode = 'scheduled' | 'immediately';

function toDateInputValue(unix: number | null): string {
  if (!unix) return '';
  const d = new Date(unix * 1000);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toTimeInputValue(unix: number | null): string {
  if (!unix) return '';
  const d = new Date(unix * 1000);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function parseDateTimeToUnix(date: string, time: string): number | null {
  if (!date) return null;
  const safeTime = time && /^\d{1,2}:\d{2}(:\d{2})?$/.test(time) ? time : '00:00:00';
  const ts = Date.parse(`${date}T${safeTime.length === 5 ? `${safeTime}:00` : safeTime}`);
  if (Number.isNaN(ts)) return null;
  return Math.floor(ts / 1000);
}

function parseCsvEmails(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-1 px-4 sm:px-6 py-4 text-left"
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? '' : '-rotate-90'}`}
        />
        <span className="text-sm font-semibold text-[#0d0e0e]">{title}</span>
      </button>
      {open && <div className="px-4 sm:px-6 pb-6 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  );
}

export const AdminNewsletterEditorPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const params = useParams<{ nid?: string }>();
  const rawNid = params.nid ? Number(params.nid) : null;
  const isEdit = rawNid != null && Number.isFinite(rawNid) && rawNid > 0;
  const nid = isEdit ? (rawNid as number) : null;

  const { data: detail, isLoading: loadingDetail, isError: detailError } =
    useAdminNewsletter(nid);
  const { data: categories = [] } = useAdminNewsletterCategories();
  const createMut = useCreateAdminNewsletter();
  const updateMut = useUpdateAdminNewsletter();

  // Form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [bodyFormat, setBodyFormat] = useState<NewsletterBodyFormat>('basic_html');
  const [smsText, setSmsText] = useState('');
  const [useAsTemplate, setUseAsTemplate] = useState(false);
  const [mailCategoryTid, setMailCategoryTid] = useState<number | null>(null);

  const [doNotSend, setDoNotSend] = useState(true);
  const [sendMode, setSendMode] = useState<SendMode>('scheduled');
  const [broadcastDate, setBroadcastDate] = useState('');
  const [broadcastTime, setBroadcastTime] = useState('');

  const [onlyTest, setOnlyTest] = useState(false);
  const [testAddressesRaw, setTestAddressesRaw] = useState('');
  const [manualReceiversRaw, setManualReceiversRaw] = useState('');
  const [businessNidRaw, setBusinessNidRaw] = useState('');
  const [langcode, setLangcode] = useState<string>('da');
  const [published, setPublished] = useState(false);

  // Hydrate form on edit
  useEffect(() => {
    if (!detail) return;
    setTitle(detail.title);
    setSubject(detail.subject);
    setBody(detail.body);
    setBodyFormat(detail.bodyFormat);
    setSmsText(detail.smsText);
    setUseAsTemplate(detail.useAsTemplate);
    setMailCategoryTid(detail.mailCategoryTid);
    setDoNotSend(detail.doNotSend);
    setSendMode(detail.sendOn == null ? 'immediately' : 'scheduled');
    setBroadcastDate(toDateInputValue(detail.sendOn));
    setBroadcastTime(toTimeInputValue(detail.sendOn));
    setOnlyTest(detail.onlyTest);
    setTestAddressesRaw((detail.testAddresses ?? []).join(', '));
    setManualReceiversRaw((detail.manualReceivers ?? []).join(', '));
    setBusinessNidRaw(detail.businessNid != null ? String(detail.businessNid) : '');
    setLangcode(detail.langcode || 'da');
    setPublished(detail.published);
  }, [detail]);

  const titleText = useMemo(
    () =>
      isEdit
        ? t('newsletters.editor.editTitle', 'Edit Customer Email')
        : t('newsletters.editor.createTitle', 'Create Customer Email'),
    [isEdit, t]
  );

  const buildPayload = (): CreateAdminNewsletterPayload => {
    const sendOn =
      sendMode === 'immediately'
        ? null
        : parseDateTimeToUnix(broadcastDate, broadcastTime);
    const parsedBusiness = businessNidRaw.trim()
      ? Number(businessNidRaw.trim())
      : null;
    return {
      title: title.trim(),
      subject: subject.trim(),
      body,
      bodyFormat,
      smsText: smsText.trim(),
      useAsTemplate,
      mailCategoryTid,
      doNotSend,
      onlyTest,
      sendOn,
      testAddresses: parseCsvEmails(testAddressesRaw),
      manualReceivers: parseCsvEmails(manualReceiversRaw),
      businessNid:
        parsedBusiness != null && Number.isFinite(parsedBusiness) ? parsedBusiness : null,
      langcode,
      published,
    };
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(t('newsletters.validation.titleRequired', 'Internal name is required.'));
      return;
    }
    if (!subject.trim()) {
      toast.error(t('newsletters.validation.subjectRequired', 'Subject is required.'));
      return;
    }
    if (!body || body === '<p></p>') {
      toast.error(t('newsletters.validation.bodyRequired', 'Body text is required.'));
      return;
    }

    const payload = buildPayload();

    try {
      if (isEdit && nid != null) {
        await updateMut.mutateAsync({ nid, payload });
        toast.success(t('newsletters.editor.updated', 'Newsletter saved'));
      } else {
        const created = await createMut.mutateAsync(payload);
        toast.success(t('newsletters.editor.created', 'Newsletter created'));
        navigate(adminRoutes.newsletterEdit.replace(':nid', String(created.nid)));
        return;
      }
    } catch {
      toast.error(t('newsletters.editor.saveFailed', 'Failed to save newsletter'));
    }
  };

  const saving = createMut.isPending || updateMut.isPending;

  if (isEdit && loadingDetail) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
        <div className="text-sm text-gray-500">{t('common.loading', 'Loading…')}</div>
      </div>
    );
  }

  if (isEdit && detailError) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 space-y-3">
        <div className="text-sm text-red-500">
          {t('newsletters.editor.loadError', 'Failed to load newsletter.')}
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(adminRoutes.newsletters)}>
          {t('common.back', 'Back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Breadcrumb + header */}
      <div>
        <div className="text-sm text-gray-500">
          <Link to={adminRoutes.dashboard} className="hover:underline">
            {t('nav.console', 'Console')}
          </Link>
          {' › '}
          <Link to={adminRoutes.newsletters} className="hover:underline">
            {t('newsletters.title', 'Newsletters')}
          </Link>
          {' › '}
          <span className="text-gray-700">
            {isEdit
              ? t('newsletters.editor.editCrumb', 'Edit')
              : t('newsletters.editor.createCrumb', 'Create')}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">{titleText}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t(
            'newsletters.editor.helpText',
            'Give the email an internal name that makes it easy to understand what it is used for. Do not publish it.'
          )}
        </p>
      </div>

      {/* Contents */}
      <Section title={t('newsletters.sections.contents', 'Contents')}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#0d0e0e] mb-1">
              {t('newsletters.fields.internalName', 'Internal name')} <span className="text-red-500">*</span>
            </label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0d0e0e] mb-1">
              {t('newsletters.fields.subject', 'Subject')} <span className="text-red-500">*</span>
            </label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            <p className="text-xs text-gray-500 mt-1">
              {t('newsletters.fields.subjectHint', "The text that appears in the email's subject line")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0d0e0e] mb-1">
              {t('newsletters.fields.body', 'Text')} <span className="text-red-500">*</span>
            </label>
            <RichTextEditor content={body} onChange={setBody} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0d0e0e] mb-1">
              {t('newsletters.fields.format', 'Text format')}
            </label>
            <select
              value={bodyFormat}
              onChange={(e) => setBodyFormat(e.target.value as NewsletterBodyFormat)}
              className="w-full sm:w-72 border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
            >
              {TEXT_FORMATS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey, opt.fallback)}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {t(
                'newsletters.fields.formatHint',
                'The text of the email. The header and footer are added automatically.'
              )}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0d0e0e] mb-1">
              {t('newsletters.fields.smsText', 'SMS text')}
            </label>
            <Textarea
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              rows={3}
              placeholder=""
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('newsletters.fields.smsHint', 'Any text for SMS. Keep it short!')}
            </p>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="nl-use-as-template"
              checked={useAsTemplate}
              onChange={(e) => setUseAsTemplate(e.target.checked)}
            />
            <label htmlFor="nl-use-as-template" className="text-sm text-gray-700">
              <div className="font-semibold text-[#0d0e0e]">
                {t('newsletters.fields.useAsTemplate', 'Use as a template')}
              </div>
              <div className="text-xs text-gray-500">
                {t(
                  'newsletters.fields.useAsTemplateHint',
                  'Check if this email should be used as a template for new emails.'
                )}
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0d0e0e] mb-1">
              {t('newsletters.fields.category', 'Mail category')}
            </label>
            <select
              value={mailCategoryTid ?? ''}
              onChange={(e) =>
                setMailCategoryTid(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full sm:w-72 border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
            >
              <option value="">
                {t('newsletters.category.none', '– Select –')}
              </option>
              {categories.map((c) => (
                <option key={c.tid} value={c.tid}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {t(
                'newsletters.fields.categoryHint',
                'Place the email or template in an appropriate category.'
              )}
            </p>
          </div>
        </div>
      </Section>

      {/* Dates */}
      <Section title={t('newsletters.sections.dates', 'Dates')}>
        <div className="space-y-5">
          <div className="flex items-start gap-2">
            <Checkbox
              id="nl-do-not-send"
              checked={doNotSend}
              onChange={(e) => setDoNotSend(e.target.checked)}
            />
            <label htmlFor="nl-do-not-send" className="text-sm text-gray-700">
              <div className="font-semibold text-[#0d0e0e]">
                {t('newsletters.fields.doNotSend', 'Do not send')}
              </div>
              <div className="text-xs text-gray-500">
                {t(
                  'newsletters.fields.doNotSendHint',
                  'Check to block sending the email to regular users regardless of other settings.'
                )}
              </div>
            </label>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="nl-send-mode"
                checked={sendMode === 'scheduled'}
                onChange={() => setSendMode('scheduled')}
              />
              <span className="font-semibold text-[#0d0e0e]">
                {t('newsletters.fields.broadcastOn', 'Broadcast on')}
              </span>
            </label>

            {sendMode === 'scheduled' && (
              <div className="flex flex-col sm:flex-row gap-2 pl-6 max-w-md">
                <Input
                  type="date"
                  value={broadcastDate}
                  onChange={(e) => setBroadcastDate(e.target.value)}
                />
                <Input
                  type="time"
                  step={1}
                  value={broadcastTime}
                  onChange={(e) => setBroadcastTime(e.target.value)}
                />
              </div>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="nl-send-mode"
                checked={sendMode === 'immediately'}
                onChange={() => setSendMode('immediately')}
              />
              <span className="font-semibold text-[#0d0e0e]">
                {t('newsletters.fields.sendImmediately', 'Send immediately')}
              </span>
            </label>

            <p className="text-xs text-gray-500 pl-6">
              {t(
                'newsletters.fields.scheduleHint',
                'Time of sending. Default is immediately when the email is saved.'
              )}
            </p>
          </div>

          {detail?.sentAt != null && (
            <div className="text-xs text-gray-500">
              {t('newsletters.fields.wasSent', 'Was sent')}:{' '}
              {new Date(detail.sentAt * 1000).toLocaleString()}
            </div>
          )}
        </div>
      </Section>

      {/* Recipients */}
      <Section title={t('newsletters.sections.recipients', 'Recipients')}>
        <div className="space-y-5">
          <div className="flex items-start gap-2">
            <Checkbox
              id="nl-only-test"
              checked={onlyTest}
              onChange={(e) => setOnlyTest(e.target.checked)}
            />
            <label htmlFor="nl-only-test" className="text-sm text-gray-700">
              <div className="font-semibold text-[#0d0e0e]">
                {t('newsletters.fields.onlyTest', 'Only send as test')}
              </div>
              <div className="text-xs text-gray-500">
                {t(
                  'newsletters.fields.onlyTestHint',
                  'Deliver only to the test addresses below — skip real recipients.'
                )}
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0d0e0e] mb-1">
              {t('newsletters.fields.testAddresses', 'Test addresses')}
            </label>
            <Input
              value={testAddressesRaw}
              onChange={(e) => setTestAddressesRaw(e.target.value)}
              placeholder="name@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('newsletters.fields.csvHint', 'Enter email addresses separated by commas.')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0d0e0e] mb-1">
              {t('newsletters.fields.manualReceivers', 'Manual receivers')}
            </label>
            <Input
              value={manualReceiversRaw}
              onChange={(e) => setManualReceiversRaw(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('newsletters.fields.manualReceiversHint', 'Write the email addresses separated by commas.')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0d0e0e] mb-1">
              {t('newsletters.fields.business', 'Business')}
            </label>
            <Input
              value={businessNidRaw}
              onChange={(e) => setBusinessNidRaw(e.target.value.replace(/[^\d]/g, ''))}
              placeholder={t('newsletters.fields.businessPlaceholder', 'Company ID')}
              inputMode="numeric"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t(
                'newsletters.fields.businessHint',
                'The email is linked to a specific company and is registered in CRM under this company.'
              )}
            </p>
          </div>
        </div>
      </Section>

      {/* Language */}
      <Section title={t('newsletters.sections.language', 'Language')}>
        <div>
          <label className="block text-sm font-semibold text-[#0d0e0e] mb-1">
            {t('newsletters.fields.language', 'Language')}
          </label>
          <select
            value={langcode}
            onChange={(e) => setLangcode(e.target.value)}
            className="w-full sm:w-72 border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </Section>

      {/* Status */}
      <div className="border border-gray-200 rounded-xl bg-white p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-[#0d0e0e] mb-4">
          {t('newsletters.sections.status', 'Status & Info')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div className="text-gray-500">{t('newsletters.fields.statusLabel', 'Status')}</div>
          <div>
            <span
              className={
                published
                  ? 'inline-block text-xs font-medium px-2.5 py-0.5 rounded border bg-green-50 text-green-700 border-green-200'
                  : 'inline-block text-xs font-medium px-2.5 py-0.5 rounded border bg-gray-50 text-gray-600 border-gray-200'
              }
            >
              {published
                ? t('newsletters.status.published', 'Published')
                : t('newsletters.status.notPublished', 'Not Published')}
            </span>
          </div>

          <div className="text-gray-500">{t('newsletters.fields.lastSaved', 'Last saved')}</div>
          <div className="text-gray-700">
            {detail?.changed
              ? new Date(detail.changed * 1000).toLocaleString()
              : t('newsletters.status.notSavedYet', 'Not saved yet')}
          </div>

          <div className="text-gray-500">{t('newsletters.fields.author', 'Author')}</div>
          <div className="text-gray-700">
            {detail?.authorName ?? t('newsletters.status.noAuthor', '—')}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 pt-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="nl-published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          <label htmlFor="nl-published" className="text-sm font-semibold text-[#0d0e0e]">
            {t('newsletters.fields.published', 'Published')}
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(adminRoutes.newsletters)}
            disabled={saving}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90"
          >
            {saving
              ? t('common.saving', 'Saving…')
              : t('newsletters.editor.save', 'Save Activity')}
          </Button>
        </div>
      </div>
    </div>
  );
};
