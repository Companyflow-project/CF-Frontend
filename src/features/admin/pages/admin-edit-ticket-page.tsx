import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertOctagon,
  AlertTriangle,
  Flame,
  ArrowUp,
  Equal,
  Coffee,
  Save,
  X,
  ChevronDown,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useTicketCreateOptions, useTicket, useUpdateTicket } from '../hooks';
import { adminRoutes } from '../routes';
import type { UpdateTicketPayload } from '../types';

const PRIORITY_DOT: Record<string, string> = {
  critical: '#ef4444',
  embarrassing: '#ef4444',
  urgent: '#f97316',
  high: '#3b82f6',
  normal: '#10b981',
  nice_to_have: '#9ca3af',
};

const PRIORITY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  critical: AlertOctagon,
  embarrassing: AlertTriangle,
  urgent: Flame,
  high: ArrowUp,
  normal: Equal,
  nice_to_have: Coffee,
};

const STATUS_DOT: Record<string, string> = {
  created: '#3b82f6',
  in_progress: '#f59e0b',
  to_be_tested: '#06b6d4',
  ready_to_upload: '#a855f7',
  waiting: '#f97316',
  stopped: '#ef4444',
  done: '#10b981',
};

function Initials({ name, color, size = 28 }: { name: string; color: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white text-xs font-medium flex-shrink-0"
      style={{ backgroundColor: color, width: size, height: size }}
    >
      {initials}
    </span>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-5 sm:p-6 bg-white">
      <div className="mb-5">
        <h2 className="text-base sm:text-lg font-semibold text-[#0d0e0e]">{title}</h2>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function formatTimestamp(unix: number) {
  if (!unix) return '—';
  const d = new Date(unix * 1000);
  return d.toLocaleString('da-DK', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const AdminEditTicketPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const { nid: nidParam } = useParams<{ nid: string }>();
  const nid = nidParam ?? '';

  const optionsQuery = useTicketCreateOptions();
  const ticketQuery = useTicket(nid);
  const updateMutation = useUpdateTicket(nid);

  const opts = optionsQuery.data;
  const priorities = opts?.priorities ?? [];
  const statuses = opts?.statuses ?? [];
  const lists = opts?.lists ?? [];
  const staff = opts?.staff ?? [];

  const ticket = ticketQuery.data;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<string>('normal');
  const [statusKey, setStatusKey] = useState<string>('created');
  const [responsibleUid, setResponsibleUid] = useState<number | null>(null);
  const [orientedUids, setOrientedUids] = useState<number[]>([]);
  const [listTids, setListTids] = useState<number[]>([]);
  const [sendMail, setSendMail] = useState(true);
  const [published, setPublished] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const [listsOpen, setListsOpen] = useState(false);

  // Hydrate state from ticket once it loads
  useEffect(() => {
    if (!ticket || loaded) return;
    setTitle(ticket.title);
    setBody(ticket.body);
    setPriority(ticket.priority ?? 'normal');
    setStatusKey(ticket.statusKey || 'created');
    setResponsibleUid(ticket.responsibleUid);
    setOrientedUids(ticket.orientedUids);
    setListTids(ticket.listTids);
    setSendMail(ticket.sendMail);
    setPublished(ticket.published);
    setLoaded(true);
  }, [ticket, loaded]);

  const statusTid = useMemo(() => {
    return statuses.find(s => s.key === statusKey)?.tid;
  }, [statuses, statusKey]);

  const toggleOriented = (uid: number) => {
    setOrientedUids(prev =>
      prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]
    );
  };

  const toggleList = (tid: number) => {
    setListTids(prev =>
      prev.includes(tid) ? prev.filter(x => x !== tid) : [...prev, tid]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error(t('createTicket.errors.titleRequired', 'Case is required'));
      return;
    }
    if (!responsibleUid) {
      toast.error(t('createTicket.errors.responsibleRequired', 'Responsible is required'));
      return;
    }

    const payload: UpdateTicketPayload = {
      title: title.trim(),
      body,
      priority,
      statusTid,
      responsibleUid,
      orientedUids,
      listTids,
      sendMail,
      published,
    };

    try {
      await updateMutation.mutateAsync(payload);
      toast.success(t('editTicket.success', 'Ticket #{{nid}} updated', { nid }));
      navigate(adminRoutes.tickets);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(t('editTicket.errors.saveFailed', 'Failed to update ticket: {{message}}', { message }));
    }
  };

  const saving = updateMutation.isPending;
  const loading = ticketQuery.isLoading || optionsQuery.isLoading;

  if (ticketQuery.isError) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        <div className="border border-red-200 bg-red-50 text-red-700 rounded-xl p-4 text-sm">
          {t('editTicket.loadError', 'Failed to load ticket. It may have been deleted.')}
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={() => navigate(adminRoutes.tickets)}>
            {t('editTicket.backToList', 'Back to tickets')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb + title */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500">
            <Link to={adminRoutes.dashboard} className="hover:underline">
              {t('nav.console', 'Console')}
            </Link>
            {' › '}
            <Link to={adminRoutes.tickets} className="hover:underline">
              {t('editTicket.breadcrumb.tickets', 'Support Tickets')}
            </Link>
            {' › '}
            <span className="text-gray-700">
              {t('editTicket.breadcrumb.edit', 'Edit Ticket #{{nid}}', { nid })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">
            {t('editTicket.title', 'Edit Support Ticket')}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(adminRoutes.tickets)}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-1" />
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={saving || loading}
            className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90"
          >
            <Save className="h-4 w-4 mr-1" />
            {saving ? t('common.saving', 'Saving…') : t('editTicket.save', 'Save Changes')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12 text-sm">{t('common.loading', 'Loading…')}</div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main column */}
        <div className="space-y-6 min-w-0">
          {/* Case + description */}
          <SectionCard
            title={t('createTicket.sections.case', 'Case Details')}
            description={t('createTicket.sections.caseDesc', 'Describe what happened. Add links and steps to reproduce.')}
          >
            <div className="space-y-5">
              <div>
                <Label htmlFor="ticket-title" className="text-sm font-medium">
                  {t('createTicket.fields.case', 'Case')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ticket-title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={t('createTicket.placeholders.case', 'Short summary of the case')}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">
                  {t('createTicket.fields.description', 'Description')}
                </Label>
                <div className="mt-1.5">
                  <RichTextEditor content={body} onChange={setBody} />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  {t('createTicket.descriptionHint', 'Describe the case as detailed as possible. Add links and screenshots.')}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Categorization */}
          <SectionCard
            title={t('createTicket.sections.categorization', 'Categorization')}
            description={t('createTicket.sections.categorizationDesc', 'Set priority, status, and who handles this ticket.')}
          >
            <div className="space-y-6">
              {/* Priority */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {t('createTicket.fields.priority', 'Priority')} <span className="text-red-500">*</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {priorities.map(p => {
                    const Icon = PRIORITY_ICON[p.key] ?? Equal;
                    const dot = PRIORITY_DOT[p.key] ?? '#9ca3af';
                    const active = priority === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setPriority(p.key)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm text-left transition-all ${
                          active
                            ? 'border-[#0d0e0e] bg-[#0d0e0e]/5 ring-1 ring-[#0d0e0e]/10'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span
                          className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${dot}20`, color: dot }}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className={`flex-1 ${active ? 'font-medium text-[#0d0e0e]' : 'text-gray-700'}`}>
                          {p.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {t('createTicket.fields.status', 'Status')} <span className="text-red-500">*</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {statuses.map(s => {
                    const dot = STATUS_DOT[s.key] ?? '#9ca3af';
                    const active = statusKey === s.key;
                    return (
                      <button
                        key={s.tid}
                        type="button"
                        onClick={() => setStatusKey(s.key)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                          active
                            ? 'bg-[#0d0e0e] text-white border-[#0d0e0e]'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: active ? '#fff' : dot }}
                        />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Responsible */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {t('createTicket.fields.responsible', 'Responsible')} <span className="text-red-500">*</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  {t('createTicket.responsibleHint', 'The person primarily handling this ticket.')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {staff.map(u => {
                    const active = responsibleUid === u.uid;
                    return (
                      <button
                        key={u.uid}
                        type="button"
                        onClick={() => setResponsibleUid(active ? null : u.uid)}
                        className={`inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border text-sm transition-colors ${
                          active
                            ? 'bg-pink-50 border-pink-300 text-pink-900'
                            : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Initials name={u.name} color={u.colorSeed} size={24} />
                        <span className="truncate max-w-[140px]">{u.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Oriented (multi) */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {t('createTicket.fields.oriented', 'Oriented')}
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  {t('createTicket.orientedHint', 'Notify these people about updates.')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {staff.map(u => {
                    const active = orientedUids.includes(u.uid);
                    return (
                      <button
                        key={u.uid}
                        type="button"
                        onClick={() => toggleOriented(u.uid)}
                        className={`inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border text-sm transition-colors ${
                          active
                            ? 'bg-blue-50 border-blue-300 text-blue-900'
                            : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Initials name={u.name} color={u.colorSeed} size={24} />
                        <span className="truncate max-w-[140px]">{u.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Lists */}
          <SectionCard
            title={t('createTicket.sections.lists', 'Lists')}
            description={t('createTicket.sections.listsDesc', 'Group this ticket under one or more lists.')}
          >
            <button
              type="button"
              onClick={() => setListsOpen(o => !o)}
              className="flex items-center justify-between w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-left hover:bg-gray-50"
            >
              <span className="text-gray-700">
                {listTids.length === 0
                  ? t('createTicket.lists.placeholder', 'Choose lists…')
                  : t('createTicket.lists.selectedCount', '{{count}} selected', { count: listTids.length })}
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${listsOpen ? 'rotate-180' : ''}`} />
            </button>

            {listsOpen && (
              <div className="mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                {lists.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-400 text-center">
                    {t('createTicket.lists.empty', 'No lists available')}
                  </div>
                ) : (
                  lists.map(l => {
                    const active = listTids.includes(l.tid);
                    return (
                      <button
                        key={l.tid}
                        type="button"
                        onClick={() => toggleList(l.tid)}
                        className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left border-b border-gray-100 last:border-0 hover:bg-gray-50 ${
                          active ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            active
                              ? 'bg-[#0d0e0e] border-[#0d0e0e]'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {active && (
                            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                              <path d="M2.5 6L5 8.5L9.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className="text-gray-700">{l.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {listTids.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {listTids.map(tid => {
                  const list = lists.find(l => l.tid === tid);
                  if (!list) return null;
                  return (
                    <span
                      key={tid}
                      className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full bg-gray-100 text-xs text-gray-700"
                    >
                      {list.name}
                      <button
                        type="button"
                        onClick={() => toggleList(tid)}
                        className="hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Email notifications */}
          <SectionCard title={t('createTicket.sections.emails', 'Email Notifications')}>
            <label className="flex items-start gap-3 cursor-pointer">
              <Switch
                checked={sendMail}
                onCheckedChange={setSendMail}
                className="mt-0.5"
              />
              <div>
                <div className="text-sm font-medium text-[#0d0e0e] flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {t('createTicket.fields.sendEmail', 'Send email on updates')}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('createTicket.sendEmailHint', 'Notify the responsible and oriented users when comments or status changes happen.')}
                </p>
              </div>
            </label>
          </SectionCard>
        </div>

        {/* Sidebar — sticky on lg+ */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div className="border border-gray-200 rounded-xl p-5 bg-white">
            <h3 className="text-sm font-semibold text-[#0d0e0e] mb-4">
              {t('createTicket.sidebar.publish', 'Publishing')}
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-[#0d0e0e]">
                    {t('createTicket.sidebar.published', 'Published')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {published
                      ? t('createTicket.sidebar.publishedYes', 'Visible in the ticket list')
                      : t('createTicket.sidebar.publishedNo', 'Hidden draft')}
                  </div>
                </div>
                <Switch checked={published} onCheckedChange={setPublished} />
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-500">
                  <span>{t('createTicket.sidebar.author', 'Author')}</span>
                  <span className="text-gray-700 font-medium truncate max-w-[160px]">
                    {ticket?.authorName ?? '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <span>{t('createTicket.sidebar.created', 'Created')}</span>
                  <span className="text-gray-700">{formatTimestamp(ticket?.created ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <span>{t('editTicket.sidebar.changed', 'Last updated')}</span>
                  <span className="text-gray-700">{formatTimestamp(ticket?.changed ?? 0)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={saving || loading}
                className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90 w-full"
              >
                <Save className="h-4 w-4 mr-1.5" />
                {saving ? t('common.saving', 'Saving…') : t('editTicket.save', 'Save Changes')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(adminRoutes.tickets)}
                disabled={saving}
                className="w-full"
              >
                {t('common.cancel', 'Cancel')}
              </Button>
            </div>
          </div>

          {/* Quick summary card */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white">
            <h3 className="text-sm font-semibold text-[#0d0e0e] mb-3">
              {t('createTicket.sidebar.summary', 'Summary')}
            </h3>
            <dl className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">{t('createTicket.fields.priority', 'Priority')}</dt>
                <dd className="text-gray-700 font-medium flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: PRIORITY_DOT[priority] ?? '#9ca3af' }}
                  />
                  {priorities.find(p => p.key === priority)?.label ?? priority}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">{t('createTicket.fields.status', 'Status')}</dt>
                <dd className="text-gray-700 font-medium">
                  {statuses.find(s => s.key === statusKey)?.label ?? '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">{t('createTicket.fields.responsible', 'Responsible')}</dt>
                <dd className="text-gray-700 font-medium truncate max-w-[160px]">
                  {responsibleUid
                    ? staff.find(u => u.uid === responsibleUid)?.name ?? '—'
                    : t('createTicket.summary.unassigned', 'Unassigned')}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">{t('createTicket.fields.oriented', 'Oriented')}</dt>
                <dd className="text-gray-700 font-medium">
                  {orientedUids.length === 0
                    ? '—'
                    : t('createTicket.summary.peopleCount', '{{count}} people', { count: orientedUids.length })}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">{t('createTicket.fields.lists', 'Lists')}</dt>
                <dd className="text-gray-700 font-medium">
                  {listTids.length === 0
                    ? '—'
                    : t('createTicket.summary.listCount', '{{count}} lists', { count: listTids.length })}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
      )}
    </div>
  );
};
