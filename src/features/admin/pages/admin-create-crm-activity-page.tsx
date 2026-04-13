import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Video,
  Mail,
  Phone,
  FileText,
  Users as UsersIcon,
  Linkedin,
  Cog,
  Calendar,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateCrmActivity,
  useCrmTaxonomy,
  useCrmUsers,
  useAdminCompanies,
} from '../hooks';
import { adminRoutes } from '../routes';
import { useAuth } from '@/features/auth/hooks';
import type { CreateCrmActivityPayload } from '../types';

// -------- Static taxonomy (fallback labels + icon mapping) --------
const STATUS_OPTIONS = [
  { key: 'planned', label: 'Planned' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'awaiting', label: 'Awaiting' },
  { key: 'on_break', label: 'On break' },
  { key: 'done', label: 'Done' },
] as const;

const TYPE_OPTIONS: Array<{
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }> | null;
}> = [
  { key: 'not_determined', label: 'Not determined', icon: FileText },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { key: 'editorial', label: 'Editorial', icon: FileText },
  { key: 'telephone', label: 'Telephone', icon: Phone },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'physical_meeting', label: 'Physical meeting', icon: UsersIcon },
  { key: 'online_meeting', label: 'Online meeting', icon: Video },
  { key: 'automatic', label: 'Automatic', icon: Cog },
];

const FOLLOWUP_OPTIONS = [
  { key: 'not_specified', label: 'Not specified', days: null as number | null },
  { key: 'tomorrow', label: 'Tomorrow', days: 1 },
  { key: 'next_week', label: 'Next week', days: 7 },
  { key: 'in_two_weeks', label: 'In two weeks', days: 14 },
  { key: 'in_a_month', label: 'In a month', days: 30 },
] as const;

const MAIL_STATUS_OPTIONS = [
  { value: '', label: 'Select status...' },
  { value: 'not_sent', label: 'Not sent' },
  { value: 'sent', label: 'Sent' },
  { value: 'opened', label: 'Opened' },
  { value: 'clicked', label: 'Clicked' },
  { value: 'bounced', label: 'Bounced' },
];

// -------- Helpers --------
function normalizeKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function useDebounced<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(h);
  }, [value, delayMs]);
  return debounced;
}

