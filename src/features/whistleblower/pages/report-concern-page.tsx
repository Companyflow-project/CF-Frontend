import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { whistleblowerApi, WbThread, SubmitPayload, WB_DEFAULT_CATEGORIES } from '../api';
import { ReportForm } from '../components/report-form';
import { ThreadPanel } from '../components/thread-panel';

export const ReportConcernPage: React.FC = () => {
  const { t } = useTranslation('whistleblower');
  const [submitting, setSubmitting] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [thread, setThread] = useState<WbThread | null>(null);
  const [copied, setCopied] = useState(false);

  const loadThread = async (code: string) => {
    const th = await whistleblowerApi.reporterThread(code);
    setAccessCode(code);
    setThread(th);
  };

  const handleSubmit = async (payload: SubmitPayload, file: File | null) => {
    setSubmitting(true);
    try {
      const { accessCode: code } = await whistleblowerApi.authSubmit(payload);
      if (file) { try { await whistleblowerApi.reporterUpload(code, file); } catch { /* non-fatal */ } }
      setAccessCode(code);
      await loadThread(code).catch(() => setThread({ report: { category: payload.category, status: 'open', createdAt: new Date().toISOString() }, messages: [] }));
    } catch {
      toast.error(t('report.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = () => {
    if (!accessCode) return;
    navigator.clipboard?.writeText(accessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const refresh = () => { if (accessCode) loadThread(accessCode).catch(() => undefined); };

  return (
    <PageShell>
      <PageHeader title={t('report.title')} description={t('report.subtitle')} />
      <div className="max-w-[640px]">
        <Card>
          <CardContent className="pt-6">
            {accessCode && thread ? (
              <div className="flex flex-col gap-4">
                <div className="bg-[#e7f2ee] rounded-[10px] p-4">
                  <p className="text-sm font-semibold text-[#0d0e0e] mb-1">{t('code.title')}</p>
                  <p className="text-xs text-[#374151] mb-3">{t('code.saveThis')}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white rounded-[8px] px-3 py-2 text-sm font-mono break-all">{accessCode}</code>
                    <Button type="button" variant="outline" size="sm" onClick={copyCode}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <ThreadPanel
                  viewerRole="reporter"
                  status={thread.report.status}
                  messages={thread.messages}
                  onReply={async (m) => { await whistleblowerApi.reporterReply(accessCode, m); refresh(); }}
                  onUpload={async (f) => { await whistleblowerApi.reporterUpload(accessCode, f); refresh(); }}
                  onDownload={(id, fn) => whistleblowerApi.reporterDownload(id, accessCode, fn)}
                />
              </div>
            ) : (
              <ReportForm categories={WB_DEFAULT_CATEGORIES} onSubmit={handleSubmit} submitting={submitting} />
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
};
