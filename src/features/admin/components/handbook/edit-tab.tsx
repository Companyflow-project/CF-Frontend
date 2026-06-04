import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { axiosClient } from '@/lib/axios-client';
import { toast } from 'sonner';
import {
  useAdminHandbookPage,
  useAdminHandbookVocabulary,
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

const FORMAT_OPTIONS = [
  { value: 'basic_html', labelKey: 'handbook.edit.simpleHtml', fallback: 'Simple HTML' },
  { value: 'full_html', labelKey: 'handbook.edit.fullHtml', fallback: 'Full HTML' },
  { value: 'plain_text', labelKey: 'handbook.edit.plainText', fallback: 'Plain text' },
] as const;

const PICTURE_PLACEMENT_OPTIONS = ['right', 'left', 'before', 'after', 'hide', 'none'] as const;

function parseIdList(raw: string): number[] {
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function parseStringList(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

const FormatSelector: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const { t } = useTranslation('admin');
  return (
    <div className="mt-2">
      <label className="text-xs text-gray-500 block mb-1">
        {t('handbook.edit.textFormat', 'Text format')}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full sm:max-w-xs border border-gray-200 rounded-md px-3 py-1.5 text-sm bg-white"
      >
        {FORMAT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{t(opt.labelKey, opt.fallback)}</option>
        ))}
      </select>
    </div>
  );
};

const FieldLabel: React.FC<{ children: React.ReactNode; required?: boolean; hint?: string }> = ({ children, required, hint }) => (
  <div className="space-y-0.5">
    <label className="text-sm font-medium text-[#0d0e0e] block">
      {children}{required && <span className="text-red-500"> *</span>}
    </label>
    {hint && <div className="text-xs text-gray-500">{hint}</div>}
  </div>
);

