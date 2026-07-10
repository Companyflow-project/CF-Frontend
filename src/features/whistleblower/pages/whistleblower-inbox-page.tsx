import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { whistleblowerApi, WbReportListItem } from '../api';
import { DeadlineBadges } from '../components/deadline-badges';

export const WhistleblowerInboxPage: React.FC = () => {
  const { t } = useTranslation('whistleblower');
  const navigate = useNavigate();
  const [rows, setRows] = useState<WbReportListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    whistleblowerApi.handlerList().then(setRows).catch(() => undefined).finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <PageHeader title={t('inbox.title')} description={t('inbox.subtitle')} />
      <div className="max-w-[860px]">
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-sm text-[#6b7280]">…</div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-sm text-[#6b7280]">{t('inbox.empty')}</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#6b7280] border-b border-gray-100">
                    <th className="px-5 py-3 font-medium">{t('inbox.colCategory')}</th>
                    <th className="px-5 py-3 font-medium">{t('inbox.colFrom')}</th>
                    <th className="px-5 py-3 font-medium">{t('inbox.colStatus')}</th>
                    <th className="px-5 py-3 font-medium">{t('inbox.colUpdated')}</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50">
                      <td className="px-5 py-3 text-[#0d0e0e]">{t(`cat.${r.category}`, r.category ?? '—')}</td>
                      <td className="px-5 py-3 text-[#6b7280]">{r.isAnonymous ? t('inbox.anonymous') : t('inbox.identified')}</td>
                      <td className={`px-5 py-3 ${r.status === 'closed' ? 'text-[#6b7280]' : r.status === 'acknowledged' ? 'text-[#1a5948]' : 'text-amber-600'}`}>
                        <div className="flex flex-col gap-1">
                          <span>{t(`status.${r.status}`, r.status)}</span>
                          <DeadlineBadges d={r} status={r.status} />
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[#6b7280]">{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : ''}</td>
                      <td className="px-5 py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/whistleblower-reports/${r.id}`)}>{t('inbox.open')}</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
};
