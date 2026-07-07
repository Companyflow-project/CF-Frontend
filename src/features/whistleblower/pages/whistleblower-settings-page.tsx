import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { whistleblowerApi, WbConfig } from '../api';
import { employeesApi } from '@/features/employees/api';
import type { Employee } from '@/types/models';

export const WhistleblowerSettingsPage: React.FC = () => {
  const { t } = useTranslation('whistleblower');
  const [config, setConfig] = useState<WbConfig | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [handlers, setHandlers] = useState<Set<number>>(new Set());
  const [publicEnabled, setPublicEnabled] = useState(false);
  const [retentionDays, setRetentionDays] = useState(1825);
  const [categories, setCategories] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [cfg, emps] = await Promise.all([whistleblowerApi.getConfig(), employeesApi.listEmployees().catch(() => [])]);
        setConfig(cfg);
        setHandlers(new Set(cfg.handlerUids));
        setPublicEnabled(cfg.publicEnabled);
        setRetentionDays(cfg.retentionDaysAfterClosure);
        setCategories(cfg.categories.join(', '));
        setEmployees(emps);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleHandler = (uid: number) => setHandlers((s) => {
    const next = new Set(s);
    if (next.has(uid)) next.delete(uid); else next.add(uid);
    return next;
  });

  const save = async () => {
    setSaving(true);
    try {
      const cats = categories.split(',').map((c) => c.trim()).filter(Boolean);
      const updated = await whistleblowerApi.updateConfig({
        handlerUids: Array.from(handlers),
        publicEnabled,
        retentionDaysAfterClosure: retentionDays,
        categories: cats.length ? cats : undefined,
      });
      setConfig(updated);
      toast.success(t('config.saved'));
    } catch {
      toast.error(t('config.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    if (!config?.publicUrl) return;
    navigator.clipboard?.writeText(config.publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const inputCls = 'bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-sm';

  return (
    <PageShell>
      <PageHeader title={t('config.title')} description={t('config.subtitle')} />
      {loading ? (
        <p className="text-sm text-[#6b7280]">…</p>
      ) : (
        <div className="max-w-[640px] flex flex-col gap-5">
          {config && !config.encryptionConfigured && (
            <p className="text-sm text-amber-800 bg-amber-50 rounded-lg p-3">{t('config.notConfigured')}</p>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">{t('config.handlers')}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-[#6b7280] mb-3">{t('config.handlersHelp')}</p>
              <div className="max-h-[260px] overflow-y-auto border border-gray-100 rounded-[8px] divide-y divide-gray-50">
                {employees.length === 0 ? (
                  <p className="p-3 text-sm text-[#6b7280]">{t('config.noHandlers')}</p>
                ) : employees.map((e) => {
                  const uid = Number(e.id);
                  return (
                    <label key={e.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm">
                      <Checkbox checked={handlers.has(uid)} onChange={() => toggleHandler(uid)} className="w-4 h-4" />
                      <span>{e.name}{e.email ? ` · ${e.email}` : ''}</span>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t('config.public')}</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-xs text-[#6b7280]">{t('config.publicHelp')}</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={publicEnabled} onChange={(e) => setPublicEnabled(e.target.checked)} className="w-4 h-4" />
                <span className="text-sm">{t('config.publicEnabled')}</span>
              </label>
              {config?.publicUrl && publicEnabled && (
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">{t('config.publicUrl')}</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-[#f2f2f2] rounded-[8px] px-3 py-2 text-xs font-mono break-all">{config.publicUrl}</code>
                    <Button type="button" variant="outline" size="sm" onClick={copyLink}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t('config.categories')}</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Input value={categories} onChange={(e) => setCategories(e.target.value)} className={inputCls} />
              <div className="flex flex-col gap-1">
                <Label>{t('config.retention')}</Label>
                <Input type="number" min={30} value={retentionDays} onChange={(e) => setRetentionDays(Math.max(30, parseInt(e.target.value, 10) || 30))} className={`${inputCls} max-w-[160px]`} />
                <p className="text-xs text-[#6b7280]">{t('config.retentionHelp')}</p>
              </div>
            </CardContent>
          </Card>

          <div>
            <Button onClick={save} disabled={saving} className="bg-[#1a5948] hover:bg-[#143e33] text-white rounded-[12px] px-6 py-2.5 h-auto disabled:opacity-40">
              {saving ? t('config.saving') : t('config.save')}
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
};
