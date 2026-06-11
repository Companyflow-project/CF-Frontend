import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import { adminApi } from '../api';
import { adminRoutes } from '../routes';
import { axiosClient } from '@/lib/axios-client';
import { resolveBackendUrl } from '@/lib/utils';
import type { ExistingCompanySummary } from '../types';

// ---- Category definitions (matches Drupal "Create a Business" form) ----
// `value` is the slug accepted by the backend (CATEGORY_KEY_TO_DA_NAME in companies.service.ts).
// `taxonomyName` is the Danish term name from the customer_category vocabulary — used to
// resolve the localised label via the shared `taxonomy.term.customer_category.<name>` keys
// in admin.json. `label` is the English fallback when the locale lacks an entry.
const CATEGORIES = [
  { value: 'lead', taxonomyName: 'Potentiel kunde', label: 'Lead', color: '#a78bfa' },
  { value: 'demo_requested', taxonomyName: 'Anmodet om demo', label: 'Demo requested', color: '#60a5fa' },
  { value: 'not_a_customer', taxonomyName: 'Ikke kunde', label: 'Not a customer', color: '#f87171' },
  { value: 'potential', taxonomyName: 'Potentiel', label: 'Potential', color: '#818cf8' },
  { value: 'demo_agreed', taxonomyName: 'Demo aftalt', label: 'Demo agreed', color: '#38bdf8' },
  { value: 'terminated', taxonomyName: 'Opsagt', label: 'Terminated', color: '#ef4444' },
  { value: 'want_contact', taxonomyName: 'Ønsker kontakt', label: 'Want contact', color: '#facc15' },
  { value: 'former_customer', taxonomyName: 'Tidl. kunde', label: 'Former customer', color: '#fb7185' },
  { value: 'accepted', taxonomyName: 'Accepteret', label: 'Accepted', color: '#4ade80' },
  { value: 'offer_sent', taxonomyName: 'Tilbud afsendt', label: 'Offer sent', color: '#2dd4bf' },
  { value: 'partner', taxonomyName: 'Partner', label: 'Partner', color: '#c084fc' },
  { value: 'dialogue', taxonomyName: 'Dialog', label: 'Dialogue', color: '#818cf8' },
  { value: 'offer_rejected', taxonomyName: 'Tilbud afvist', label: 'Offer rejected', color: '#fb7185' },
  { value: 'internal_testing', taxonomyName: 'Intern test', label: 'Internal testing', color: '#a3a3a3' },
  { value: 'external_testing', taxonomyName: 'Ekstern test', label: 'External testing', color: '#67e8f9' },
  { value: 'meeting_scheduled', taxonomyName: 'Aftalt møde', label: 'Meeting scheduled', color: '#67e8f9' },
  { value: 'free_sample', taxonomyName: 'Gratis prøve', label: 'Free sample', color: '#86efac' },
  { value: 'customer', taxonomyName: 'Kunde', label: 'Customer', color: '#22c55e' },
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
  source: '',
};

