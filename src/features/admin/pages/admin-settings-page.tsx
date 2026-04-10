import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAdminSettings, useUpdateAdminSettings } from '../hooks';
import type { PlatformSettings } from '../types';
import { Save } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const { data: settings, isLoading } = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();

  const [trialLength, setTrialLength] = useState<number>(30);
  const [smsPricing, setSmsPricing] = useState<number>(0);

  useEffect(() => {
    if (settings) {
      setTrialLength(
        typeof settings.defaultTrialLengthDays === 'number'
          ? settings.defaultTrialLengthDays
          : 30
      );
      setSmsPricing(
        typeof settings.smsPricePerUnit === 'number'
          ? settings.smsPricePerUnit
          : 0
      );
    }
  }, [settings]);

  const handleSave = () => {
    const payload: PlatformSettings = {
      ...settings,
      defaultTrialLengthDays: trialLength,
      smsPricePerUnit: smsPricing,
    };
    updateSettings.mutate(payload, {
      onSuccess: () => toast.success(t('settings.saved')),
      onError: () => toast.error(t('settings.saveFailed')),
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="py-20 text-center text-gray-400">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('settings.title')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('settings.description')}
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{t('settings.platformSettings')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="trial-length">
                {t('settings.defaultTrialLength')}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="trial-length"
                  type="number"
                  min={1}
                  max={365}
                  value={trialLength}
                  onChange={(e) => setTrialLength(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm text-gray-500">
                  {t('settings.days')}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {t('settings.trialLengthHelp')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sms-pricing">
                {t('settings.smsPricing')}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="sms-pricing"
                  type="number"
                  min={0}
                  step={0.01}
                  value={smsPricing}
                  onChange={(e) => setSmsPricing(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm text-gray-500">
                  {t('settings.perSms')}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {t('settings.smsPricingHelp')}
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleSave}
                disabled={updateSettings.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateSettings.isPending
                  ? t('common.saving')
                  : t('settings.save')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
