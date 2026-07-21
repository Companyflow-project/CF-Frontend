import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { ArrowLeft, Eye, Send, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useEmployees } from '../hooks';
import { employeesApi } from '../api';
import { useAuth } from '@/context/auth-context';
import type { Employee } from '@/types/models';

const SHORT_CODES = [
  { code: '[recipient name]', description: 'Employee\'s full name' },
  { code: '[title]', description: 'Handbook title' },
  { code: '[links]', description: 'Link to handbook' },
  { code: '[company name]', description: 'Your company name' },
  { code: '[login]', description: 'Magic login link' },
] as const;

const DEFAULT_EMAIL_BODY = `<p>Hello [recipient name],</p>
<p>You now have access to the Staff Handbook. Click on the link below to log in directly to the handbook.</p>
<p>[login]</p>
<p>Greetings,<br/>[company name]</p>`;

const DEFAULT_SMS_BODY = `[recipient name], you now have access to the [title] handbook!\n\n- Greetings from [company name]`;

export const FollowUpPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // Arriving from the "Send message" bulk action on the employees list, which
  // routes through the first selected employee but means to address all of them.
  const preselectedIds = (location.state as { preselectedIds?: string[] } | null)?.preselectedIds;
  const { user } = useAuth();
  const { t } = useTranslation('employees');
  const { t: tCommon } = useTranslation('common');

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loadingEmployee, setLoadingEmployee] = useState(true);
  const { data: allEmployees, loading: loadingEmployees } = useEmployees();

  const [emailSubject, setEmailSubject] = useState('Your Staff Handbook');
  const [emailBody, setEmailBody] = useState(DEFAULT_EMAIL_BODY);
  const [smsBody, setSmsBody] = useState(DEFAULT_SMS_BODY);
  const [sending, setSending] = useState(false);

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(
    new Set(preselectedIds ?? []),
  );
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoadingEmployee(false);
      return;
    }
    let isMounted = true;
    const fetchEmployee = async () => {
      try {
        const emp = await employeesApi.getEmployee(id);
        if (!isMounted) return;
        setEmployee(emp);
        // A bulk selection wins over the single employee named in the URL.
        if (emp && !(preselectedIds && preselectedIds.length > 0)) {
          setSelectedEmployeeIds(new Set([emp.id]));
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setLoadingEmployee(false);
      }
    };
    fetchEmployee();
    return () => { isMounted = false; };
  }, [id]);

  const employeeName = employee?.name || 'Employee';

  // Only ACTIVE (licensed) employees, exclude self
  const selectableEmployees = useMemo(
    () =>
      allEmployees.filter(
        (e) =>
          e.status === 'ACTIVE' &&
          (!user?.email || e.email.toLowerCase() !== user.email.toLowerCase()),
      ),
    [allEmployees, user?.email],
  );

  const selectAll =
    selectableEmployees.length > 0 &&
    selectableEmployees.every((e) => selectedEmployeeIds.has(e.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds(new Set(selectableEmployees.map((e) => e.id)));
    } else {
      setSelectedEmployeeIds(id ? new Set([id]) : new Set());
    }
  };

  const handleToggleEmployee = (empId: string) => {
    setSelectedEmployeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId);
      else next.add(empId);
      return next;
    });
  };

  const handleSend = async () => {
    if (selectedEmployeeIds.size === 0) {
      toast.error(t('followUp.toast.selectEmployee'));
      return;
    }
    if (!emailEnabled && !smsEnabled) {
      toast.error(t('followUp.toast.enableChannel'));
      return;
    }
    try {
      setSending(true);
      const channels: Array<'email' | 'sms'> = [];
      if (emailEnabled) channels.push('email');
      if (smsEnabled) channels.push('sms');

      const result = await employeesApi.sendFollowUp({
        employeeIds: Array.from(selectedEmployeeIds).map(Number),
        channels,
        customSubject: emailSubject.trim() || undefined,
        customMessage: emailBody || undefined,
        smsMessage: smsEnabled ? smsBody.trim() || undefined : undefined,
      });

      // Show SMS errors if any
      if (result.smsErrors && result.smsErrors.length > 0) {
        const errorList = result.smsErrors.join('\n');
        toast.error(`SMS failed for:\n${errorList}`, { duration: 8000 });
      }

      // Show success for what did go through
      const parts: string[] = [];
      if (emailEnabled) parts.push(t('followUp.toast.emailSent', { count: result.count }));
      if (smsEnabled && (result.smsSent ?? 0) > 0) parts.push(t('followUp.toast.smsSent', { count: result.smsSent }));

      if (parts.length > 0) {
        toast.success(parts.join(' | '));
      } else if (!result.smsErrors?.length) {
        toast.success(t('followUp.toast.sent', { count: selectedEmployeeIds.size }));
      }

      navigate(-1);
    } catch (err: any) {
      console.error('Failed to send follow-up:', err);
      toast.error(err?.message || t('followUp.toast.failed'));
    } finally {
      setSending(false);
    }
  };

  const previewReplace = (text: string) =>
    text
      .replace(/\[recipient name\]/gi, employee?.name || 'John Doe')
      .replace(/\[company name\]/gi, 'Your Company')
      .replace(/\[title\]/gi, 'Staff Handbook')
      .replace(/\[links\]/gi, 'https://app.companyflow.dk/handbook')
      .replace(/\[login\]/gi, 'https://app.companyflow.dk/magic-link/...');

  const ShortCodeButtons: React.FC<{ onInsert: (code: string) => void }> = ({ onInsert }) => (
    <div className="flex flex-wrap gap-1.5">
      {SHORT_CODES.map((sc) => (
        <button
          key={sc.code}
          type="button"
          onClick={() => onInsert(sc.code)}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#e8f5ef] text-[#1a5948] border border-[#cde3da] hover:bg-[#d4f4e6] transition-colors cursor-pointer"
        >
          {sc.code}
        </button>
      ))}
    </div>
  );

  return (
    <PageShell
      sidebar={
        <div className="space-y-3">
          {/* Message type */}
          <Card className="bg-white border border-[#e5efea] rounded-[12px]">
            <CardContent className="px-4 py-3 space-y-2.5">
              <p className="text-[13px] font-bold text-[#0f172a]">{t('followUp.messageType')}</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  className="rounded-[4px] border-[#3d997d] h-4 w-4"
                />
                <span className="text-[13px] text-[#0d0e0e]">{t('followUp.email')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={smsEnabled}
                  onChange={(e) => setSmsEnabled(e.target.checked)}
                  className="rounded-[4px] border-[#3d997d] h-4 w-4"
                />
                <span className="text-[13px] text-[#0d0e0e]">{t('followUp.sms')}</span>
              </label>
            </CardContent>
          </Card>

          {/* Send to */}
          <Card className="bg-white border border-[#e5efea] rounded-[12px]">
            <CardContent className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-[#0f172a]">{t('followUp.sendTo')}</p>
                <span className="text-[11px] text-[#3d997d] font-medium">
                  {t('followUp.selected', { count: selectedEmployeeIds.size })}
                </span>
              </div>
              {loadingEmployees ? (
                <p className="text-xs text-[#6b7280] py-2">{t('followUp.loadingEmployees')}</p>
              ) : selectableEmployees.length === 0 ? (
                <p className="text-xs text-[#6b7280] py-1">{t('followUp.noLicensedEmployees')}</p>
              ) : (
                <>
                  <label className="flex items-center gap-2 cursor-pointer py-1 border-b border-dashed border-[rgba(88,172,146,0.35)]">
                    <Checkbox
                      checked={selectAll}
                      onChange={() => handleSelectAll(!selectAll)}
                      className="rounded-[4px] border-[#3d997d] h-4 w-4"
                    />
                    <span className="text-[13px] font-semibold text-[#0d0e0e]">{t('followUp.allEmployees')}</span>
                  </label>
                  <div className="max-h-[240px] overflow-y-auto space-y-0.5 -mr-1 pr-1">
                    {selectableEmployees.map((emp) => (
                      <label
                        key={emp.id}
                        className={`flex items-center gap-2 cursor-pointer rounded-md py-1 px-1 -mx-1 transition-colors ${
                          selectedEmployeeIds.has(emp.id) ? 'bg-[#f0f9f5]' : 'hover:bg-[#fafcfb]'
                        }`}
                      >
                        <Checkbox
                          checked={selectedEmployeeIds.has(emp.id)}
                          onChange={() => handleToggleEmployee(emp.id)}
                          className="rounded-[4px] border-[#3d997d] h-4 w-4 shrink-0"
                        />
                        <span className="text-[13px] text-[#0d0e0e] truncate">{emp.name}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Short codes */}
          <Card className="bg-white border border-[#e5efea] rounded-[12px]">
            <CardContent className="px-4 py-3 space-y-2">
              <p className="text-[13px] font-bold text-[#0f172a]">{t('followUp.shortCodes')}</p>
              <div className="space-y-1.5">
                {SHORT_CODES.map((sc) => (
                  <div key={sc.code} className="flex items-center gap-1.5">
                    <code className="text-[10px] font-mono bg-[#f0f7f5] text-[#1a5948] px-1 py-px rounded border border-[#cde3da] shrink-0">
                      {sc.code}
                    </code>
                    <span className="text-[11px] text-[#6b7280]">{sc.description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="bg-white border-[rgba(15,23,42,0.1)] text-[#0d0e0e] rounded-[10px] px-3 py-2 h-auto flex items-center gap-2 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            {tCommon('back')}
          </Button>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#0b0c0c] truncate">
            {!loadingEmployee && employee ? t('followUp.titleWithName', { name: employeeName }) : t('followUp.title')}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview((v) => !v)}
            className="border-[rgba(15,23,42,0.1)] text-[#0d0e0e] rounded-[999px] px-4 py-2 h-auto text-[13px] gap-1.5"
          >
            {showPreview ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPreview ? t('followUp.editMessage') : t('followUp.previewMessage')}
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={sending || selectedEmployeeIds.size === 0}
            className="rounded-[999px] px-4 py-2 h-auto text-[13px] shadow-[0_8px_16px_rgba(13,94,67,0.3)] disabled:opacity-50 disabled:shadow-none gap-1.5"
            style={{ backgroundColor: 'var(--cf-primary-btn, #2f946f)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
          >
            <Send className="h-3.5 w-3.5" />
            {sending ? t('followUp.sending') : t('followUp.sendMessage')}
          </Button>
        </div>
      </div>

      {/* Help banner */}
      <div className="mb-5 bg-[#fff9f0] rounded-[12px] border border-[#f59e0b] border-l-[5px] px-4 py-3">
        <p className="text-[13px] text-[#0d0e0e]">
          <span className="font-bold">Help.</span>{' '}
          {t('followUp.helpDesc')}
        </p>
      </div>

      {showPreview ? (
        <Card className="border border-[#e5efea] rounded-[12px] overflow-hidden">
          <CardContent className="p-0">
            {emailEnabled && (
              <div>
                <div className="bg-[#1a5948] text-white px-4 py-2.5 text-[13px] font-semibold">
                  {t('followUp.emailPreview')}
                </div>
                {emailSubject.trim() && (
                  <div className="px-4 pt-3 pb-2 border-b border-[#e5efea] bg-[#fafcfb]">
                    <p className="text-[11px] font-medium text-[#6b7280] uppercase tracking-wide">{t('followUp.subject')}</p>
                    <p className="text-sm font-semibold text-[#111827]">{previewReplace(emailSubject)}</p>
                  </div>
                )}
                <div
                  className="px-4 py-4 prose prose-sm max-w-none text-sm text-[#111827] border-b border-[#e5efea]"
                  dangerouslySetInnerHTML={{ __html: previewReplace(emailBody) }}
                />
              </div>
            )}
            {smsEnabled && (
              <div>
                <div className="bg-[#1a5948] text-white px-4 py-2.5 text-[13px] font-semibold">
                  {t('followUp.smsPreview')}
                </div>
                <div className="px-4 py-4">
                  <p className="whitespace-pre-wrap text-sm text-[#111827]">{previewReplace(smsBody)}</p>
                </div>
              </div>
            )}
            {!emailEnabled && !smsEnabled && (
              <div className="py-10 text-center text-[#6b7280] text-sm">
                {t('followUp.enableChannelPreview')}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-[#e5efea] rounded-[12px] overflow-hidden">
          <CardContent className="p-0">
            {/* Email section */}
            {emailEnabled && (
              <div className={smsEnabled ? 'border-b border-[#e5efea]' : ''}>
                <div className="bg-[#1a5948] text-white px-4 py-2.5 text-[13px] font-semibold">
                  {t('followUp.email')}
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-[13px] font-semibold text-[#0d0e0e] mb-1 block">{t('followUp.subject')}</label>
                    <Input
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder={t('followUp.subjectPlaceholder')}
                      className="rounded-[8px] border-[#c8d8d3] bg-white text-sm h-9"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-semibold text-[#0d0e0e] mb-1 block">{t('followUp.message')}</label>
                    <RichTextEditor content={emailBody} onChange={setEmailBody} />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-[#6b7280] mb-1.5">{t('followUp.insertShortCode')}</p>
                    <ShortCodeButtons onInsert={(code) => setEmailBody((prev) => prev + ` ${code}`)} />
                  </div>
                </div>
              </div>
            )}

            {/* SMS section */}
            {smsEnabled && (
              <div>
                <div className="bg-[#1a5948] text-white px-4 py-2.5 text-[13px] font-semibold">
                  {t('followUp.sms')}
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-[13px] font-semibold text-[#0d0e0e] mb-1 block">{t('followUp.message')}</label>
                    <Textarea
                      rows={3}
                      value={smsBody}
                      onChange={(e) => setSmsBody(e.target.value)}
                      placeholder={t('followUp.smsPlaceholder')}
                      className="rounded-[8px] border-[#c8d8d3] bg-white text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-[#6b7280] mb-1.5">{t('followUp.insertShortCode')}</p>
                    <ShortCodeButtons
                      onInsert={(code) =>
                        setSmsBody((prev) => {
                          const needsSpace = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n');
                          return prev + (needsSpace ? ' ' : '') + code;
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {!emailEnabled && !smsEnabled && (
              <div className="py-10 text-center text-[#6b7280] text-sm">
                {t('followUp.enableChannelSidebar')}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
};
