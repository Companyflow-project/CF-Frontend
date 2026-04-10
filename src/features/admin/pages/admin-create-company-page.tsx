import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import { adminApi } from '../api';
import { adminRoutes } from '../routes';
import { Search } from 'lucide-react';

// ---- Category definitions (matches Drupal "Create a Business" form) ----
const CATEGORIES = [
  { value: 'lead', label: 'Lead', color: '#94a3b8' },
  { value: 'demo_requested', label: 'Demo requested', color: '#60a5fa' },
  { value: 'not_a_customer', label: 'Not a customer', color: '#f87171' },
  { value: 'potential', label: 'Potential', color: '#a78bfa' },
  { value: 'demo_agreed', label: 'Demo agreed', color: '#38bdf8' },
  { value: 'terminated', label: 'Terminated', color: '#ef4444' },
  { value: 'inquiry_from_us', label: 'Inquiry from us', color: '#fb923c' },
  { value: 'want_contact', label: 'Want contact', color: '#facc15' },
  { value: 'former_customer', label: 'Former customer', color: '#f97316' },
  { value: 'accepted', label: 'Accepted', color: '#4ade80' },
  { value: 'offer_sent', label: 'Offer sent', color: '#2dd4bf' },
  { value: 'partner', label: 'Partner', color: '#c084fc' },
  { value: 'dialogue', label: 'Dialogue', color: '#818cf8' },
  { value: 'offer_rejected', label: 'Offer rejected', color: '#fb7185' },
  { value: 'internal_testing', label: 'Internal testing', color: '#a3a3a3' },
  { value: 'meeting_scheduled', label: 'Meeting scheduled', color: '#67e8f9' },
  { value: 'external_testing', label: 'External testing', color: '#d4d4d4' },
  { value: 'internal_demo', label: 'Internal demo', color: '#cbd5e1' },
  { value: 'free_sample', label: 'Free sample', color: '#86efac' },
  { value: 'customer', label: 'Customer', color: '#22c55e' },
] as const;

const PRODUCTS = [
  { value: 'free_sample', label: 'Free Sample' },
  { value: 'free_sample_not_used', label: 'Free Sample Not used' },
  { value: 'the_staff_handbook', label: 'The staff handbook' },
] as const;

const LICENSE_OPTIONS = Array.from({ length: 15 }, (_, i) => (i + 1) * 5); // 5,10,...,75

const SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'google', label: 'Google Ads' },
  { value: 'cold_call', label: 'Cold call' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
] as const;

type SubmitAction = 'create' | 'create_crm' | 'create_admin';

interface FormState {
  cvr: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  contactName: string;
  contactInternalName: string;
  contactEmail: string;
  contactMobile: string;
  sendEmail: boolean;
  product: string;
  licenses: number;
  source: string;
}

const initialForm: FormState = {
  cvr: '',
  name: '',
  email: '',
  phone: '',
  category: 'lead',
  contactName: '',
  contactInternalName: '',
  contactEmail: '',
  contactMobile: '',
  sendEmail: false,
  product: 'free_sample',
  licenses: 5,
  source: 'website',
};