export const AdminHandbookEditTab: React.FC<Props> = ({ nid, langcode }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('admin');
  const { data: page, isLoading } = useAdminHandbookPage(nid, langcode);
  const updatePage = useUpdateAdminHandbookPage();
  const deletePage = useDeleteAdminHandbookPage();

  // Vocabulary fetches (only loaded once they're needed by an open accordion)
  const { data: productTerms = [] } = useAdminHandbookVocabulary('product_category');
  const { data: themeTerms = [] } = useAdminHandbookVocabulary('theme');
  const { data: employmentTypeTerms = [] } = useAdminHandbookVocabulary('employment_type');

  // Title + body
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [bodyFormat, setBodyFormat] = useState('basic_html');
  // Multi-value: admins can add several default-text options the company picks
  // between (rendered as a "+ Add another text" repeater). Stored as one row
  // per delta in node__field_handbook_note on the backend.
  const [handbookNote, setHandbookNote] = useState<string[]>(['']);

  // Choice
  const [updatedDate, setUpdatedDate] = useState<string>('');
  const [includeByDefault, setIncludeByDefault] = useState(false);
  const [optOutWarning, setOptOutWarning] = useState(false);
  const [endHerePageNid, setEndHerePageNid] = useState<number | null>(null);
  const [requiredProductTid, setRequiredProductTid] = useState<number | null>(null);
  const [areasOfResponsibility, setAreasOfResponsibility] = useState<number[]>([]);

  // Help and inspiration
  const [helpText, setHelpText] = useState('');
  const [helpTextFormat, setHelpTextFormat] = useState('basic_html');
  const [inspirationalText, setInspirationalText] = useState('');
  const [inspirationalTextFormat, setInspirationalTextFormat] = useState('basic_html');
  const [helpTextForm, setHelpTextForm] = useState('');
  const [helpTextFormFormat, setHelpTextFormFormat] = useState('basic_html');
  const [introText, setIntroText] = useState('');
  const [managementHandbookPagesRaw, setManagementHandbookPagesRaw] = useState('');

  // Visual
  const [picturePlacement, setPicturePlacement] = useState('right');
  const [heroImageFid, setHeroImageFid] = useState<number | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [heroImageName, setHeroImageName] = useState<string>('');
  const [heroUploading, setHeroUploading] = useState(false);
  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const [attachedDocsRaw, setAttachedDocsRaw] = useState('');
  const [videosRaw, setVideosRaw] = useState('');

  // Technical
  const [smartLinksRaw, setSmartLinksRaw] = useState('');
  const [sop, setSop] = useState('');
  const [businessTypeTid, setBusinessTypeTid] = useState<number | null>(null);
  const [departmentsRaw, setDepartmentsRaw] = useState('');
  const [employmentTypeTids, setEmploymentTypeTids] = useState<number[]>([]);
  const [archivedFlag, setArchivedFlag] = useState(0);
  const [archivedTime, setArchivedTime] = useState('');
  const [machineTranslated, setMachineTranslated] = useState('');
  const [contactsRaw, setContactsRaw] = useState('');
  const [outroBody, setOutroBody] = useState('');
  const [outroBodyFormat, setOutroBodyFormat] = useState('basic_html');
  const [placeInMgmt, setPlaceInMgmt] = useState(false);
  const [machineTranslatedLangsRaw, setMachineTranslatedLangsRaw] = useState('');

  // Status / publish
  const [status, setStatus] = useState(true);
  const [sviValue, setSviValue] = useState<StatusVersionInfoValue>(() => defaultStatusVersionInfoValue(''));

  useEffect(() => {
    if (!page) return;
    setTitle(page.title);
    setBody(page.body);
    setBodyFormat(page.bodyFormat || 'basic_html');
    // Empty list → keep one blank textarea so admins see a place to type.
    setHandbookNote(page.handbookNote && page.handbookNote.length > 0 ? page.handbookNote : ['']);
    setStatus(page.status === 1);

    setUpdatedDate(page.updatedDate ?? '');
    setIncludeByDefault(page.includeByDefault);
    setOptOutWarning(page.optOutWarning);
    setEndHerePageNid(page.endHerePageNid);
    setRequiredProductTid(page.requiredProductTid);
    setAreasOfResponsibility(page.areasOfResponsibility);

    setHelpText(page.helpText);
    setHelpTextFormat(page.helpTextFormat || 'basic_html');
    setInspirationalText(page.inspirationalText);
    setInspirationalTextFormat(page.inspirationalTextFormat || 'basic_html');
    setHelpTextForm(page.helpTextForm);
    setHelpTextFormFormat(page.helpTextFormFormat || 'basic_html');
    setIntroText(page.introText);
    setManagementHandbookPagesRaw(page.managementHandbookPageNids.join(', '));

    setPicturePlacement(page.picturePlacement || 'right');
    setHeroImageFid(page.heroImageFid);
    setHeroImageUrl(page.heroImageUrl);
    setHeroImageName(page.heroImageUrl ? page.heroImageUrl.split('/').pop() ?? '' : '');
    setAttachedDocsRaw(page.attachedDocumentFids.join(', '));
    setVideosRaw(page.videos.join('\n'));

    setSmartLinksRaw(page.smartLinkPageNids.join(', '));
    setSop(page.sop);
    setBusinessTypeTid(page.businessTypeTid);
    setDepartmentsRaw(page.departmentNids.join(', '));
    setEmploymentTypeTids(page.employmentTypeTids);
    setArchivedFlag(page.archivedFlag);
    setArchivedTime(page.archivedTime);
    setMachineTranslated(page.machineTranslated);
    setContactsRaw(page.contactNids.join(', '));
    setOutroBody(page.outroBody);
    setOutroBodyFormat(page.outroBodyFormat || 'basic_html');
    setPlaceInMgmt(page.placeInManagementHandbook);
    setMachineTranslatedLangsRaw(page.machineTranslatedLangs.join('\n'));

    if (page.authorName) {
      setSviValue((prev) => ({
        ...prev,
        writtenBy: `By ${page.authorName}, ${new Date(page.changed * 1000).toISOString().slice(0, 10)}`,
      }));
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
          handbookNote: handbookNote.map((s) => s.trim()).filter((s) => s.length > 0),
          status,

          updatedDate: updatedDate === '' ? null : updatedDate,
          includeByDefault,
          optOutWarning,
          endHerePageNid,
          requiredProductTid,
          areasOfResponsibility,

          helpText,
          helpTextFormat,
          inspirationalText,
          inspirationalTextFormat,
          helpTextForm,
          helpTextFormFormat,
          introText,
          managementHandbookPageNids: parseIdList(managementHandbookPagesRaw),

          picturePlacement,
          heroImageFid,
          attachedDocumentFids: parseIdList(attachedDocsRaw),
          videos: parseStringList(videosRaw),

          smartLinkPageNids: parseIdList(smartLinksRaw),
          sop,
          businessTypeTid,
          departmentNids: parseIdList(departmentsRaw),
          employmentTypeTids,
          archivedFlag,
          archivedTime,
          machineTranslated,
          contactNids: parseIdList(contactsRaw),
          outroBody,
          outroBodyFormat,
          placeInManagementHandbook: placeInMgmt,
          machineTranslatedLangs: parseStringList(machineTranslatedLangsRaw),
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
      navigate(adminRoutes.books);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('handbook.edit.deleteFailed', 'Failed to delete page'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6 min-w-0">
        {/* Title */}
        <div>
          <FieldLabel required>{t('handbook.edit.title', 'Title')}</FieldLabel>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
        </div>

        {/* Body */}
        <div>
          <FieldLabel>{t('handbook.edit.bodyText', 'Body text (Body text)')}</FieldLabel>
          <div className="border border-gray-200 rounded-lg overflow-hidden mt-1">
            <RichTextEditor content={body} onChange={setBody} className="min-h-[200px]" />
          </div>
          <FormatSelector value={bodyFormat} onChange={setBodyFormat} />
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

        {/* Handbook note — multi-value: admins author N default-text options
            the company will pick between. */}
        <div>
          <FieldLabel hint={t('handbook.edit.notesHint', 'Enter any notes that the company can choose from for this page.')}>
            {t('handbook.edit.companyNotes', 'Notes for company')}
          </FieldLabel>
          <div className="mt-1 space-y-2">
            {handbookNote.map((value, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Textarea
                  value={value}
                  onChange={(e) =>
                    setHandbookNote((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))
                  }
                  rows={3}
                  className="flex-1"
                />
                {handbookNote.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 mt-1"
                    onClick={() =>
                      setHandbookNote((prev) => prev.filter((_, i) => i !== idx))
                    }
                    aria-label={t('handbook.edit.removeText', 'Remove text')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 text-[#1a8a5a] border-[#1a8a5a]/40 hover:bg-[#1a8a5a]/10"
            onClick={() => setHandbookNote((prev) => [...prev, ''])}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t('handbook.edit.addAnotherText', 'Add another text')}
          </Button>
        </div>

        <Accordion type="multiple" defaultValue={['choice']}>
          {/* Choice */}
          <AccordionItem value="choice">
            <AccordionTrigger className="text-base font-semibold text-[#0d0e0e]">
              {t('handbook.edit.choiceSection', 'Choice')}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-5 pt-2">
                <div>
                  <FieldLabel hint={t('handbook.edit.updatedHint', 'Mark this page as updated up to this date. Empty or older than dd means no marking.')}>
                    {t('handbook.edit.updated', 'Updated')}
                  </FieldLabel>
                  <Input
                    type="date"
                    value={updatedDate}
                    onChange={(e) => setUpdatedDate(e.target.value)}
                    className="mt-1 max-w-xs"
                  />
                </div>

                <label className="flex items-start gap-2">
                  <Checkbox checked={includeByDefault} onChange={(e) => setIncludeByDefault(e.target.checked)} />
                  <span>
                    <div className="text-sm font-medium text-[#0d0e0e]">
                      {t('handbook.edit.includeByDefault', 'Include by default')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t('handbook.edit.includeByDefaultHint', 'Included in new companies, but can be de-selected later.')}
                    </div>
                  </span>
                </label>

                <label className="flex items-start gap-2">
                  <Checkbox checked={optOutWarning} onChange={(e) => setOptOutWarning(e.target.checked)} />
                  <span>
                    <div className="text-sm font-medium text-[#0d0e0e]">
                      {t('handbook.edit.optOutWarning', 'Opt-out warning')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t('handbook.edit.optOutWarningHint', 'We recommend that the page is included.')}
                    </div>
                  </span>
                </label>

                <div>
                  <FieldLabel hint={t('handbook.edit.endHereHint', 'Show the above ending after this page. Leave blank to skip directly to the next theme.')}>
                    {t('handbook.edit.endHere', 'End here')}
                  </FieldLabel>
                  <Input
                    type="number"
                    value={endHerePageNid ?? ''}
                    onChange={(e) => setEndHerePageNid(e.target.value ? Number(e.target.value) : null)}
                    placeholder={t('handbook.edit.nothingSelected', 'Nothing selected')}
                    className="mt-1 max-w-xs"
                  />
                </div>

                <div>
                  <FieldLabel required hint={t('handbook.edit.requiredProductHint', 'Select which product is required to access the page.')}>
                    {t('handbook.edit.requiredProduct', 'Required product')}
                  </FieldLabel>
                  <select
                    value={requiredProductTid ?? ''}
                    onChange={(e) => setRequiredProductTid(e.target.value ? Number(e.target.value) : null)}
                    className="mt-1 w-full max-w-xs border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
                  >
                    <option value="">{t('handbook.edit.nothingSelected', 'Nothing selected')}</option>
                    {productTerms.map((opt) => (
                      <option key={opt.tid} value={opt.tid}>{opt.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>{t('handbook.edit.areasOfResponsibility', 'Areas of responsibility')}</FieldLabel>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {themeTerms.map((opt) => {
                      const checked = areasOfResponsibility.includes(opt.tid);
                      return (
                        <label key={opt.tid} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onChange={() => setAreasOfResponsibility((prev) => toggleInArray(prev, opt.tid))}
                          />
                          <span>{opt.name}</span>
                        </label>
                      );
                    })}
                    {themeTerms.length === 0 && (
                      <div className="text-xs text-gray-500">{t('handbook.edit.noOptions', 'No options')}</div>
                    )}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Help and inspiration */}
          <AccordionItem value="help-and-inspiration">
            <AccordionTrigger className="text-base font-semibold text-[#0d0e0e]">
              {t('handbook.edit.helpInspirationSection', 'Help and inspiration')}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-5 pt-2">
                <div>
                  <FieldLabel hint={t('handbook.edit.helpTextHint', 'Appears when the page is edited or when choosing between option texts.')}>
                    {t('handbook.edit.helpTextForContent', 'Help text for content')}
                  </FieldLabel>
                  <div className="border border-gray-200 rounded-lg overflow-hidden mt-1">
                    <RichTextEditor content={helpText} onChange={setHelpText} className="min-h-[140px]" />
                  </div>
                  <FormatSelector value={helpTextFormat} onChange={setHelpTextFormat} />
                </div>

                <div>
                  <FieldLabel>{t('handbook.edit.inspirationalText', 'Inspirational text')}</FieldLabel>
                  <div className="border border-gray-200 rounded-lg overflow-hidden mt-1">
                    <RichTextEditor content={inspirationalText} onChange={setInspirationalText} className="min-h-[140px]" />
                  </div>
                  <FormatSelector value={inspirationalTextFormat} onChange={setInspirationalTextFormat} />
                </div>

                <div>
                  <FieldLabel hint={t('handbook.edit.helpTextFormHint', 'Appears on the help page for the company form, and tells how to use the page, and possibly why it can/cannot be selected on/off.')}>
                    {t('handbook.edit.helpTextForForm', 'Help text for company form')}
                  </FieldLabel>
                  <div className="border border-gray-200 rounded-lg overflow-hidden mt-1">
                    <RichTextEditor content={helpTextForm} onChange={setHelpTextForm} className="min-h-[140px]" />
                  </div>
                  <FormatSelector value={helpTextFormFormat} onChange={setHelpTextFormFormat} />
                </div>

                <div>
                  <FieldLabel hint={t('handbook.edit.introTextHint', 'Text to be displayed in the intro section of the handbook form. Only appears there, and should only be entered on pages used there.')}>
                    {t('handbook.edit.introText', 'Text for intro form')}
                  </FieldLabel>
                  <Textarea value={introText} onChange={(e) => setIntroText(e.target.value)} rows={3} className="mt-1" />
                </div>

                <div>
                  <FieldLabel hint={t('handbook.edit.managementHandbookHint', 'If necessary, select the page(s) that are relevant in the management handbook. Comma-separated page IDs.')}>
                    {t('handbook.edit.managementHandbook', 'Management Handbook')}
                  </FieldLabel>
                  <Input
                    value={managementHandbookPagesRaw}
                    onChange={(e) => setManagementHandbookPagesRaw(e.target.value)}
                    placeholder="60384, 60385, …"
                    className="mt-1"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Visual elements and files */}
          <AccordionItem value="visual">
            <AccordionTrigger className="text-base font-semibold text-[#0d0e0e]">
              {t('handbook.edit.visualSection', 'Visual elements and files')}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-5 pt-2">
                <div>
                  <FieldLabel hint={t('handbook.edit.imagePlacementHint', 'Choose where the images should be placed in relation to the text.')}>
                    {t('handbook.edit.imagePlacement', 'Image placement')}
                  </FieldLabel>
                  <select
                    value={picturePlacement}
                    onChange={(e) => setPicturePlacement(e.target.value)}
                    className="mt-1 w-full max-w-xs border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
                  >
                    {PICTURE_PLACEMENT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{t(`handbook.edit.placement.${opt}`, opt)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel hint={t('handbook.edit.heroHint', 'Image displayed in the page header. Allowed: png, gif, jpg, jpeg.')}>
                    {t('handbook.edit.heroImage', 'Image(s)')}
                  </FieldLabel>
                  <div className="flex items-center gap-3 mt-1">
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
                </div>

                <div>
                  <FieldLabel hint={t('handbook.edit.attachedDocsHint', 'Downloadable documents — comma-separated file IDs.')}>
                    {t('handbook.edit.attachedDocs', 'Attached documents')}
                  </FieldLabel>
                  <Input
                    value={attachedDocsRaw}
                    onChange={(e) => setAttachedDocsRaw(e.target.value)}
                    placeholder="1234, 1235, …"
                    className="mt-1"
                  />
                </div>

                <div>
                  <FieldLabel hint={t('handbook.edit.videosHint', 'Any video to be displayed alongside or instead of text. One URL per line.')}>
                    {t('handbook.edit.videos', 'Videos')}
                  </FieldLabel>
                  <Textarea
                    value={videosRaw}
                    onChange={(e) => setVideosRaw(e.target.value)}
                    rows={3}
                    className="mt-1 font-mono text-xs"
                    placeholder="https://www.youtube.com/watch?v=…"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Technical fields */}
          <AccordionItem value="technical">
            <AccordionTrigger className="text-base font-semibold text-[#0d0e0e]">
              {t('handbook.edit.technicalSection', 'Technical fields')}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-5 pt-2">
                <div>
                  <FieldLabel hint={t('handbook.edit.smartLinkHint', 'Optional smart link(s) shown if the text is a help text. Comma-separated page IDs.')}>
                    {t('handbook.edit.smartLink', 'Smart link')}
                  </FieldLabel>
                  <Input value={smartLinksRaw} onChange={(e) => setSmartLinksRaw(e.target.value)} className="mt-1" />
                </div>

                <div>
                  <FieldLabel hint={t('handbook.edit.sopHint', 'Turn on SOP features for this page/book. Type sop for general use. Leave blank for none.')}>
                    {t('handbook.edit.sop', 'SOP')}
                  </FieldLabel>
                  <Input value={sop} onChange={(e) => setSop(e.target.value)} className="mt-1 max-w-xs" />
                </div>

                <div>
                  <FieldLabel>{t('handbook.edit.business', 'Business')}</FieldLabel>
                  <Input
                    type="number"
                    value={businessTypeTid ?? ''}
                    onChange={(e) => setBusinessTypeTid(e.target.value ? Number(e.target.value) : null)}
                    placeholder={t('handbook.edit.nothingSelected', 'Nothing selected')}
                    className="mt-1 max-w-xs"
                  />
                </div>

                <div>
                  <FieldLabel hint={t('handbook.edit.departmentsHint', 'Comma-separated department node IDs.')}>
                    {t('handbook.edit.departments', 'Departments')}
                  </FieldLabel>
                  <Input value={departmentsRaw} onChange={(e) => setDepartmentsRaw(e.target.value)} className="mt-1" />
                </div>

                <div>
                  <FieldLabel hint={t('handbook.edit.employmentTypeHint', 'Specify which employment types this page is aimed at. No check mark means that all employment types see the page.')}>
                    {t('handbook.edit.employmentType', 'Employment type')}
                  </FieldLabel>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {employmentTypeTerms.map((opt) => {
                      const checked = employmentTypeTids.includes(opt.tid);
                      return (
                        <label key={opt.tid} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onChange={() => setEmploymentTypeTids((prev) => toggleInArray(prev, opt.tid))}
                          />
                          <span>{opt.name}</span>
                        </label>
                      );
                    })}
                    {employmentTypeTerms.length === 0 && (
                      <div className="text-xs text-gray-500">{t('handbook.edit.noOptions', 'No options')}</div>
                    )}
                  </div>
                </div>

                <div>
                  <FieldLabel hint={t('handbook.edit.archivedHint', 'Timestamp for archived page. Empty or 0 for unarchived, UNIX timestamp for archived.')}>
                    {t('handbook.edit.archived', 'Archived')}
                  </FieldLabel>
                  <Input
                    type="number"
                    value={archivedFlag || ''}
                    onChange={(e) => setArchivedFlag(e.target.value ? Number(e.target.value) : 0)}
                    placeholder="0"
                    className="mt-1 max-w-xs"
                  />
                </div>

                <div>
                  <FieldLabel hint={t('handbook.edit.archivedTimeHint', 'Set if the book is archived and can no longer be edited. (free text)')}>
                    {t('handbook.edit.archivedTime', 'Archived (date/time)')}
                  </FieldLabel>
                  <Input
                    value={archivedTime}
                    onChange={(e) => setArchivedTime(e.target.value)}
                    placeholder="YYYY-MM-DD HH:MM:SS"
                    className="mt-1 max-w-sm"
                  />
                </div>

                <div>
                  <FieldLabel hint={t('handbook.edit.machineTranslatedHint', 'JSON code for the languages that are machine translated.')}>
                    {t('handbook.edit.machineTranslated', 'Machine translated')}
                  </FieldLabel>
                  <Textarea
                    value={machineTranslated}
                    onChange={(e) => setMachineTranslated(e.target.value)}
                    rows={3}
                    className="mt-1 font-mono text-xs"
                  />
                </div>

                <div>
                  <FieldLabel hint={t('handbook.edit.contactsHint', 'Comma-separated contact node IDs.')}>
                    {t('handbook.edit.contacts', 'Contacts')}
                  </FieldLabel>
                  <Input value={contactsRaw} onChange={(e) => setContactsRaw(e.target.value)} className="mt-1" />
                </div>

                <div>
                  <FieldLabel>{t('handbook.edit.outroBody', 'Body text (Edit intro)')}</FieldLabel>
                  <div className="border border-gray-200 rounded-lg overflow-hidden mt-1">
                    <RichTextEditor content={outroBody} onChange={setOutroBody} className="min-h-[140px]" />
                  </div>
                  <FormatSelector value={outroBodyFormat} onChange={setOutroBodyFormat} />
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <FieldLabel>{t('handbook.edit.categoriesSection', 'Categories')}</FieldLabel>
                  <label className="flex items-start gap-2 mt-2">
                    <Checkbox checked={placeInMgmt} onChange={(e) => setPlaceInMgmt(e.target.checked)} />
                    <span>
                      <div className="text-sm font-medium text-[#0d0e0e]">
                        {t('handbook.edit.placeInMgmt', 'Place in management handbook')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t('handbook.edit.placeInMgmtHint', 'Place in management section. Only used in the management handbook.')}
                      </div>
                    </span>
                  </label>
                </div>

                <div>
                  <FieldLabel hint={t('handbook.edit.translatedLangsHint', 'Machine translated languages on this page. One langcode per line (da, en, bg).')}>
                    {t('handbook.edit.translatedLangs', 'Machine translated languages on this page')}
                  </FieldLabel>
                  <Textarea
                    value={machineTranslatedLangsRaw}
                    onChange={(e) => setMachineTranslatedLangsRaw(e.target.value)}
                    rows={3}
                    className="mt-1 font-mono text-xs"
                    placeholder={'da\nen\nbg'}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Status & Version Info */}
        <StatusVersionInfoCard
          value={sviValue}
          onChange={setSviValue}
          published={status}
          authorDisplay={page.authorName || '—'}
          lastSavedLabel={page.changed ? new Date(page.changed * 1000).toISOString().slice(0, 10) : undefined}
        />

        {/* Bottom action row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-100 pt-4">
          <label className="flex items-center gap-2">
            <Checkbox checked={status} onChange={(e) => setStatus(e.target.checked)} />
            <span className="text-sm font-medium text-[#0d0e0e]">
              {t('handbook.common.published', 'Published')}
            </span>
          </label>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(adminRoutes.books)}>
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
    </div>
  );
};
