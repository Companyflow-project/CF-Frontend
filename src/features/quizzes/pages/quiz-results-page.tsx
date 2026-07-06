import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { quizzesApi, QuizResultRow } from '../api';

export const QuizResultsPage: React.FC = () => {
  const { nid } = useParams<{ nid: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('handbook');
  const { t: tCommon } = useTranslation('common');
  const [rows, setRows] = useState<QuizResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!nid) return;
    (async () => {
      try {
        const quiz = await quizzesApi.getForManage(Number(nid));
        if (quiz) setRows(await quizzesApi.results(quiz.id));
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [nid]);

  return (
    <PageShell>
      <PageHeader
        title={t('quiz.resultsTitle')}
        actions={<Button variant="outline" onClick={() => navigate(-1)}>{tCommon('back')}</Button>}
      />
      <div className="max-w-[720px]">
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-sm text-[#6b7280]">…</div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-sm text-[#6b7280]">{t('quiz.resultsEmpty')}</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#6b7280] border-b border-gray-100">
                    <th className="px-5 py-3 font-medium">{t('quiz.colName')}</th>
                    <th className="px-5 py-3 font-medium">{t('quiz.colScore')}</th>
                    <th className="px-5 py-3 font-medium">{t('quiz.colResult')}</th>
                    <th className="px-5 py-3 font-medium">{t('quiz.colDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="px-5 py-3 text-[#0d0e0e]">{r.name}</td>
                      <td className="px-5 py-3">{r.score}%</td>
                      <td className={`px-5 py-3 ${r.passed ? 'text-[#1a5948]' : 'text-red-600'}`}>
                        {r.passed ? t('quiz.resultPass') : t('quiz.resultFail')}
                      </td>
                      <td className="px-5 py-3 text-[#6b7280]">{new Date(r.takenAt).toLocaleString()}</td>
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
