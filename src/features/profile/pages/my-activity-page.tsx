import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, CheckCircle2 } from 'lucide-react';
import { profileApi, ActivityItem } from '../api';

export const MyActivityPage: React.FC = () => {
  const { t } = useTranslation('account');
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    profileApi
      .getMyActivity()
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
  };

  return (
    <PageShell>
      <PageHeader title={t('myActivity.title')} description={t('myActivity.subtitle')} />
      <div className="max-w-[720px]">
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-sm text-[#6b7280]">…</div>
            ) : error ? (
              <div className="p-6 text-sm text-red-600">{t('myActivity.loadError')}</div>
            ) : items.length === 0 ? (
              <div className="p-6 text-sm text-[#6b7280]">{t('myActivity.empty')}</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((item, i) => (
                  <li key={`${item.type}-${item.nid}-${i}`} className="flex items-center gap-3 px-5 py-3.5">
                    <span className={item.type === 'signed' ? 'text-[#1a5948]' : 'text-[#6b7280]'}>
                      {item.type === 'signed' ? <CheckCircle2 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] text-[#0d0e0e] truncate">{item.title ?? `#${item.nid}`}</p>
                      <p className="text-xs text-[#6b7280]">
                        {item.type === 'signed' ? t('myActivity.signed') : t('myActivity.viewed')} · {formatDate(item.at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
};
