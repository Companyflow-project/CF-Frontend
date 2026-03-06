import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, BookOpen, FileText, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { handbookApi } from '../api';
import { handbookRoutes } from '../routes';
import { employeesRoutes } from '@/features/employees/routes';
import { useHandbookTree } from '../hooks';
import { toast } from 'sonner';

type MessageType = 'none' | 'standard' | 'custom';

export const PublishHandbookPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const [messageType, setMessageType] = useState<MessageType>('standard');
  const [channels, setChannels] = useState<Array<'email' | 'sms'>>(['email']);
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(true);

  const { data: tree, loading: treeLoading } = useHandbookTree('en');

  // Parse selected page IDs from URL (passed from the pages screen)
  const selectedPageIds = useMemo(() => {
    const pagesParam = searchParams.get('pages');
    if (!pagesParam) return null;
    const ids = pagesParam.split(',').map(Number).filter((n) => Number.isFinite(n) && n > 0);
    return ids.length > 0 ? new Set(ids) : null;
  }, [searchParams]);

  const readySummary = useMemo(() => {
    if (!Array.isArray(tree)) return [];
    return tree
      .filter((node) => node.type === 'chapter')
      .map((chapter) => {
        const readyPages = (chapter.pages || []).filter((p: any) => {
          if (p.status !== 'ready') return false;
          // If specific pages were selected, only include those
          if (selectedPageIds && !selectedPageIds.has(p.id)) return false;
          return true;
        });
        return { ...chapter, readyPages };
      })
      .filter((ch) => ch.readyPages.length > 0);
  }, [tree, selectedPageIds]);

  const totalReadyPages = useMemo(
    () => readySummary.reduce((sum, ch) => sum + ch.readyPages.length, 0),
    [readySummary],
  );

  // Count all ready pages in tree (regardless of selection) to detect if handbook was previously published
  const allReadyCount = useMemo(() => {
    if (!Array.isArray(tree)) return 0;
    let count = 0;
    tree.forEach((node) => {
      if (node.type !== 'chapter') return;
      (node.pages || []).forEach((p: any) => { if (p.status === 'ready') count++; });
    });
    return count;
  }, [tree]);

  const isFiltered = !!selectedPageIds;

  const hasEmail = channels.includes('email');
  const hasSms = channels.includes('sms');

  const toggleChannel = (channel: 'email' | 'sms') => {
    setChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel],
    );
  };

  const handlePublish = async () => {
    const handbookId = id ? Number.parseInt(id, 10) || 21 : 21;

    const effectiveChannels: Array<'email' | 'sms'> =
      channels.length > 0 ? channels : ['email'];

    try {
      setSubmitting(true);

      const response = await handbookApi.publishHandbook({
        handbookId,
        messageType,
        channels: effectiveChannels,
        customSubject: messageType === 'custom' && customSubject.trim() ? customSubject.trim() : undefined,
        customMessage: messageType === 'custom' ? customMessage || undefined : undefined,
      });

      toast.success(
        `Published. ${response.count} employees will receive a notification.`,
      );
      navigate(handbookRoutes.manage);
    } catch (err: any) {
      console.error('Failed to publish handbook:', err);
      toast.error(err?.message || 'Failed to publish handbook. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /** Replace placeholder tokens with example values for the preview */
  const previewPlaceholders = (text: string) =>
    text
      .replace(/\[Employee Name\]/g, 'John Doe')
      .replace(/\[Company Name\]/g, 'Your Company')
      .replace(/\[Date\]/g, new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))
      .replace(/\[Login Link\]/g, 'https://app.companyflow.dk/magic-link/...');

  const renderEmailPreview = () => {
    if (messageType === 'none' || !hasEmail) return null;

    if (messageType === 'custom') {
      return customMessage ? previewPlaceholders(customMessage) : 'Write your custom email message...';
    }

    return `Hello [recipient name],

You now have access to the Staff Handbook. Click on the link below to log in directly to the handbook.

[login]

Greetings,
Your Company`;
  };

  const renderSmsPreview = () => {
    if (messageType === 'none' || !hasSms) return null;

    if (messageType === 'custom') {
      return customMessage ? previewPlaceholders(customMessage) : 'Write your custom SMS message...';
    }

    return `[recipient name],

You now have access to the Staff Handbook.

[login]

Greetings from your company.`;
  };

  const noMessage =
    messageType === 'none' || (!hasEmail && !hasSms);

  return (
    <PageShell>
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(handbookRoutes.manage)}
            className="border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] px-3 py-2 h-auto gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-[#0d0e0e]">Publish Handbook</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={submitting || totalReadyPages === 0}
            className="bg-[#2f946f] hover:bg-[#2f946f]/90 text-white rounded-[999px] px-5 py-[9px] h-auto text-sm shadow-[0_10px_20px_rgba(13,94,67,0.35)] disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? 'Publishing...' : `Publish${totalReadyPages > 0 ? ` (${totalReadyPages})` : ''}`}
          </Button>
        </div>
      </div>

      {/* help banner */}
      <div className="mb-6 bg-[#fff9f0] rounded-[16px] border border-[#f59e0b] border-l-[6px] shadow-[0_18px_40px_rgba(219,145,0,0.15)] px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-[#0d0e0e] max-w-3xl">
            <span className="font-bold">Help.</span>{' '}
            Here you can give employees access to your personnel handbook. It may be an advantage
            not to do this while you are working on it. Only share it with them when it is
            completely ready.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-[rgba(15,23,42,0.08)] text-[#0d0e0e] hover:bg-[#f0f7f5] rounded-[10px] px-[11px] py-[9px] h-auto whitespace-nowrap self-start sm:self-auto"
          >
            Read full guide
          </Button>
        </div>
      </div>

      {/* Ready pages summary */}
      <Card className="border border-[#cde3da] rounded-[16px] mb-6">
        <CardContent className="p-0">
          <button
            type="button"
            onClick={() => setSummaryExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#f8faf9] transition-colors rounded-t-[16px]"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#2f946f]" />
              <span className="text-sm font-bold text-[#0d0e0e]">
                Pages to publish
              </span>
              <span className="text-xs font-medium text-[#6b7280] bg-[#f3f4f6] rounded-full px-2 py-0.5">
                {treeLoading ? '...' : `${totalReadyPages} page${totalReadyPages !== 1 ? 's' : ''} ready`}
              </span>
            </div>
            {summaryExpanded ? (
              <ChevronDown className="h-4 w-4 text-[#6b7280]" />
            ) : (
              <ChevronRight className="h-4 w-4 text-[#6b7280]" />
            )}
          </button>

          {summaryExpanded && (
            <div className="px-5 pb-4 border-t border-[#e5efea]">
              {/* Info helper */}
              {!treeLoading && (
                <div className="flex items-start gap-2 pt-3 pb-2">
                  <Info className="h-4 w-4 text-[#6b7280] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#6b7280]">
                    {isFiltered
                      ? `Showing ${totalReadyPages} of ${allReadyCount} ready page${allReadyCount !== 1 ? 's' : ''} — only pages you selected and marked as Ready will be published.`
                      : `All ${totalReadyPages} page${totalReadyPages !== 1 ? 's' : ''} marked as Ready will be published and visible to employees.`}
                  </p>
                </div>
              )}

              {treeLoading ? (
                <p className="text-sm text-[#6b7280] py-3">Loading handbook pages...</p>
              ) : readySummary.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-sm text-[#6b7280]">No pages are marked as ready.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(handbookRoutes.pages)}
                    className="mt-2 rounded-[999px] text-xs"
                  >
                    Go to Pages
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {readySummary.map((chapter) => (
                    <div key={chapter.id}>
                      <p className="text-xs font-bold text-[#1a5948] uppercase tracking-wide mb-1">
                        {chapter.title}
                      </p>
                      <div className="space-y-0.5 pl-3">
                        {chapter.readyPages.map((page: any) => (
                          <div key={page.id} className="flex items-center gap-2 text-sm text-[#374151]">
                            <FileText className="h-3.5 w-3.5 text-[#2f946f] shrink-0" />
                            {page.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6 items-start">
        {/* left column - preview */}
        <div className="space-y-4">
          <Card className="border border-[#cde3da] rounded-[16px] shadow-[0_18px_40px_rgba(14,51,38,0.08)] overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-[#2f946f] text-white px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold">
                  The default message shown will be sent automatically when you continue.
                </span>
                <div className="hidden sm:flex items-center gap-1 text-xs">
                  <Check className="h-4 w-4" />
                  <span>Ready to publish</span>
                </div>
              </div>

              <div className="p-4 space-y-6 bg-[#f5faf7]">
                {noMessage ? (
                  <div className="text-sm text-[#4b5563] py-6 text-center">
                    No message will be sent.
                  </div>
                ) : (
                  <>
                    {hasEmail && (
                      <div className="border border-[#cde3da] rounded-[10px] overflow-hidden bg-white">
                        <div className="bg-[#1a5948] text-white px-4 py-2 text-sm font-semibold">
                          Email
                        </div>
                        {messageType === 'custom' && customSubject.trim() && (
                          <div className="px-4 pt-3 pb-0">
                            <p className="text-xs font-medium text-[#6b7280]">Subject</p>
                            <p className="text-sm font-semibold text-[#111827]">
                              {previewPlaceholders(customSubject)}
                            </p>
                          </div>
                        )}
                        <div className="p-4">
                          <p className="whitespace-pre-wrap text-sm text-[#111827]">
                            {renderEmailPreview()}
                          </p>
                        </div>
                      </div>
                    )}

                    {hasSms && (
                      <div className="border border-[#cde3da] rounded-[10px] overflow-hidden bg-white">
                        <div className="bg-[#1a5948] text-white px-4 py-2 text-sm font-semibold">
                          SMS
                        </div>
                        <div className="p-4">
                          <p className="whitespace-pre-wrap text-sm text-[#111827]">
                            {renderSmsPreview()}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {messageType === 'custom' && (
            <Card className="border border-[#e5e7eb] rounded-[16px]">
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-[#0d0e0e] mb-1.5">Subject</p>
                  <Input
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="e.g. The Staff Handbook for [Company Name]"
                    className="rounded-[10px] border-[#c8d8d3] bg-white text-sm"
                  />
                </div>
                <p className="text-sm font-semibold text-[#0d0e0e]">
                  Message body
                </p>
                <Textarea
                  rows={8}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Write your custom message to employees..."
                  className="rounded-[10px] border-[#c8d8d3] bg-white text-sm"
                />
                <div className="pt-1">
                  <p className="text-xs font-medium text-[#6b7280] mb-2">
                    Insert placeholder — these will be replaced with real values when sent:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '[Employee Name]', value: '[Employee Name]' },
                      { label: '[Company Name]', value: '[Company Name]' },
                      { label: '[Date]', value: '[Date]' },
                      { label: '[Login Link]', value: '[Login Link]' },
                    ].map((placeholder) => (
                      <button
                        key={placeholder.value}
                        type="button"
                        onClick={() =>
                          setCustomMessage((prev) => {
                            const needsSpace = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n');
                            return prev + (needsSpace ? ' ' : '') + placeholder.value;
                          })
                        }
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#e8f5ef] text-[#1a5948] border border-[#cde3da] hover:bg-[#d4f4e6] transition-colors cursor-pointer"
                      >
                        {placeholder.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* right column - controls */}
        <div className="space-y-4">
          {/* message to employees */}
          <Card className="bg-white border border-[#e5efea] rounded-[16px]">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-bold text-[#0d0e0e]">Message to employees</p>
              <div className="space-y-2 text-sm text-[#0d0e0e]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="messageType"
                    value="none"
                    checked={messageType === 'none'}
                    onChange={() => setMessageType('none')}
                    className="accent-[#2f946f]"
                  />
                  <span>No</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="messageType"
                    value="standard"
                    checked={messageType === 'standard'}
                    onChange={() => setMessageType('standard')}
                    className="accent-[#2f946f]"
                  />
                  <span>Standard</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="messageType"
                    value="custom"
                    checked={messageType === 'custom'}
                    onChange={() => setMessageType('custom')}
                    className="accent-[#2f946f]"
                  />
                  <span>Customized</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* message type */}
          <Card className="bg-white border border-[#e5efea] rounded-[16px]">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-bold text-[#0d0e0e]">Message type</p>
              <div className="space-y-2 text-sm text-[#0d0e0e]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasEmail}
                    onChange={() => toggleChannel('email')}
                    className="accent-[#2f946f]"
                  />
                  <span>Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSms}
                    onChange={() => toggleChannel('sms')}
                    className="accent-[#2f946f]"
                  />
                  <span>SMS</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* more actions */}
          <Card className="bg-white border border-[#e5efea] rounded-[16px]">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-bold text-[#0d0e0e]">More actions</p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(employeesRoutes.messageLogs)}
                  className="w-full justify-between border-[#e5e7eb] text-[#0d0e0e] rounded-[999px] h-9 text-sm"
                >
                  <span>Send follow up</span>
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(handbookRoutes.pages)}
                  className="w-full justify-between border-[#e5e7eb] text-[#0d0e0e] rounded-[999px] h-9 text-sm"
                >
                  <span>Edit handbook</span>
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
};

