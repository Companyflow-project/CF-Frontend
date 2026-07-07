import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { whistleblowerApi, WbReportDetail } from '../api';
import { ThreadPanel } from '../components/thread-panel';

export const WhistleblowerReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('whistleblower');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const [report, setReport] = useState<WbReportDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!id) return;
    whistleblowerApi.handlerGet(Number(id)).then(setReport).catch(() => undefined).finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const setStatus = async (s: 'open' | 'acknowledged' | 'closed') => {
    if (!id) return;
    try { await whistleblowerApi.handlerStatus(Number(id), s); load(); } catch { toast.error(t('detail.statusError')); }
  };

  return (
    <PageShell>
      <PageHeader
        title={t('detail.title')}
        actions={<Button variant="outline" onClick={() => navigate('/whistleblower-reports')}>{tCommon('back')}</Button>}
      />
      <div className="max-w-[720px]">
        {loading ? (
          <p className="text-sm text-[#6b7280]">…</p>
        ) : !report ? (
          <p className="text-sm text-red-600">{t('check.invalid')}</p>
        ) : (
          <Card>
            <CardContent className="pt-6 flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <span><span className="text-[#6b7280]">{t('report.category')}:</span> {t(`cat.${report.category}`, report.category ?? '—')}</span>
                <span><span className="text-[#6b7280]">{t('thread.status')}:</span> {t(`status.${report.status}`, report.status)}</span>
                <span>
                  <span className="text-[#6b7280]">{t('detail.reporter')}:</span>{' '}
                  {report.isAnonymous ? t('inbox.anonymous') : (report.reporterName || report.reporterEmail || t('inbox.identified'))}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {report.status === 'open' && <Button size="sm" variant="outline" onClick={() => setStatus('acknowledged')}>{t('detail.acknowledge')}</Button>}
                {report.status !== 'closed' && <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setStatus('closed')}>{t('detail.close')}</Button>}
                {report.status === 'closed' && <Button size="sm" variant="outline" onClick={() => setStatus('open')}>{t('detail.reopen')}</Button>}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <ThreadPanel
                  viewerRole="handler"
                  status={report.status}
                  messages={report.messages}
                  onReply={async (m) => { await whistleblowerApi.handlerReply(Number(id), m); load(); }}
                  onUpload={async (f) => { await whistleblowerApi.handlerUpload(Number(id), f); load(); }}
                  onDownload={(fileId, fn) => whistleblowerApi.handlerDownload(Number(id), fileId, fn)}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
};