export const AdminCreateCompanyPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [cvrLoading, setCvrLoading] = useState(false);
  const [cvrExisting, setCvrExisting] = useState<ExistingCompanySummary | null>(null);

  const [logoFid, setLogoFid] = useState<number | null>(null);
  const [referenceLogoFid, setReferenceLogoFid] = useState<number | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [referenceLogoPreview, setReferenceLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState<'logo' | 'reference' | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const referenceLogoInputRef = useRef<HTMLInputElement | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/jpg', 'image/gif', 'image/png'];

  const uploadLogo = async (file: File, which: 'logo' | 'reference') => {
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      toast.error(t('editCompany.logo.invalidFormat', 'Only .jpg, .jpeg, .gif or .png files are allowed'));
      return;
    }
    setLogoUploading(which);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const resp = await axiosClient.post<{ fid: number; uri?: string }>('/files', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const fid = resp.data?.fid;
      if (!fid) throw new Error('No fid returned');
      const preview = resp.data?.uri ? resolveBackendUrl(resp.data.uri) : null;
      if (which === 'logo') {
        setLogoFid(fid);
        setLogoPreview(preview);
      } else {
        setReferenceLogoFid(fid);
        setReferenceLogoPreview(preview);
      }
      toast.success(t('editCompany.logo.uploaded', 'Logo uploaded'));
    } catch {
      toast.error(t('editCompany.logo.uploadFailed', 'Upload failed'));
    } finally {
      setLogoUploading(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
      if (referenceLogoInputRef.current) referenceLogoInputRef.current.value = '';
    }
  };

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
    setCvrExisting(null);
    try {
      const { existing, registry } = await adminApi.lookupCvr(form.cvr);

      if (existing) {
        // Already registered in CompanyFlow — surface it so the admin can update
        // the existing record instead of creating a duplicate.
        setCvrExisting(existing);
        set('name', existing.name);
        if (existing.email) set('email', existing.email);
        if (existing.phone) set('phone', existing.phone);
        toast.error(t('createCompany.cvrAlreadyRegistered', { name: existing.name }));
      } else if (registry) {
        set('name', registry.name);
        if (registry.email) set('email', registry.email);
        if (registry.phone) set('phone', registry.phone);
        toast.success(t('createCompany.cvrFound'));
      } else {
        toast.error(t('createCompany.cvrNotFound'));
      }
    } catch {
      toast.error(t('createCompany.cvrLookupFailed'));
    } finally {
      setCvrLoading(false);
    }
  };

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const validate = (): boolean => {
    if (!form.name.trim()) {
      toast.error(t('createCompany.validation.nameRequired'));
      return false;
    }
    if (!form.email.trim()) {
      toast.error(t('createCompany.validation.emailRequired'));
      return false;
    }
    if (!isValidEmail(form.email)) {
      toast.error(t('createCompany.validation.emailInvalid'));
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
    if (!isValidEmail(form.contactEmail)) {
      toast.error(t('createCompany.validation.contactEmailInvalid'));
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
        ...(logoFid != null ? { logoFid } : {}),
        ...(referenceLogoFid != null ? { referenceLogoFid } : {}),
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
    } catch (err) {
      const apiError = (err as {
        apiError?: { code?: string; message?: string; details?: { field?: string; company?: { name?: string } } };
      }).apiError;
      if (apiError?.code === 'CONFLICT') {
        // Duplicate CVR / email / phone — build a localized, actionable message
        // from the structured details the backend returns.
        const field = apiError.details?.field;
        const name = apiError.details?.company?.name;
        if (field === 'contactEmail') {
          // The contact email is the console login identity; it's already taken.
          toast.error(t('createCompany.contactEmailInUse'));
        } else {
          const fieldLabel =
            field === 'cvr' ? t('createCompany.cvrNumber')
            : field === 'email' ? t('createCompany.companyEmail')
            : field === 'phone' ? t('createCompany.telephone')
            : '';
          if (fieldLabel && name) {
            toast.error(t('createCompany.duplicateField', { field: fieldLabel, name }));
          } else {
            toast.error(t('createCompany.duplicate'));
          }
        }
      } else {
        toast.error(t('createCompany.failed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <div className="text-sm text-gray-500">
          <Link to={adminRoutes.dashboard} className="hover:underline">
            {t('nav.console', 'Console')}
          </Link>
          {' › '}
          <Link to={adminRoutes.companies} className="hover:underline">
            {t('nav.companies', 'Companies')}
          </Link>
          {' › '}
          <span className="text-gray-700">{t('createCompany.title', 'Create a Business')}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
          {t('createCompany.title', 'Create a Business')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('createCompany.description', 'Onboard a new business')}
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 w-full">
        {/* CVR Lookup */}
        <Card className="rounded-xl border-gray-200 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              {t('createCompany.cvrLookup', 'CVR lookup')}
            </CardTitle>
            <p className="text-sm text-gray-500">
              {t('createCompany.cvrLookupDescription', 'Autofill business details from the Danish CVR registry.')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="cvr">{t('createCompany.cvrNumber', 'CVR number')}</Label>
                <Input
                  id="cvr"
                  placeholder={t('createCompany.cvrPlaceholder', 'e.g. 12345678')}
                  value={form.cvr}
                  onChange={(e) => set('cvr', e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleCvrLookup}
                disabled={cvrLoading || !form.cvr.trim()}
                className="w-full sm:w-auto"
              >
                {cvrLoading
                  ? t('createCompany.lookingUp', 'Looking up...')
                  : t('createCompany.lookup', 'Look up')}
              </Button>
            </div>

            {cvrExisting && (
              <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
                <p className="font-medium text-amber-900">
                  {t('createCompany.cvrExistingTitle', 'This CVR is already in the system')}
                </p>
                <div className="mt-1 space-y-0.5 text-amber-800">
                  <p>{cvrExisting.name}</p>
                  {cvrExisting.email && <p>{cvrExisting.email}</p>}
                  {cvrExisting.phone && <p>{cvrExisting.phone}</p>}
                </div>
                <Link
                  to={`/admin/companies/${cvrExisting.nid}`}
                  className="mt-2 inline-block font-medium text-amber-900 underline hover:text-amber-950"
                >
                  {t('createCompany.viewExisting', 'Open existing company')}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card className="rounded-xl border-gray-200 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              {t('createCompany.businessDetails', 'Business')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t('createCompany.companyName', 'Company name')} *
                </Label>
                <Input
                  id="name"
                  placeholder={t('createCompany.companyNamePlaceholder', 'Company name')}
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-email">
                  {t('createCompany.companyEmail', 'Company email')} *
                </Label>
                <Input
                  id="company-email"
                  type="email"
                  placeholder={t('createCompany.companyEmailPlaceholder', 'company@example.com')}
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="company-phone">
                  {t('createCompany.telephone', 'Telephone')}
                </Label>
                <Input
                  id="company-phone"
                  type="tel"
                  placeholder={t('createCompany.telephonePlaceholder', '+45 00 00 00 00')}
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className="w-full sm:max-w-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card className="rounded-xl border-gray-200 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              {t('editCompany.logo.title', 'Logo & Images')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('editCompany.logo.logo', 'Logo')}</Label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.gif,.png"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadLogo(f, 'logo');
                  }}
                />
                <div className="flex items-center gap-3">
                  {logoPreview && (
                    <img src={logoPreview} alt="" className="h-10 w-10 rounded object-cover border" />
                  )}
                  <span className="text-sm text-gray-700">
                    {logoFid != null
                      ? `${t('editCompany.logo.file', 'File')} #${logoFid}`
                      : t('editCompany.logo.noFile', 'No file')}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={logoUploading === 'logo'}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {logoUploading === 'logo'
                      ? t('editCompany.logo.uploading', 'Uploading…')
                      : t('editCompany.logo.choose', 'Choose File')}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('editCompany.logo.referenceLogo', 'Reference logo')}</Label>
                <input
                  ref={referenceLogoInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.gif,.png"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadLogo(f, 'reference');
                  }}
                />
                <div className="flex items-center gap-3">
                  {referenceLogoPreview && (
                    <img src={referenceLogoPreview} alt="" className="h-10 w-10 rounded object-cover border" />
                  )}
                  <span className="text-sm text-gray-700">
                    {referenceLogoFid != null
                      ? `${t('editCompany.logo.file', 'File')} #${referenceLogoFid}`
                      : t('editCompany.logo.noFile', 'No file')}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={logoUploading === 'reference'}
                    onClick={() => referenceLogoInputRef.current?.click()}
                  >
                    {logoUploading === 'reference'
                      ? t('editCompany.logo.uploading', 'Uploading…')
                      : t('editCompany.logo.choose', 'Choose File')}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category */}
        <Card className="rounded-xl border-gray-200 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              {t('createCompany.category', 'Category *')}
            </CardTitle>
            <p className="text-sm text-gray-500">
              {t('createCompany.categoryDescription', 'Select the customer category for this business.')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
                  <span className="text-sm text-gray-700">
                    {t(`taxonomy.term.customer_category.${cat.taxonomyName}`, { defaultValue: cat.label })}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Primary Contact Person */}
        <Card className="rounded-xl border-gray-200 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              {t('createCompany.primaryContact', 'Primary Contact Person')}
            </CardTitle>
            <p className="text-sm text-gray-500">
              {t(
                'createCompany.primaryContactDescription',
                "Fill in the Name field with the user's real name. The Internal name is filled in automatically and does not normally need to be edited."
              )}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-name">
                  {t('createCompany.contactName', 'Name')} *
                </Label>
                <Input
                  id="contact-name"
                  placeholder={t('createCompany.contactNamePlaceholder', 'Full name')}
                  value={form.contactName}
                  onChange={(e) => handleContactNameChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-internal">
                  {t('createCompany.internalName', 'Internal name')} *
                </Label>
                <Input
                  id="contact-internal"
                  placeholder={t('createCompany.internalNamePlaceholder', 'Auto-generated')}
                  value={form.contactInternalName}
                  onChange={(e) => set('contactInternalName', e.target.value)}
                  className="text-gray-400"
                  readOnly
                />
                <p className="text-xs text-gray-400">
                  {t('createCompany.internalNameHint', 'The internal username is created automatically')}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">
                  {t('createCompany.contactEmail', 'Email')} *
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder={t('createCompany.contactEmailPlaceholder', 'contact@example.com')}
                  value={form.contactEmail}
                  onChange={(e) => set('contactEmail', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-mobile">
                  {t('createCompany.contactMobile', 'Contact mobile')}
                </Label>
                <Input
                  id="contact-mobile"
                  type="tel"
                  placeholder={t('createCompany.contactMobilePlaceholder', '+45 00 00 00 00')}
                  value={form.contactMobile}
                  onChange={(e) => set('contactMobile', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.sendEmail}
                    onChange={(e) => set('sendEmail', e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span className="text-sm text-gray-700">
                    {t('createCompany.sendEmail', 'Send login credentials to the contact email')}
                    <span className="block text-xs text-gray-400">
                      {t('createCompany.sendEmailHint', 'Creates a console account for the contact email and emails a link to set a password.')}
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card className="rounded-xl border-gray-200 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              {t('createCompany.subscription', 'Subscription')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="product">
                  {t('createCompany.product', 'Product')}
                </Label>
                <Select
                  id="product"
                  value={form.product}
                  onChange={(e) => set('product', e.target.value)}
                >
                  {PRODUCTS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {t(`createCompany.products.${p.value}`, p.label)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenses">
                  {t('createCompany.licenses', 'Licenses')}
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
              <div className="space-y-2 sm:col-span-2 md:col-span-1">
                <Label htmlFor="source">
                  {t('createCompany.source', 'Source')}
                </Label>
                <Select
                  id="source"
                  value={form.source}
                  onChange={(e) => set('source', e.target.value)}
                >
                  <option value="">{t('createCompany.sources.none', '— Nothing selected —')}</option>
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {t(`createCompany.sources.${s.value}`, s.label)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pb-8">
          <p className="w-full text-sm text-gray-500">
            {t('createCompany.submitHint', 'Please note that it may take a few minutes to create a business.')}
          </p>
          <Button
            onClick={() => handleSubmit('create')}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            {submitting ? t('common.saving', 'Saving...') : t('createCompany.submit.create', 'Create')}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit('create_crm')}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            {t('createCompany.submit.createCrm', 'Create and add CRM activity')}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit('create_admin')}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            {t('createCompany.submit.createAdmin', 'Create and add company administrator')}
          </Button>
        </div>
      </div>
    </div>
  );
};