// -------- Small UI primitives --------
function Pill({
  active,
  children,
  onClick,
  variant = 'default',
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'green' | 'dark';
}) {
  const base =
    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm border transition-colors';
  const styles = active
    ? variant === 'green'
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-[#0d0e0e] text-white border-[#0d0e0e]'
    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50';
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

function UserPill({
  name,
  color,
  active,
  onClick,
}: {
  name: string;
  color: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 pr-3 pl-1 py-1 rounded-full border text-xs sm:text-sm transition-colors ${
        active
          ? 'bg-pink-50 border-pink-300 text-pink-900'
          : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
      }`}
    >
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
        style={{ backgroundColor: color }}
      >
        {initials}
      </span>
      <span className="truncate max-w-[140px]">{name}</span>
    </button>
  );
}

function SectionCard({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-[#0d0e0e]">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

// -------- Main page --------
export const AdminCreateCrmActivityPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form state
  const [title, setTitle] = useState('');
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const debouncedCompanySearch = useDebounced(companySearch, 300);

  const [statusKey, setStatusKey] = useState<string>('in_progress');
  const [typeKey, setTypeKey] = useState<string>('not_determined');
  const [responsibleUid, setResponsibleUid] = useState<number | null>(null);
  const [followedByUid, setFollowedByUid] = useState<number | null>(null);

  const [body, setBody] = useState('');
  const [sendMessageToResponsible, setSendMessageToResponsible] = useState(false);
  const [followupKey, setFollowupKey] = useState<string>('not_specified');
  const [fupDate, setFupDate] = useState<string>('');
  const [followupNote, setFollowupNote] = useState('');

  const [mailStatus, setMailStatus] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const [published, setPublished] = useState(true);

  // Data
  const taxonomyQuery = useCrmTaxonomy();
  const usersQuery = useCrmUsers();
  const companiesQuery = useAdminCompanies({
    search: debouncedCompanySearch,
    limit: 20,
  });
  const createMutation = useCreateCrmActivity();

  const companyResults = companiesQuery.data?.data ?? [];

  // Taxonomy lookups
  const statusTid = useMemo(() => {
    const statuses = taxonomyQuery.data?.statuses ?? [];
    const match = statuses.find((s) => normalizeKey(s.name) === statusKey);
    return match?.tid;
  }, [taxonomyQuery.data, statusKey]);

  const typeTid = useMemo(() => {
    const types = taxonomyQuery.data?.types ?? [];
    const match = types.find((s) => normalizeKey(s.name) === typeKey);
    return match?.tid;
  }, [taxonomyQuery.data, typeKey]);

  // Handle followup key changes -> set fupDate
  const handleFollowupKey = (key: string) => {
    setFollowupKey(key);
    const opt = FOLLOWUP_OPTIONS.find((o) => o.key === key);
    if (opt && opt.days !== null) {
      const d = new Date();
      d.setDate(d.getDate() + opt.days);
      setFupDate(formatDate(d));
    } else if (key === 'not_specified') {
      setFupDate('');
    }
  };

  // File upload handlers
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit
  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error(t('crmCreate.errors.titleRequired', 'Activity title is required'));
      return;
    }
    if (!companyId) {
      toast.error(t('crmCreate.errors.businessRequired', 'Please select a business'));
      return;
    }

    const payload: CreateCrmActivityPayload = {
      title: title.trim(),
      companyId,
      statusTid,
      typeTid,
      responsibleUid: responsibleUid ?? undefined,
      body: body.trim() ? `<p>${body.trim()}</p>` : undefined,
      fupDate: fupDate || undefined,
      published,
    };

    try {
      await createMutation.mutateAsync(payload as unknown as Record<string, unknown>);
      toast.success(t('crmCreate.success', 'Activity created successfully'));
      navigate('/admin/crm');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(t('crmCreate.errors.saveFailed', 'Failed to save activity: {{message}}', { message }));
    }
  };

  const handleCancel = () => {
    navigate('/admin/crm');
  };

  const saving = createMutation.isPending;
  const users = usersQuery.data ?? [];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb + Title */}
      <div>
        <div className="text-sm text-gray-500">
          <Link to={adminRoutes.dashboard} className="hover:underline">
            {t('crmCreate.breadcrumb.console', 'Console')}
          </Link>
          {' › '}
          <Link to={adminRoutes.crm} className="hover:underline">
            {t('crmCreate.breadcrumb.activities', 'Activities')}
          </Link>
          {' › '}
          <span className="text-gray-700">
            {t('crmCreate.breadcrumb.create', 'Create Activity')}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">
          {t('crmCreate.title', 'Create CRM Activity')}
        </h1>
      </div>

      {/* Activity Details */}
      <SectionCard
        title={t('crmCreate.sections.details', 'Activity Details')}
        right={
          <Button
            type="button"
            size="sm"
            className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90 rounded-lg"
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving ? t('common.saving', 'Saving…') : t('crmCreate.save', 'Save')}
          </Button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="activity-title">
              {t('crmCreate.fields.title', 'Activity Title')}{' '}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="activity-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('crmCreate.placeholders.title', 'Enter activity title')}
              className="mt-1"
            />
          </div>
          <div className="relative">
            <Label htmlFor="activity-business">
              {t('crmCreate.fields.business', 'Business')}{' '}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="activity-business"
              value={companyDropdownOpen ? companySearch : companyName}
              onChange={(e) => {
                setCompanySearch(e.target.value);
                setCompanyDropdownOpen(true);
                if (!e.target.value) {
                  setCompanyId(null);
                  setCompanyName('');
                }
              }}
              onFocus={() => {
                setCompanyDropdownOpen(true);
                setCompanySearch(companyName);
              }}
              onBlur={() => {
                // delay to allow click
                setTimeout(() => setCompanyDropdownOpen(false), 150);
              }}
              placeholder={t('crmCreate.placeholders.business', 'Search business...')}
              className="mt-1"
              autoComplete="off"
            />
            {companyDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {companiesQuery.isLoading ? (
                  <div className="px-3 py-2 text-sm text-gray-400">
                    {t('common.loading', 'Loading…')}
                  </div>
                ) : companyResults.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-400">
                    {t('crmCreate.noCompanies', 'No businesses found')}
                  </div>
                ) : (
                  companyResults.map((c) => (
                    <button
                      key={c.nid}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setCompanyId(c.nid);
                        setCompanyName(c.title);
                        setCompanySearch('');
                        setCompanyDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <div className="font-medium text-[#0d0e0e]">{c.title}</div>
                      {c.cvr && (
                        <div className="text-xs text-gray-500">CVR {c.cvr}</div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Categorization */}
      <SectionCard title={t('crmCreate.sections.categorization', 'Categorization')}>
        <div className="space-y-5">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t('crmCreate.fields.status', 'Status')}
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <Pill
                  key={s.key}
                  active={statusKey === s.key}
                  onClick={() => setStatusKey(s.key)}
                >
                  {t(`crmCreate.statuses.${s.key}`, s.label)}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t('crmCreate.fields.type', 'Type')}
            </div>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((ty) => {
                const Icon = ty.icon;
                return (
                  <Pill
                    key={ty.key}
                    active={typeKey === ty.key}
                    onClick={() => setTypeKey(ty.key)}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {t(`crmCreate.types.${ty.key}`, ty.label)}
                  </Pill>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t('crmCreate.fields.responsible', 'Responsible')}
            </div>
            <div className="flex flex-wrap gap-2">
              {usersQuery.isLoading && (
                <span className="text-xs text-gray-400">
                  {t('common.loading', 'Loading…')}
                </span>
              )}
              {users.map((u) => (
                <UserPill
                  key={u.uid}
                  name={u.name}
                  color={u.colorSeed}
                  active={responsibleUid === u.uid}
                  onClick={() =>
                    setResponsibleUid((prev) => (prev === u.uid ? null : u.uid))
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Note */}
      <SectionCard title={t('crmCreate.sections.note', 'Note')}>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
            <button type="button" className="px-2 py-1 rounded hover:bg-gray-100 font-bold">
              B
            </button>
            <button type="button" className="px-2 py-1 rounded hover:bg-gray-100 italic">
              I
            </button>
            <button type="button" className="px-2 py-1 rounded hover:bg-gray-100 underline">
              U
            </button>
            <span className="mx-1 h-4 w-px bg-gray-300" />
            <button type="button" className="px-2 py-1 rounded hover:bg-gray-100">
              • List
            </button>
            <button type="button" className="px-2 py-1 rounded hover:bg-gray-100">
              1. List
            </button>
          </div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('crmCreate.placeholders.body', 'Write your note...')}
            rows={6}
            className="border-0 rounded-none focus-visible:ring-0"
          />
        </div>
      </SectionCard>

      {/* Follow-up */}
      <SectionCard title={t('crmCreate.sections.followup', 'Follow-up')}>
        <div className="space-y-5">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={sendMessageToResponsible}
              onChange={(e) => setSendMessageToResponsible(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            {t(
              'crmCreate.fields.sendMessageToResponsible',
              'Send message to responsible person(s)',
            )}
          </label>

          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t('crmCreate.fields.followupType', 'Follow-up type')}
            </div>
            <div className="flex flex-wrap gap-2">
              {FOLLOWUP_OPTIONS.map((o) => (
                <Pill
                  key={o.key}
                  active={followupKey === o.key}
                  variant="green"
                  onClick={() => handleFollowupKey(o.key)}
                >
                  {t(`crmCreate.followups.${o.key}`, o.label)}
                </Pill>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fup-date">
                {t('crmCreate.fields.nextActivityDate', 'Next activity date')}
              </Label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  id="fup-date"
                  type="date"
                  value={fupDate}
                  onChange={(e) => {
                    setFupDate(e.target.value);
                    setFollowupKey('not_specified');
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="fup-note">
                {t('crmCreate.fields.followupNote', 'Note for follow-up')}
              </Label>
              <Textarea
                id="fup-note"
                value={followupNote}
                onChange={(e) => setFollowupNote(e.target.value)}
                placeholder={t(
                  'crmCreate.placeholders.followupNote',
                  'Add a note for the follow-up...',
                )}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Followed by */}
      <SectionCard title={t('crmCreate.sections.followedBy', 'Followed by')}>
        <div className="flex flex-wrap gap-2">
          {usersQuery.isLoading && (
            <span className="text-xs text-gray-400">
              {t('common.loading', 'Loading…')}
            </span>
          )}
          {users.map((u) => (
            <UserPill
              key={u.uid}
              name={u.name}
              color={u.colorSeed}
              active={followedByUid === u.uid}
              onClick={() =>
                setFollowedByUid((prev) => (prev === u.uid ? null : u.uid))
              }
            />
          ))}
        </div>
      </SectionCard>

      {/* Mail Status */}
      <SectionCard title={t('crmCreate.sections.mailStatus', 'Mail Status')}>
        <div className="max-w-md">
          <Label htmlFor="mail-status">
            {t('crmCreate.fields.mailStatus', 'Mail status')}
          </Label>
          <select
            id="mail-status"
            value={mailStatus}
            onChange={(e) => setMailStatus(e.target.value)}
            className="mt-1 w-full border border-gray-200 rounded-lg text-sm px-3 py-2 bg-white"
          >
            {MAIL_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(`crmCreate.mailStatuses.${o.value || 'placeholder'}`, o.label)}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      {/* Files */}
      <SectionCard title={t('crmCreate.sections.files', 'Files')}>
        <label
          htmlFor="file-upload"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-6 py-10 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-[#0d0e0e] bg-gray-50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
          }`}
        >
          <Upload className="h-8 w-8 text-gray-400" />
          <div className="text-sm font-medium text-[#0d0e0e]">
            {t('crmCreate.files.drop', 'Drop files here or click to upload')}
          </div>
          <div className="text-xs text-gray-500">
            {t('crmCreate.files.hint', 'PDF, DOCX, images up to 20MB')}
          </div>
          <input
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
        {files.length > 0 && (
          <ul className="mt-4 space-y-2">
            {files.map((f, idx) => (
              <li
                key={`${f.name}-${idx}`}
                className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <span className="flex items-center gap-2 text-gray-700">
                  <FileText className="h-4 w-4 text-gray-400" />
                  {f.name}
                  <span className="text-xs text-gray-400">
                    ({(f.size / 1024).toFixed(1)} KB)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-xs text-red-500 hover:underline"
                >
                  {t('common.remove', 'Remove')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Status & Version Info */}
      <SectionCard title={t('crmCreate.sections.versionInfo', 'Status & Version Info')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t('crmCreate.version.author', 'Author')}
            </div>
            <div className="mt-1 text-gray-700">
              {user?.name ?? t('common.unknown', 'Unknown')}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t('crmCreate.version.created', 'Created')}
            </div>
            <div className="mt-1 text-gray-700">—</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t('crmCreate.version.lastModified', 'Last modified')}
            </div>
            <div className="mt-1 text-gray-700">—</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t('crmCreate.version.version', 'Version')}
            </div>
            <div className="mt-1 text-gray-700">1</div>
          </div>
        </div>
      </SectionCard>

      {/* Promotion Settings */}
      <SectionCard
        title={t('crmCreate.sections.promotion', 'Promotion Settings')}
      >
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          {t('crmCreate.fields.published', 'Published')}
        </label>
      </SectionCard>

      {/* Bottom actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button
          type="button"
          className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving
            ? t('common.saving', 'Saving…')
            : t('crmCreate.saveActivity', 'Save Activity')}
        </Button>
      </div>
    </div>
  );
};