export const AdminCreateCompanyPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [cvrLoading, setCvrLoading] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Auto-generate internal name from contact name
  const handleContactNameChange = (value: string) => {
    set('contactName', value);
    set(
      'contactInternalName',
      value
        .toLowerCase()
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9.]/g, '')
    );
  };

  const handleCvrLookup = async () => {
    if (!form.cvr.trim()) return;
    setCvrLoading(true);
    try {
      const res = await fetch(
        `https://cvrapi.dk/api?search=${encodeURIComponent(form.cvr)}&country=dk`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.name) {
          set('name', data.name);
          if (data.email) set('email', data.email);
          if (data.phone) set('phone', String(data.phone));
          toast.success(t('createCompany.cvrFound'));
        } else {
          toast.error(t('createCompany.cvrNotFound'));
        }
      } else {
        toast.error(t('createCompany.cvrLookupFailed'));
      }
    } catch {
      toast.error(t('createCompany.cvrLookupFailed'));
    } finally {
      setCvrLoading(false);
    }
  };

  const validate = (): boolean => {
    if (!form.name.trim()) {
      toast.error(t('createCompany.validation.nameRequired'));
      return false;
    }
    if (!form.email.trim()) {
      toast.error(t('createCompany.validation.emailRequired'));
      return false;
    }
    if (!form.contactName.trim()) {
      toast.error(t('createCompany.validation.contactNameRequired'));
      return false;
    }
    if (!form.contactEmail.trim()) {
      toast.error(t('createCompany.validation.contactEmailRequired'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (action: SubmitAction) => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        cvr: form.cvr || undefined,
        category: form.category,
        contactPerson: {
          name: form.contactName,
          email: form.contactEmail,
          phone: form.contactMobile || undefined,
        },
        subscription: {
          product: form.product,
          licenses: form.licenses,
          source: form.source,
        },
        sendEmail: form.sendEmail,
      };

      const result = await adminApi.createCompany(payload);
      toast.success(t('createCompany.success'));

      switch (action) {
        case 'create':
          navigate(adminRoutes.companies);
          break;
        case 'create_crm':
          // Navigate to company detail where CRM activity can be added
          navigate(`/admin/companies/${result.nid}`);
          break;
        case 'create_admin':
          // Navigate to company detail to set up admin user
          navigate(`/admin/companies/${result.nid}`);
          break;
      }
    } catch {
      toast.error(t('createCompany.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('createCompany.title')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('createCompany.description')}
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* CVR Lookup */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('createCompany.cvrLookup')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="cvr">{t('createCompany.cvrNumber')}</Label>
                <Input
                  id="cvr"
                  placeholder="12345678"
                  value={form.cvr}
                  onChange={(e) => set('cvr', e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleCvrLookup}
                disabled={cvrLoading || !form.cvr.trim()}
              >
                <Search className="h-4 w-4 mr-2" />
                {cvrLoading
                  ? t('createCompany.lookingUp')
                  : t('createCompany.lookup')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('createCompany.businessDetails')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t('createCompany.companyName')} *
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-email">
                  {t('createCompany.companyEmail')} *
                </Label>
                <Input
                  id="company-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="company-phone">
                  {t('createCompany.telephone')}
                </Label>
                <Input
                  id="company-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('createCompany.category')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <label
                  key={cat.value}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    form.category === cat.value
                      ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat.value}
                    checked={form.category === cat.value}
                    onChange={() => set('category', cat.value)}
                    className="sr-only"
                  />
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm text-gray-700">{cat.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Primary Contact Person */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('createCompany.primaryContact')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-name">
                  {t('createCompany.contactName')} *
                </Label>
                <Input
                  id="contact-name"
                  value={form.contactName}
                  onChange={(e) => handleContactNameChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-internal">
                  {t('createCompany.internalName')}
                </Label>
                <Input
                  id="contact-internal"
                  value={form.contactInternalName}
                  onChange={(e) => set('contactInternalName', e.target.value)}
                  className="text-gray-400"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">
                  {t('createCompany.contactEmail')} *
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => set('contactEmail', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-mobile">
                  {t('createCompany.contactMobile')}
                </Label>
                <Input
                  id="contact-mobile"
                  type="tel"
                  value={form.contactMobile}
                  onChange={(e) => set('contactMobile', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.sendEmail}
                    onChange={(e) => set('sendEmail', e.target.checked)}
                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span className="text-sm text-gray-700">
                    {t('createCompany.sendEmail')}
                  </span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('createCompany.subscription')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="product">
                  {t('createCompany.product')}
                </Label>
                <Select
                  id="product"
                  value={form.product}
                  onChange={(e) => set('product', e.target.value)}
                >
                  {PRODUCTS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenses">
                  {t('createCompany.licenses')}
                </Label>
                <Select
                  id="licenses"
                  value={form.licenses}
                  onChange={(e) => set('licenses', Number(e.target.value))}
                >
                  {LICENSE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">
                  {t('createCompany.source')}
                </Label>
                <Select
                  id="source"
                  value={form.source}
                  onChange={(e) => set('source', e.target.value)}
                >
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <Button
            onClick={() => handleSubmit('create')}
            disabled={submitting}
          >
            {submitting ? t('common.saving') : t('createCompany.submit.create')}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit('create_crm')}
            disabled={submitting}
          >
            {t('createCompany.submit.createCrm')}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit('create_admin')}
            disabled={submitting}
          >
            {t('createCompany.submit.createAdmin')}
          </Button>
        </div>
      </div>
    </div>
  );
};
