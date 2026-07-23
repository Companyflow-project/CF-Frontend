import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAdminSettings, useUpdateAdminSettings } from '../hooks';
import { useAdminHandbookPage } from '../handbook-hooks';
import type { PlatformSettings } from '../types';
import { Save } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const { data: settings, isLoading } = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();

  const [trialLength, setTrialLength] = useState<number>(30);
  const [smsPricing, setSmsPricing] = useState<number>(0);
  const [helpPageNid, setHelpPageNid] = useState<string>('');

  // Live lookup of the entered page ID, so the admin can see what it points at.
  const parsedNid = Number(helpPageNid);
  const { data: helpPage, isFetching: helpPageLoading } = useAdminHandbookPage(
    helpPageNid.trim() !== '' && Number.isFinite(parsedNid) && parsedNid > 0 ? parsedNid : null,
  );

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
      const raw = (settings as Record<string, unknown>).handbookHelpPageNid;
      setHelpPageNid(raw == null || raw === '' ? '' : String(raw));
    }
  }, [settings]);

  const handleSave = () => {
    const parsedHelpNid = helpPageNid.trim() ? Number(helpPageNid) : null;
    // Send only the keys this screen owns. The settings table is a shared
    // key/value store that also holds per-company whistleblower and retention
    // config, and spreading everything back rewrote all of those on every save.
    const payload: PlatformSettings = {
      defaultTrialLengthDays: trialLength,
      smsPricePerUnit: smsPricing,
      handbookHelpPageNid: Number.isFinite(parsedHelpNid as number) ? parsedHelpNid : null,
    };
    updateSettings.mutate(payload, {
      onSuccess: () => toast.success(t('settings.saved')),
      onError: () => toast.error(t('settings.saveFailed')),
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        <div className="py-20 text-center text-gray-400">
          {t('common.loading', 'Loading...')}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {t('settings.title', 'Settings')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('settings.description', 'Configure platform-wide settings')}
        </p>
      </div>

      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>{t('settings.platformSettings', 'Platform settings')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="trial-length">
                  {t('settings.defaultTrialLength', 'Default trial length')}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="trial-length"
                    type="number"
                    min={1}
                    max={365}
                    value={trialLength}
                    onChange={(e) => setTrialLength(Number(e.target.value))}
                    className="w-full max-w-[8rem]"
                  />
                  <span className="text-sm text-gray-500">
                    {t('settings.days', 'days')}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {t('settings.trialLengthHelp', 'Default trial period for new companies')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sms-pricing">
                  {t('settings.smsPricing', 'SMS pricing')}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="sms-pricing"
                    type="number"
                    min={0}
                    step={0.01}
                    value={smsPricing}
                    onChange={(e) => setSmsPricing(Number(e.target.value))}
                    className="w-full max-w-[8rem]"
                  />
                  <span className="text-sm text-gray-500">
                    {t('settings.perSms', 'per SMS')}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {t('settings.smsPricingHelp', 'Price charged per SMS sent')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="help-page-nid">
                {t('settings.helpPageNid', 'Help text for the Management Handbook')}
              </Label>
              <p className="text-xs text-gray-500">
                {t(
                  'settings.helpPageNidHelp',
                  'The Help box at the top of the Management Handbook shows the content of a handbook page. Enter that page’s ID number — open the page in the handbook editor and copy the number from the address bar. Leave empty to show the standard text.'
                )}
              </p>
              <Input
                id="help-page-nid"
                type="number"
                min={1}
                value={helpPageNid}
                onChange={(e) => setHelpPageNid(e.target.value)}
                className="w-full max-w-[12rem]"
                placeholder={t('settings.helpPageNidPlaceholder', 'Page ID, e.g. 60385')}
              />
              {/* Resolve the number to a real page so the setting is verifiable —
                  a bare ID gave no way to tell a correct entry from a typo, which
                  is why this looked like it "didn't work". */}
              {helpPageNid.trim() !== '' && (
                <p className="text-xs">
                  {helpPageLoading ? (
                    <span className="text-gray-400">{t('settings.helpPageChecking', 'Checking…')}</span>
                  ) : helpPage?.title ? (
                    <span className="text-[#1a8a5a]">
                      {t('settings.helpPageResolved', 'Using: {{title}}', { title: helpPage.title })}
                    </span>
                  ) : (
                    <span className="text-[#d5384b]">
                      {t('settings.helpPageNotFound', 'No handbook page found with that ID — the standard text will be shown instead.')}
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={updateSettings.isPending}
                className="w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateSettings.isPending
                  ? t('common.saving', 'Saving...')
                  : t('settings.save', 'Save')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
