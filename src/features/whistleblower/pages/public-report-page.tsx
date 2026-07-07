import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy, Check, ShieldCheck } from 'lucide-react';
import { whistleblowerApi, WbThread, SubmitPayload } from '../api';
import { ReportForm } from '../components/report-form';
import { ThreadPanel } from '../components/thread-panel';

export const PublicReportPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation('whistleblower');
  const [info, setInfo] = useState<{ companyName: string; categories: string[]; available: boolean } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<'new' | 'existing'>('new');
  const [submitting, setSubmitting] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [thread, setThread] = useState<WbThread | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    whistleblowerApi.publicInfo(token).then(setInfo).catch(() => setNotFound(true));
  }, [token]);

  const loadThread = async (code: string) => {
    const t2 = await whistleblowerApi.reporterThread(code);
    setAccessCode(code);
    setThread(t2);
  };

  const handleSubmit = async (payload: SubmitPayload, file: File | null) => {
    if (!token) return;
    setSubmitting(true);
    try {
      const { accessCode: code } = await whistleblowerApi.publicSubmit(token, payload);
      if (file) { try { await whistleblowerApi.reporterUpload(code, file); } catch { /* non-fatal */ } }
      setAccessCode(code);
      await loadThread(code).catch(() => setThread({ report: { category: payload.category, status: 'open', createdAt: new Date().toISOString() }, messages: [] }));
    } catch {
      toast.error(t('report.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const openExisting = async () => {
    try { await loadThread(codeInput.trim()); } catch { toast.error(t('check.invalid')); }
  };

  const copyCode = () => {
    if (!accessCode) return;
    navigator.clipboard?.writeText(accessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const refresh = () => { if (accessCode) loadThread(accessCode).catch(() => undefined); };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center px-4 py-10">
      <div className="w-full max-w-[640px] flex flex-col gap-6">
        <div className="flex items-center gap-2 text-[#1a5948]">
          <ShieldCheck className="h-6 w-6" />
          <h1 className="text-xl font-semibold text-[#0d0e0e]">{t('report.title')}</h1>
        </div>

        {notFound ? (
          <p className="text-sm text-red-600">{t('check.invalid')}</p>
        ) : !info ? (
          <p className="text-sm text-[#6b7280]">…</p>
        ) : (
          <>
            <p className="text-sm text-[#6b7280]">{info.companyName} · {t('report.subtitle')}</p>
            {!info.available && <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">{t('report.notConfigured')}</p>}

            {/* When we have an active report thread, show it. */}
            {accessCode && thread ? (
              <div className="bg-white rounded-[14px] border border-gray-200 p-5 flex flex-col gap-4">
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
                <p className="text-xs text-[#6b7280]">{t('thread.status')}: {t(`status.${thread.report.status}`, thread.report.status)}</p>
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
              <div className="bg-white rounded-[14px] border border-gray-200 p-5">
                <div className="flex gap-2 mb-5">
                  <button onClick={() => setTab('new')} className={`text-sm px-3 py-1.5 rounded-[8px] ${tab === 'new' ? 'bg-[#1a5948] text-white' : 'bg-gray-100 text-gray-700'}`}>{t('tab.new')}</button>
                  <button onClick={() => setTab('existing')} className={`text-sm px-3 py-1.5 rounded-[8px] ${tab === 'existing' ? 'bg-[#1a5948] text-white' : 'bg-gray-100 text-gray-700'}`}>{t('tab.existing')}</button>
                </div>
                {tab === 'new' ? (
                  <ReportForm categories={info.categories} onSubmit={handleSubmit} submitting={submitting} disabled={!info.available} />
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-[#6b7280]">{t('check.prompt')}</p>
                    <Input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder={t('check.code')} className="bg-[#f2f2f2] rounded-[7px] p-3 border-0 h-auto" />
                    <div><Button onClick={openExisting} disabled={!codeInput.trim()} className="bg-[#1a5948] hover:bg-[#143e33] text-white rounded-[10px]">{t('check.open')}</Button></div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
