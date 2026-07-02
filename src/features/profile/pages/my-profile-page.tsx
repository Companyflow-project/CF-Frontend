import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { profileApi, SelfProfilePayload } from '../api';
import { authApi } from '@/features/auth/api';

export const MyProfilePage: React.FC = () => {
  const { t } = useTranslation('account');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SelfProfilePayload>({});
  const [newEmail, setNewEmail] = useState('');
  const [emailSubmitting, setEmailSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    profileApi
      .getMyProfile()
      .then((emp) => {
        if (cancelled) return;
        if (emp) {
          setForm({
            mobileNumber: emp.mobileNumber ?? '',
            alternateNumber: emp.alternateNumber ?? '',
            emergencyContactName: emp.emergencyContactName ?? '',
            emergencyContactMobile: emp.emergencyContactMobile ?? '',
            isEmergencyPublic: emp.isEmergencyPublic ?? false,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (patch: Partial<SelfProfilePayload>) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profileApi.updateMyProfile(form);
      toast.success(t('myProfile.saved'));
    } catch {
      toast.error(t('myProfile.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setEmailSubmitting(true);
    try {
      await authApi.requestEmailChange(newEmail.trim());
      toast.success(t('myProfile.emailChangeSent'));
      setNewEmail('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('myProfile.emailChangeError'));
    } finally {
      setEmailSubmitting(false);
    }
  };

  const inputCls = 'bg-[#f2f2f2] rounded-[7px] p-3 text-[15px] text-[#373b3b] border-0 focus-visible:ring-0 h-auto';

  return (
    <PageShell>
      <PageHeader title={t('myProfile.title')} description={t('myProfile.subtitle')} />
      <div className="flex flex-col gap-6 max-w-[560px]">
        {/* Contact details */}
        <Card>
          <CardHeader>
            <CardTitle>{t('myProfile.contactSection')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="mobile">{t('myProfile.mobile')}</Label>
                <Input id="mobile" value={form.mobileNumber ?? ''} onChange={(e) => set({ mobileNumber: e.target.value })} disabled={loading} className={inputCls} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="alternate">{t('myProfile.alternate')}</Label>
                <Input id="alternate" value={form.alternateNumber ?? ''} onChange={(e) => set({ alternateNumber: e.target.value })} disabled={loading} className={inputCls} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="emName">{t('myProfile.emergencyName')}</Label>
                <Input id="emName" value={form.emergencyContactName ?? ''} onChange={(e) => set({ emergencyContactName: e.target.value })} disabled={loading} className={inputCls} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="emPhone">{t('myProfile.emergencyPhone')}</Label>
                <Input id="emPhone" value={form.emergencyContactMobile ?? ''} onChange={(e) => set({ emergencyContactMobile: e.target.value })} disabled={loading} className={inputCls} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="emPublic" checked={!!form.isEmergencyPublic} onChange={(e) => set({ isEmergencyPublic: e.target.checked })} className="w-4 h-4" />
                <Label htmlFor="emPublic" className="cursor-pointer">{t('myProfile.emergencyPublic')}</Label>
              </div>
              <div>
                <Button type="submit" disabled={saving || loading} className="bg-[#1a5948] hover:bg-[#143e33] text-white font-medium rounded-[12px] px-6 py-2.5 h-auto disabled:opacity-40">
                  {saving ? t('myProfile.saving') : t('myProfile.save')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Login email */}
        <Card>
          <CardHeader>
            <CardTitle>{t('myProfile.emailSection')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailChange} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-[#6b7280]">{t('myProfile.currentEmail')}</span>
                <span className="text-[15px] font-medium text-[#0d0e0e]">{user?.email}</span>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="newEmail">{t('myProfile.newEmail')}</Label>
                <Input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputCls} />
              </div>
              <div>
                <Button type="submit" disabled={emailSubmitting || !newEmail.trim()} className="bg-[#1a5948] hover:bg-[#143e33] text-white font-medium rounded-[12px] px-6 py-2.5 h-auto disabled:opacity-40">
                  {t('myProfile.changeEmail')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* CF-16 transparency note */}
        <p className="text-xs text-[#6b7280] leading-relaxed">{t('myProfile.trackingNote')}</p>
      </div>
    </PageShell>
  );
};
