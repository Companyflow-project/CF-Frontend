import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { companiesApi, RetentionPolicy } from '@/features/companies/api';

export const DataRetentionPage: React.FC = () => {
  const { t } = useTranslation('account');
  const [policy, setPolicy] = useState<RetentionPolicy>({ generalPersonalDataDays: 180, trackingDays: 365, bookkeepingYears: 5 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    companiesApi
      .getRetentionPolicy()
      .then((p) => {
        if (!cancelled) {
          setPolicy(p);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const num = (v: string) => {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? 0 : n;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await companiesApi.updateRetentionPolicy(policy);
      setPolicy(saved);
      toast.success(t('retention.saved'));
    } catch {
      toast.error(t('retention.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'bg-[#f2f2f2] rounded-[7px] p-3 text-[15px] text-[#373b3b] border-0 focus-visible:ring-0 h-auto max-w-[200px]';

  return (
    <PageShell>
      <PageHeader title={t('retention.title')} description={t('retention.subtitle')} />
      <div className="max-w-[560px]">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="general">{t('retention.generalPersonalData')}</Label>
                <Input id="general" type="number" min={30} max={3650} value={policy.generalPersonalDataDays}
                  onChange={(e) => setPolicy((p) => ({ ...p, generalPersonalDataDays: num(e.target.value) }))} disabled={loading} className={inputCls} />
                <p className="text-xs text-[#6b7280]">{t('retention.generalHelp')}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tracking">{t('retention.tracking')}</Label>
                <Input id="tracking" type="number" min={30} max={3650} value={policy.trackingDays}
                  onChange={(e) => setPolicy((p) => ({ ...p, trackingDays: num(e.target.value) }))} disabled={loading} className={inputCls} />
                <p className="text-xs text-[#6b7280]">{t('retention.trackingHelp')}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="bookkeeping">{t('retention.bookkeeping')}</Label>
                <Input id="bookkeeping" type="number" min={1} max={20} value={policy.bookkeepingYears}
                  onChange={(e) => setPolicy((p) => ({ ...p, bookkeepingYears: num(e.target.value) }))} disabled={loading} className={inputCls} />
                <p className="text-xs text-[#6b7280]">{t('retention.bookkeepingHelp')}</p>
              </div>
              <div>
                <Button type="submit" disabled={saving || loading}
                  className="bg-[#1a5948] hover:bg-[#143e33] text-white font-medium rounded-[12px] px-6 py-2.5 h-auto disabled:opacity-40">
                  {saving ? t('retention.saving') : t('retention.save')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
};
