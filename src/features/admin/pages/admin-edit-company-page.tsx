import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAdminCompany, useUpdateCompany, useDeleteCompany } from '../hooks';
import { useAdminHandbookBookTree, useAdminHandbookVersions } from '../handbook-hooks';
import { adminRoutes } from '../routes';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { axiosClient } from '@/lib/axios-client';
import { X, Upload as UploadIcon, AlertTriangle } from 'lucide-react';
import type { AdminHandbookTreeNode } from '../handbook-types';
import type { UpdateCompanyPayload } from '../types';
import {
  StatusVersionInfoCard,
  defaultStatusVersionInfoValue,
  type StatusVersionInfoValue,
} from '../components/status-version-info-card';

function formatDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function formatDateDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

interface AboutForm {
  title: string;
  customerCompany: string;
  phone: string;
  email: string;
  cvr: string;
  source: string;
}

interface AddressForm {
  street: string;
  zipCode: string;
  city: string;
}

interface SubscriptionForm {
  product: string;
  licensesTotal: string;
  smsCreditsTotal: string;
  smsSending: boolean;
  additionalManuals: string;
  sopText: string;
  optionalDesign: boolean;
  subscriptionStart: string;
  subscriptionEnd: string;
  langDanish: boolean;
  langEnglish: boolean;
  langBulgarian: boolean;
  flagDanish: boolean;
  accessToCourses: boolean;
  hideQuestionsInProgress: boolean;
  turnOffTracking: boolean;
  showEmployees: boolean;
  showRelatives: boolean;
  showDocuments: boolean;
  collapseLists: boolean;
  hideLinks: boolean;
  hideDocuments: boolean;
  seasonalEmployees: boolean;
  paymentInterval: string;
  nextInvoice: string;
}

interface InvoiceForm {
  invoiceNote: string;
}

interface AdminForm {
  allowReset: boolean;
}

interface StatusForm {
  handbookReady: boolean;
  published: boolean;
}

interface BusinessGroupForm {
  customerGroup: string; // select value, '' => null
}

interface LogoForm {
  logoFid: number | null;
  referenceLogoFid: number | null;
  alwaysShowImageTab: boolean;
  homepage: string;
  smsSender: string;
}

interface WhistleblowerForm {
  whistleblowerAccess: boolean;
  whistleblowerDisableAnon: boolean;
  whistleblowerType: string;
  whistleblowerContactUid: string;
}

interface LyricsForm {
  description: string;
  customTerms: boolean;
}

interface LinksForm {
  homepage: string;
  linkDrivesheet: string;
  linkFirePlan: string;
  linkGdpr: string;
  linkIntranet: string;
  linkTimesheet: string;
  additionalInfo: string;
}

interface InternalForm {
  handbookReady: boolean;
  ownHandbookReady: boolean;
  freeDone: boolean;
  demoCompany: boolean;
  testCompany: boolean;
  employeesPopup: string;
}

const SECTION_LABELS = {
  about: 'about',
  address: 'address',
  subscription: 'subscription',
  invoice: 'invoice',
  admin: 'admin',
  status: 'status',
  businessGroup: 'businessGroup',
  logo: 'logo',
  whistleblower: 'whistleblower',
  lyrics: 'lyrics',
  links: 'links',
  internal: 'internal',
} as const;

type SectionKey = keyof typeof SECTION_LABELS;

const TabLink: React.FC<{
  to?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}> = ({ to, active, disabled, onClick, children }) => {
  const base =
    'px-3 py-2 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap';
  if (active) {
    return <span className={`${base} border-gray-900 text-gray-900 font-medium`}>{children}</span>;
  }
  if (disabled) {
    return (
      <span className={`${base} border-transparent text-gray-300 cursor-not-allowed select-none`} aria-disabled="true">
        {children}
      </span>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} border-transparent text-gray-500 hover:text-gray-700`}
      >
        {children}
      </button>
    );
  }
  if (to) {
    return (
      <Link to={to} className={`${base} border-transparent text-gray-500 hover:text-gray-700`}>
        {children}
      </Link>
    );
  }
  return null;
};

export const AdminEditCompanyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('admin');

  const { data: company, isLoading, isError } = useAdminCompany(id);
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  // Sub-tab driven by ?tab= so deep links work; default is the Edit form.
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'edit' | 'toc' | 'delete' | 'versions' | null) ?? 'edit';
  const setTab = (next: 'edit' | 'toc' | 'delete' | 'versions') => {
    const sp = new URLSearchParams(searchParams);
    if (next === 'edit') sp.delete('tab');
    else sp.set('tab', next);
    setSearchParams(sp, { replace: true });
  };

  // Scroll to anchor (e.g. #about-section) once data has rendered, and briefly
  // highlight the target so the admin can see which section is being edited.
  useEffect(() => {
    if (!company || !location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.classList.add('ring-2', 'ring-[#0d0e0e]', 'ring-offset-2', 'transition-shadow', 'duration-500');
    const tid = window.setTimeout(() => {
      target.classList.remove('ring-2', 'ring-[#0d0e0e]', 'ring-offset-2');
    }, 2000);
    return () => window.clearTimeout(tid);
  }, [company, location.hash]);

  // --- Section forms ---
  const [aboutForm, setAboutForm] = useState<AboutForm>({
    title: '',
    customerCompany: '',
    phone: '',
    email: '',
    cvr: '',
    source: '',
  });

  const [addressForm, setAddressForm] = useState<AddressForm>({
    street: '',
    zipCode: '',
    city: '',
  });

  const [subscriptionForm, setSubscriptionForm] = useState<SubscriptionForm>({
    product: '',
    licensesTotal: '',
    smsCreditsTotal: '',
    smsSending: false,
    additionalManuals: '0',
    sopText: '',
    optionalDesign: false,
    subscriptionStart: '',
    subscriptionEnd: '',
    langDanish: true,
    langEnglish: false,
    langBulgarian: false,
    flagDanish: false,
    accessToCourses: false,
    hideQuestionsInProgress: false,
    turnOffTracking: false,
    showEmployees: true,
    showRelatives: false,
    showDocuments: false,
    collapseLists: false,
    hideLinks: false,
    hideDocuments: false,
    seasonalEmployees: false,
    paymentInterval: 'Annual',
    nextInvoice: '',
  });

  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>({ invoiceNote: '' });
  const [adminForm, setAdminForm] = useState<AdminForm>({ allowReset: false });
  const [statusForm, setStatusForm] = useState<StatusForm>({ handbookReady: false, published: true });

  const [businessGroupForm, setBusinessGroupForm] = useState<BusinessGroupForm>({ customerGroup: '' });
  const [logoForm, setLogoForm] = useState<LogoForm>({
    logoFid: null,
    referenceLogoFid: null,
    alwaysShowImageTab: false,
    homepage: '',
    smsSender: '',
  });
  const [whistleblowerForm, setWhistleblowerForm] = useState<WhistleblowerForm>({
    whistleblowerAccess: false,
    whistleblowerDisableAnon: false,
    whistleblowerType: '',
    whistleblowerContactUid: '',
  });
  const [lyricsForm, setLyricsForm] = useState<LyricsForm>({ description: '', customTerms: false });
  const [linksForm, setLinksForm] = useState<LinksForm>({
    homepage: '',
    linkDrivesheet: '',
    linkFirePlan: '',
    linkGdpr: '',
    linkIntranet: '',
    linkTimesheet: '',
    additionalInfo: '',
  });
  const [internalForm, setInternalForm] = useState<InternalForm>({
    handbookReady: false,
    ownHandbookReady: false,
    freeDone: false,
    demoCompany: false,
    testCompany: false,
    employeesPopup: '',
  });

  const [savingSection, setSavingSection] = useState<SectionKey | null>(null);

  // Offers/Documents dropzone state. Uploads go through the shared /files
  // endpoint; rows here are in-memory until persisted to the company entity.
  type UploadedDoc = { fid: number; name: string; url?: string };
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [docsUploading, setDocsUploading] = useState(false);
  const [docsDragOver, setDocsDragOver] = useState(false);
  const docsInputRef = useRef<HTMLInputElement | null>(null);

  const ALLOWED_DOC_EXT = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif', 'txt'];

  const uploadDocs = async (files: File[]) => {
    if (!files.length) return;
    setDocsUploading(true);
    try {
      const next: UploadedDoc[] = [];
      for (const f of files) {
        const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
        if (!ALLOWED_DOC_EXT.includes(ext)) {
          toast.error(t('editCompany.offers.badType', '{{name}}: file type not allowed', { name: f.name }));
          continue;
        }
        const fd = new FormData();
        fd.append('file', f);
        const resp = await axiosClient.post<{ fid: number; uri?: string }>('/files', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (resp.data?.fid) {
          next.push({ fid: resp.data.fid, name: f.name, url: resp.data.uri });
        }
      }
      if (next.length) {
        setDocs((prev) => [...prev, ...next]);
        toast.success(t('editCompany.offers.uploaded', '{{count}} file(s) uploaded', { count: next.length }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(t('editCompany.offers.uploadFailed', 'Upload failed: {{message}}', { message: msg }));
    } finally {
      setDocsUploading(false);
    }
  };

  const handleDocsDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDocsDragOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    void uploadDocs(files);
  };

  const handleDocsFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    void uploadDocs(files);
  };

  const removeDoc = (fid: number) => {
    setDocs((prev) => prev.filter((d) => d.fid !== fid));
  };

  const [sviValue, setSviValue] = useState<StatusVersionInfoValue>(() =>
    defaultStatusVersionInfoValue(''),
  );

  // Initialize forms from loaded data
  useEffect(() => {
    if (!company) return;
    setAboutForm({
      title: company.title ?? '',
      customerCompany: '',
      phone: company.phone ?? '',
      email: company.email ?? '',
      cvr: company.cvr ?? '',
      source: company.category ?? '',
    });
    setAddressForm({
      street: company.street ?? '',
      zipCode: company.zipCode ?? '',
      city: company.city ?? '',
    });
    setSubscriptionForm((prev) => ({
      ...prev,
      product: company.productName ?? '',
      licensesTotal: String(company.licensesTotal ?? ''),
      smsCreditsTotal: String(company.smsCreditsTotal ?? ''),
      subscriptionStart: formatDateForInput(company.subscriptionStart),
      subscriptionEnd: formatDateForInput(company.subscriptionEnd),
    }));
    setAdminForm({ allowReset: !!company.extended?.allowReset });
    setStatusForm({
      handbookReady: !!company.keyFigures?.published,
      published: company.status === 1,
    });

    const ext = company.extended;
    if (ext) {
      setBusinessGroupForm({
        customerGroup: ext.customerGroup == null ? '' : String(ext.customerGroup),
      });
      setLogoForm({
        logoFid: ext.logoFid,
        referenceLogoFid: ext.referenceLogoFid,
        alwaysShowImageTab: !!ext.alwaysShowImageTab,
        homepage: ext.homepage ?? '',
        smsSender: ext.smsSender ?? '',
      });
      setWhistleblowerForm({
        whistleblowerAccess: !!company.whistleblowerAccess,
        whistleblowerDisableAnon: !!ext.whistleblowerDisableAnon,
        whistleblowerType: ext.whistleblowerType ?? '',
        whistleblowerContactUid:
          ext.whistleblowerContactUid == null ? '' : String(ext.whistleblowerContactUid),
      });
      setLyricsForm({
        description: '',
        customTerms: !!ext.customTerms,
      });
      setLinksForm({
        homepage: ext.homepage ?? '',
        linkDrivesheet: ext.linkDrivesheet ?? '',
        linkFirePlan: ext.linkFirePlan ?? '',
        linkGdpr: ext.linkGdpr ?? '',
        linkIntranet: ext.linkIntranet ?? '',
        linkTimesheet: ext.linkTimesheet ?? '',
        additionalInfo: ext.additionalInfo ?? '',
      });
      setInternalForm({
        handbookReady: !!company.keyFigures?.published,
        ownHandbookReady: !!ext.ownHandbookReady,
        freeDone: !!ext.freeDone,
        demoCompany: !!ext.demoCompany,
        testCompany: !!ext.testCompany,
        employeesPopup: '',
      });
    }
  }, [company]);

  const primaryContact = company?.contacts?.find((c) => c.isPrimary) ?? company?.contacts?.[0];

  // Confirm dialog shown when the admin changes the company email (login
  // credentials for the handbook console are sent to the new address).
  const [emailConfirmOpen, setEmailConfirmOpen] = useState(false);

  const saveSection = async (section: SectionKey, payload: UpdateCompanyPayload) => {
    if (!id) return;
    setSavingSection(section);
    try {
      await updateCompany.mutateAsync({ companyId: id, data: payload as Record<string, unknown> });
      toast.success(t('editCompany.saveSuccess', 'Changes saved'));
    } catch (err) {
      const apiError = (err as { apiError?: { code?: string; message?: string } }).apiError;
      toast.error(
        apiError?.code === 'CONFLICT' && apiError.message
          ? apiError.message
          : t('editCompany.saveFailed', 'Failed to save changes'),
      );
    } finally {
      setSavingSection(null);
    }
  };

  const buildAboutPayload = (): UpdateCompanyPayload => ({
    title: aboutForm.title,
    phone: aboutForm.phone,
    email: aboutForm.email,
    cvr: aboutForm.cvr,
  });

  const handleSaveAbout = () => {
    const emailTrimmed = aboutForm.email.trim();
    const emailChanged = emailTrimmed !== (company?.email ?? '').trim();
    // Changing to a non-empty email triggers a set-password invite — confirm first.
    if (emailChanged && emailTrimmed.length > 0) {
      setEmailConfirmOpen(true);
      return;
    }
    void saveSection('about', buildAboutPayload());
  };

  const confirmSaveAbout = () => {
    setEmailConfirmOpen(false);
    void saveSection('about', buildAboutPayload());
  };

  const handleSaveAddress = () => {
    void saveSection('address', {
      street: addressForm.street,
      zipCode: addressForm.zipCode,
      city: addressForm.city,
    });
  };

  const handleSaveSubscription = () => {
    const payload: UpdateCompanyPayload = {
      licensesTotal: subscriptionForm.licensesTotal ? parseInt(subscriptionForm.licensesTotal, 10) : undefined,
      smsCreditsTotal: subscriptionForm.smsCreditsTotal ? parseInt(subscriptionForm.smsCreditsTotal, 10) : undefined,
      subscriptionStart: subscriptionForm.subscriptionStart || undefined,
      subscriptionEnd: subscriptionForm.subscriptionEnd || undefined,
      paymentInterval: subscriptionForm.paymentInterval || undefined,
      nextInvoice: subscriptionForm.nextInvoice || undefined,
    };
    void saveSection('subscription', payload);
  };

  const handleSaveInvoice = () => {
    void saveSection('invoice', { invoiceNote: invoiceForm.invoiceNote });
  };

  const handleSaveAdmin = () => {
    void saveSection('admin', { allowReset: adminForm.allowReset });
  };

  const handleSaveStatus = () => {
    void saveSection('status', {
      handbookReady: statusForm.handbookReady,
      status: statusForm.published ? 1 : 0,
    });
  };

  const handleSaveBusinessGroup = () => {
    void saveSection('businessGroup', {
      customerGroup: businessGroupForm.customerGroup ? parseInt(businessGroupForm.customerGroup, 10) : null,
    });
  };

  const handleSaveLogo = () => {
    void saveSection('logo', {
      logoFid: logoForm.logoFid,
      referenceLogoFid: logoForm.referenceLogoFid,
      alwaysShowImageTab: logoForm.alwaysShowImageTab,
      homepage: logoForm.homepage,
      smsSender: logoForm.smsSender,
    });
  };

  const handleSaveWhistleblower = () => {
    void saveSection('whistleblower', {
      whistleblowerAccess: whistleblowerForm.whistleblowerAccess,
      whistleblowerDisableAnon: whistleblowerForm.whistleblowerDisableAnon,
      whistleblowerType: whistleblowerForm.whistleblowerType,
      whistleblowerContactUid: whistleblowerForm.whistleblowerContactUid
        ? parseInt(whistleblowerForm.whistleblowerContactUid, 10)
        : null,
    });
  };

  const handleSaveLyrics = () => {
    void saveSection('lyrics', {
      sop: lyricsForm.description,
      customTerms: lyricsForm.customTerms,
    });
  };

  const handleSaveLinks = () => {
    void saveSection('links', {
      homepage: linksForm.homepage,
      linkDrivesheet: linksForm.linkDrivesheet,
      linkFirePlan: linksForm.linkFirePlan,
      linkGdpr: linksForm.linkGdpr,
      linkIntranet: linksForm.linkIntranet,
      linkTimesheet: linksForm.linkTimesheet,
      additionalInfo: linksForm.additionalInfo,
    });
  };

  const handleSaveInternal = () => {
    void saveSection('internal', {
      handbookReady: internalForm.handbookReady,
      ownHandbookReady: internalForm.ownHandbookReady,
      freeDone: internalForm.freeDone,
      demoCompany: internalForm.demoCompany,
      testCompany: internalForm.testCompany,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        </div>
      </div>
    );
  }

  if (isError || !company || !id) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        <Link
          to={adminRoutes.companies}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          &larr; {t('editCompany.backToCompanies', 'Back to Companies')}
        </Link>
        <div className="text-center py-20">
          <p className="text-red-600 font-medium">
            {t('editCompany.loadError', 'Failed to load company.')}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(adminRoutes.companies)}>
            {t('editCompany.goBack', 'Go back')}
          </Button>
        </div>
      </div>
    );
  }

  const companyDetailPath = adminRoutes.companyDetail.replace(':id', id);
  const isSaving = (section: SectionKey) => savingSection === section;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-xs sm:text-sm text-gray-500">
        <Link to={adminRoutes.dashboard} className="hover:text-gray-700">
          {t('editCompany.console', 'Console')}
        </Link>
        <span className="text-gray-300">/</span>
        <Link to={adminRoutes.companies} className="hover:text-gray-700">
          {t('editCompany.companies', 'Companies')}
        </Link>
        <span className="text-gray-300">/</span>
        <Link to={companyDetailPath} className="hover:text-gray-700 truncate max-w-[160px]">
          {company.title}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700">{t('editCompany.edit', 'Edit')}</span>
      </nav>

      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
          {t('editCompany.title', 'Edit Company')} &mdash; {company.title}
        </h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          <TabLink to={companyDetailPath}>{t('editCompany.tabs.view', 'View')}</TabLink>
          <TabLink active={activeTab === 'edit'} onClick={() => setTab('edit')}>
            {t('editCompany.tabs.edit', 'Edit')}
          </TabLink>
          <TabLink active={activeTab === 'toc'} onClick={() => setTab('toc')}>
            {t('editCompany.tabs.toc', 'Table of Contents')}
          </TabLink>
          <TabLink active={activeTab === 'delete'} onClick={() => setTab('delete')}>
            {t('editCompany.tabs.delete', 'Delete')}
          </TabLink>
          <TabLink active={activeTab === 'versions'} onClick={() => setTab('versions')}>
            {t('editCompany.tabs.versions', 'Versions')}
          </TabLink>
        </div>
      </div>

      {activeTab === 'toc' && (
        <CompanyTocPanel companyHandbooks={company.handbooks} />
      )}
      {activeTab === 'delete' && (
        <CompanyDeletePanel
          companyId={Number(id)}
          companyTitle={company.title}
          onDeleted={() => navigate(adminRoutes.companies)}
          deleting={deleteCompany.isPending}
          onConfirm={async () => {
            try {
              await deleteCompany.mutateAsync(id);
              toast.success(t('editCompany.delete.success', 'Company queued for deletion'));
              navigate(adminRoutes.companies);
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              toast.error(t('editCompany.delete.failed', 'Delete failed: {{message}}', { message: msg }));
            }
          }}
        />
      )}
      {activeTab === 'versions' && (
        <CompanyVersionsPanel companyHandbooks={company.handbooks} />
      )}

      {activeTab === 'edit' && (<>

      {/* About the Company */}
      <Card id="about-section">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            {t('editCompany.about.title', 'About the Company')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="about-title">
                {t('editCompany.about.name', 'Company name')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="about-title"
                value={aboutForm.title}
                onChange={(e) => setAboutForm((p) => ({ ...p, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="about-customer">{t('editCompany.about.customerCompany', 'Customer company')}</Label>
              <Input
                id="about-customer"
                value={aboutForm.customerCompany}
                onChange={(e) => setAboutForm((p) => ({ ...p, customerCompany: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('editCompany.about.primaryContact', 'Primary contact person')}</Label>
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {primaryContact ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                  <span className="font-medium text-gray-900">{primaryContact.name}</span>
                  <span className="text-gray-500">{primaryContact.email}</span>
                  {primaryContact.phone ? (
                    <span className="text-gray-500">{primaryContact.phone}</span>
                  ) : null}
                </div>
              ) : (
                <span className="text-gray-400">
                  {t('editCompany.about.noContact', 'No primary contact assigned')}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="about-phone">{t('editCompany.about.phone', 'Company phone')}</Label>
              <Input
                id="about-phone"
                value={aboutForm.phone}
                onChange={(e) => setAboutForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="about-email">{t('editCompany.about.email', 'Company email')}</Label>
              <Input
                id="about-email"
                type="email"
                value={aboutForm.email}
                onChange={(e) => setAboutForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="about-cvr">{t('editCompany.about.cvr', 'CVR number')}</Label>
              <Input
                id="about-cvr"
                value={aboutForm.cvr}
                onChange={(e) => setAboutForm((p) => ({ ...p, cvr: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="about-source">{t('editCompany.about.source', 'Source')}</Label>
              <select
                id="about-source"
                value={aboutForm.source}
                onChange={(e) => setAboutForm((p) => ({ ...p, source: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
              >
                <option value="">{t('editCompany.about.sourceNone', '- None -')}</option>
                <option value="referral">{t('editCompany.source.referral', 'Referral')}</option>
                <option value="google">{t('editCompany.source.google', 'Google')}</option>
                <option value="linkedin">{t('editCompany.source.linkedin', 'LinkedIn')}</option>
                <option value="direct">{t('editCompany.source.direct', 'Direct')}</option>
                <option value="other">{t('editCompany.source.other', 'Other')}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveAbout}
              disabled={isSaving('about') || !aboutForm.title.trim()}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              {isSaving('about')
                ? t('editCompany.saving', 'Saving...')
                : t('editCompany.save', 'Save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card id="address-section">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            {t('editCompany.address.title', 'Address')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="addr-street">{t('editCompany.address.street', 'Street and number')}</Label>
            <Input
              id="addr-street"
              value={addressForm.street}
              onChange={(e) => setAddressForm((p) => ({ ...p, street: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addr-zip">{t('editCompany.address.postal', 'Postal code')}</Label>
              <Input
                id="addr-zip"
                value={addressForm.zipCode}
                onChange={(e) => setAddressForm((p) => ({ ...p, zipCode: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-city">{t('editCompany.address.town', 'Town')}</Label>
              <Input
                id="addr-city"
                value={addressForm.city}
                onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveAddress}
              disabled={isSaving('address')}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              {isSaving('address')
                ? t('editCompany.saving', 'Saving...')
                : t('editCompany.save', 'Save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card id="subscription-section">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            {t('editCompany.subscription.title', 'Subscription')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sub-product">{t('editCompany.subscription.product', 'Product')}</Label>
              <select
                id="sub-product"
                value={subscriptionForm.product}
                onChange={(e) => setSubscriptionForm((p) => ({ ...p, product: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">{t('editCompany.subscription.productNone', '- None -')}</option>
                <option value="The staff handbook">
                  {t('editCompany.subscription.productStaff', 'The staff handbook')}
                </option>
                <option value="Free Sample">
                  {t('editCompany.subscription.productFree', 'Free Sample')}
                </option>
                <option value="Free Sample Not used">
                  {t('editCompany.subscription.productFreeNotUsed', 'Free Sample Not used')}
                </option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-licenses">
                {t('editCompany.subscription.licenses', 'Licenses')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sub-licenses"
                type="number"
                min={0}
                required
                value={subscriptionForm.licensesTotal}
                onChange={(e) =>
                  setSubscriptionForm((p) => ({ ...p, licensesTotal: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sub-sms">{t('editCompany.subscription.smsCount', 'Number of SMS')}</Label>
              <Input
                id="sub-sms"
                type="number"
                min={0}
                value={subscriptionForm.smsCreditsTotal}
                onChange={(e) =>
                  setSubscriptionForm((p) => ({ ...p, smsCreditsTotal: e.target.value }))
                }
              />
              <label className="flex items-center gap-2 pt-1 text-sm text-gray-700">
                <Checkbox
                  checked={subscriptionForm.smsSending}
                  onChange={(e) =>
                    setSubscriptionForm((p) => ({ ...p, smsSending: e.target.checked }))
                  }
                />
                {t('editCompany.subscription.sending', 'Sending')}
              </label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-manuals">
                {t('editCompany.subscription.additionalManuals', 'Additional manuals')}
              </Label>
              <Input
                id="sub-manuals"
                type="number"
                value={subscriptionForm.additionalManuals}
                readOnly
                disabled
                className="bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-sop">{t('editCompany.subscription.sopText', 'SOP text')}</Label>
            <Textarea
              id="sub-sop"
              rows={3}
              value={subscriptionForm.sopText}
              onChange={(e) => setSubscriptionForm((p) => ({ ...p, sopText: e.target.value }))}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <Checkbox
              checked={subscriptionForm.optionalDesign}
              onChange={(e) =>
                setSubscriptionForm((p) => ({ ...p, optionalDesign: e.target.checked }))
              }
            />
            {t('editCompany.subscription.optionalDesign', 'Optional design')}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sub-start">
                {t('editCompany.subscription.start', 'Subscription start')}
              </Label>
              <Input
                id="sub-start"
                type="date"
                value={subscriptionForm.subscriptionStart}
                onChange={(e) =>
                  setSubscriptionForm((p) => ({ ...p, subscriptionStart: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-end">{t('editCompany.subscription.end', 'Subscription end')}</Label>
              <Input
                id="sub-end"
                type="date"
                value={subscriptionForm.subscriptionEnd}
                onChange={(e) =>
                  setSubscriptionForm((p) => ({ ...p, subscriptionEnd: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('editCompany.subscription.languagesAvailable', 'Languages available')}</Label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <Checkbox
                  checked={subscriptionForm.langDanish}
                  onChange={(e) =>
                    setSubscriptionForm((p) => ({ ...p, langDanish: e.target.checked }))
                  }
                />
                {t('editCompany.subscription.langDanish', 'Danish')}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <Checkbox
                  checked={subscriptionForm.langEnglish}
                  onChange={(e) =>
                    setSubscriptionForm((p) => ({ ...p, langEnglish: e.target.checked }))
                  }
                />
                {t('editCompany.subscription.langEnglish', 'English')}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <Checkbox
                  checked={subscriptionForm.langBulgarian}
                  onChange={(e) =>
                    setSubscriptionForm((p) => ({ ...p, langBulgarian: e.target.checked }))
                  }
                />
                {t('editCompany.subscription.langBulgarian', 'Bulgarian')}
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('editCompany.subscription.settings', 'Settings')}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {(
                [
                  ['flagDanish', t('editCompany.subscription.flagDanish', 'Danish')],
                  ['accessToCourses', t('editCompany.subscription.accessToCourses', 'Give access to courses')],
                  [
                    'hideQuestionsInProgress',
                    t('editCompany.subscription.hideQuestions', 'Hide questions in progress'),
                  ],
                  ['turnOffTracking', t('editCompany.subscription.turnOffTracking', 'Turn off tracking')],
                  ['showEmployees', t('editCompany.subscription.showEmployees', 'Show employees in the info list')],
                  ['showRelatives', t('editCompany.subscription.showRelatives', 'Show relatives in the info list')],
                  ['showDocuments', t('editCompany.subscription.showDocuments', 'Show documents in the info list')],
                  ['collapseLists', t('editCompany.subscription.collapseLists', 'Collapse lists in the info list')],
                  ['hideLinks', t('editCompany.subscription.hideLinks', 'Hide links')],
                  ['hideDocuments', t('editCompany.subscription.hideDocuments', 'Hide documents')],
                  [
                    'seasonalEmployees',
                    t('editCompany.subscription.seasonalEmployees', 'Have seasonal employees'),
                  ],
                ] as Array<[keyof SubscriptionForm, string]>
              ).map(([key, label]) => (
                <label key={String(key)} className="flex items-center gap-2 text-sm text-gray-700">
                  <Checkbox
                    checked={Boolean(subscriptionForm[key])}
                    onChange={(e) =>
                      setSubscriptionForm((p) => ({ ...p, [key]: e.target.checked }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sub-payment">
                {t('editCompany.subscription.paymentMethod', 'Payment method')}
              </Label>
              <select
                id="sub-payment"
                value={subscriptionForm.paymentInterval}
                onChange={(e) =>
                  setSubscriptionForm((p) => ({ ...p, paymentInterval: e.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="Annual">{t('editCompany.subscription.annual', 'Annual')}</option>
                <option value="Quarterly">
                  {t('editCompany.subscription.quarterly', 'Quarterly')}
                </option>
                <option value="Monthly">{t('editCompany.subscription.monthly', 'Monthly')}</option>
                <option value="None">{t('editCompany.subscription.none', 'None')}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-next">
                {t('editCompany.subscription.nextBilling', 'Next billing')}
              </Label>
              <Input
                id="sub-next"
                type="date"
                value={subscriptionForm.nextInvoice}
                onChange={(e) =>
                  setSubscriptionForm((p) => ({ ...p, nextInvoice: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveSubscription}
              disabled={isSaving('subscription') || !subscriptionForm.licensesTotal}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              {isSaving('subscription')
                ? t('editCompany.saving', 'Saving...')
                : t('editCompany.save', 'Save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Note to invoice */}
      <Card id="invoice-section">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            {t('editCompany.invoice.title', 'Note to invoice')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            rows={6}
            value={invoiceForm.invoiceNote}
            onChange={(e) => setInvoiceForm({ invoiceNote: e.target.value })}
            placeholder={t('editCompany.invoice.placeholder', 'Add a note that will appear on invoices...')}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSaveInvoice}
              disabled={isSaving('invoice')}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              {isSaving('invoice')
                ? t('editCompany.saving', 'Saving...')
                : t('editCompany.save', 'Save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Business Group */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            {t('editCompany.businessGroup.title', 'Business Group')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bg-group">
              {t('editCompany.businessGroup.group', 'Business group')}
            </Label>
            <select
              id="bg-group"
              value={businessGroupForm.customerGroup}
              onChange={(e) =>
                setBusinessGroupForm({ customerGroup: e.target.value })
              }
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">{t('editCompany.businessGroup.none', '— No group —')}</option>
              <option value="1">{t('editCompany.businessGroup.a', 'Group A')}</option>
              <option value="2">{t('editCompany.businessGroup.b', 'Group B')}</option>
            </select>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveBusinessGroup}
              disabled={isSaving('businessGroup')}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              {isSaving('businessGroup')
                ? t('editCompany.saving', 'Saving...')
                : t('editCompany.save', 'Save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logo & Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            {t('editCompany.logo.title', 'Logo & Images')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('editCompany.logo.logo', 'Logo')}</Label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">
                  {logoForm.logoFid != null
                    ? `${t('editCompany.logo.file', 'File')} #${logoForm.logoFid}`
                    : t('editCompany.logo.noFile', 'No file')}
                </span>
                <Button type="button" variant="outline" size="sm" disabled>
                  {t('editCompany.logo.choose', 'Choose File')}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('editCompany.logo.referenceLogo', 'Reference logo')}</Label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">
                  {logoForm.referenceLogoFid != null
                    ? `${t('editCompany.logo.file', 'File')} #${logoForm.referenceLogoFid}`
                    : t('editCompany.logo.noFile', 'No file')}
                </span>
                <Button type="button" variant="outline" size="sm" disabled>
                  {t('editCompany.logo.choose', 'Choose File')}
                </Button>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <Checkbox
              checked={logoForm.alwaysShowImageTab}
              onChange={(e) =>
                setLogoForm((p) => ({ ...p, alwaysShowImageTab: e.target.checked }))
              }
            />
            {t('editCompany.logo.alwaysShow', 'Always show image tab')}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logo-homepage">{t('editCompany.logo.homepage', 'Homepage')}</Label>
              <Input
                id="logo-homepage"
                type="url"
                value={logoForm.homepage}
                onChange={(e) => setLogoForm((p) => ({ ...p, homepage: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo-sms">
                {t('editCompany.logo.smsSender', 'Sender name on SMS messages')}
              </Label>
              <Input
                id="logo-sms"
                value={logoForm.smsSender}
                onChange={(e) => setLogoForm((p) => ({ ...p, smsSender: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveLogo}
              disabled={isSaving('logo')}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              {isSaving('logo')
                ? t('editCompany.saving', 'Saving...')
                : t('editCompany.save', 'Save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CRM Contacts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">
              {t('editCompany.crmContacts.title', 'CRM Contacts')}
            </CardTitle>
            <span className="inline-flex items-center rounded-full bg-gray-900 text-white text-xs px-2.5 py-1">
              {t('editCompany.crmContacts.tag', 'CRM contacts')}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            disabled
            placeholder={t('editCompany.crmContacts.search', 'Search contacts...')}
          />
          <div className="rounded-md border border-gray-200 divide-y divide-gray-100">
            {company.contacts && company.contacts.length > 0 ? (
              company.contacts.map((c) => (
                <div
                  key={c.uid}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-gray-900 truncate">{c.name}</span>
                  <span className="text-gray-600 truncate">{c.email}</span>
                  <span className="text-gray-500 truncate">
                    {c.isPrimary
                      ? t('editCompany.crmContacts.primary', 'Primary contact')
                      : t('editCompany.crmContacts.contact', 'Contact')}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">
                {t('editCompany.crmContacts.empty', 'No contacts')}
              </div>
            )}
          </div>
          <Button type="button" variant="outline" size="sm" disabled>
            {t('editCompany.crmContacts.add', 'Add Another Entry')}
          </Button>
        </CardContent>
      </Card>

      {/* Offers, Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            {t('editCompany.offers.title', 'Offers, Documents')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={docsInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt"
            className="hidden"
            onChange={handleDocsFileInput}
          />
          <label
            htmlFor="company-docs-upload"
            onClick={(e) => {
              e.preventDefault();
              docsInputRef.current?.click();
            }}
            onDragOver={(e) => { e.preventDefault(); setDocsDragOver(true); }}
            onDragLeave={() => setDocsDragOver(false)}
            onDrop={handleDocsDrop}
            className={`block cursor-pointer rounded-md border-2 border-dashed px-4 py-10 text-center transition-colors ${
              docsDragOver ? 'border-gray-500 bg-gray-50' : 'border-gray-300 hover:border-gray-400'
            } ${docsUploading ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <UploadIcon className="h-5 w-5 mx-auto text-gray-400" />
            <p className="text-sm font-medium text-gray-700 mt-2">
              {docsUploading
                ? t('editCompany.offers.uploading', 'Uploading…')
                : t('editCompany.offers.addNew', 'Add a new file')}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t('editCompany.offers.dragHere', 'Drag and drop files here, or click to browse')}
            </p>
          </label>

          {docs.length > 0 && (
            <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
              {docs.map((d) => (
                <li key={d.fid} className="flex items-center justify-between px-3 py-2 text-sm">
                  {d.url ? (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-800 hover:underline truncate"
                    >
                      {d.name}
                    </a>
                  ) : (
                    <span className="text-gray-800 truncate">{d.name}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeDoc(d.fid)}
                    className="text-gray-400 hover:text-red-600"
                    aria-label={t('common.remove', 'Remove')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="text-xs text-gray-500">
            {t(
              'editCompany.offers.allowed',
              'Allowed extensions: pdf, doc, docx, xls, xlsx, png, jpg, jpeg, gif, txt',
            )}
          </p>
        </CardContent>
      </Card>

      {/* Whistleblower Scheme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            &#9660; {t('editCompany.whistleblower.title', 'Whistleblower Scheme')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <Checkbox
              checked={whistleblowerForm.whistleblowerAccess}
              onChange={(e) =>
                setWhistleblowerForm((p) => ({ ...p, whistleblowerAccess: e.target.checked }))
              }
            />
            {t('editCompany.whistleblower.enable', 'Enable')}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <Checkbox
              checked={whistleblowerForm.whistleblowerDisableAnon}
              onChange={(e) =>
                setWhistleblowerForm((p) => ({ ...p, whistleblowerDisableAnon: e.target.checked }))
              }
            />
            {t('editCompany.whistleblower.disableAnon', 'Disable anonymous reports')}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wb-type">{t('editCompany.whistleblower.type', 'Type')}</Label>
              <Input
                id="wb-type"
                value={whistleblowerForm.whistleblowerType}
                onChange={(e) =>
                  setWhistleblowerForm((p) => ({ ...p, whistleblowerType: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wb-uid">
                {t('editCompany.whistleblower.contactUid', 'Contact user UID')}
              </Label>
              <Input
                id="wb-uid"
                type="number"
                min={0}
                value={whistleblowerForm.whistleblowerContactUid}
                onChange={(e) =>
                  setWhistleblowerForm((p) => ({ ...p, whistleblowerContactUid: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveWhistleblower}
              disabled={isSaving('whistleblower')}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              {isSaving('whistleblower')
                ? t('editCompany.saving', 'Saving...')
                : t('editCompany.save', 'Save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lyrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            &#9660; {t('editCompany.lyrics.title', 'Lyrics')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            {t(
              'editCompany.lyrics.instruction',
              "The company's own texts. Generally not edited here. See on the company's own handbook form",
            )}
          </p>

          <div className="space-y-2">
            <Label htmlFor="lyrics-desc">
              {t('editCompany.lyrics.description', 'Description')}
            </Label>
            <Textarea
              id="lyrics-desc"
              rows={6}
              value={lyricsForm.description}
              onChange={(e) => setLyricsForm((p) => ({ ...p, description: e.target.value }))}
              placeholder={t('editCompany.lyrics.wysiwyg', 'WYSIWYG editor placeholder...')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('editCompany.lyrics.nameTemplates', 'Name templates')}</Label>
            <div className="flex flex-wrap gap-2">
              {['Company_short_name', 'Company_medium_name', 'Company_admin', 'Owner_titling'].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 text-xs px-2.5 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('editCompany.lyrics.sexFormat', 'Sex format')}</Label>
            <div className="flex flex-wrap gap-2">
              {['First letter', 'Hours', 'Date', 'Design'].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 text-xs px-2.5 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <Checkbox
              checked={lyricsForm.customTerms}
              onChange={(e) => setLyricsForm((p) => ({ ...p, customTerms: e.target.checked }))}
            />
            {t('editCompany.lyrics.customTerms', 'Custom terms')}
          </label>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveLyrics}
              disabled={isSaving('lyrics')}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              {isSaving('lyrics')
                ? t('editCompany.saving', 'Saving...')
                : t('editCompany.save', 'Save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card id="links-section">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            &#9660; {t('editCompany.links.title', 'Links')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            {t('editCompany.links.subtext', 'Links to external resources')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="link-homepage">{t('editCompany.links.homepage', 'Homepage')}</Label>
              <Input
                id="link-homepage"
                type="url"
                value={linksForm.homepage}
                onChange={(e) => setLinksForm((p) => ({ ...p, homepage: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-drivesheet">
                {t('editCompany.links.drivesheet', 'Drivesheet link')}
              </Label>
              <Input
                id="link-drivesheet"
                type="url"
                value={linksForm.linkDrivesheet}
                onChange={(e) => setLinksForm((p) => ({ ...p, linkDrivesheet: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-fire">{t('editCompany.links.fire', 'Fire plan link')}</Label>
              <Input
                id="link-fire"
                type="url"
                value={linksForm.linkFirePlan}
                onChange={(e) => setLinksForm((p) => ({ ...p, linkFirePlan: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-gdpr">{t('editCompany.links.gdpr', 'GDPR link')}</Label>
              <Input
                id="link-gdpr"
                type="url"
                value={linksForm.linkGdpr}
                onChange={(e) => setLinksForm((p) => ({ ...p, linkGdpr: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-intranet">
                {t('editCompany.links.intranet', 'Intranet link')}
              </Label>
              <Input
                id="link-intranet"
                type="url"
                value={linksForm.linkIntranet}
                onChange={(e) => setLinksForm((p) => ({ ...p, linkIntranet: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-timesheet">
                {t('editCompany.links.timesheet', 'Timesheet link')}
              </Label>
              <Input
                id="link-timesheet"
                type="url"
                value={linksForm.linkTimesheet}
                onChange={(e) => setLinksForm((p) => ({ ...p, linkTimesheet: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link-additional">
              {t('editCompany.links.additional', 'Additional Information')}
            </Label>
            <Textarea
              id="link-additional"
              rows={3}
              value={linksForm.additionalInfo}
              onChange={(e) => setLinksForm((p) => ({ ...p, additionalInfo: e.target.value }))}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveLinks}
              disabled={isSaving('links')}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              {isSaving('links')
                ? t('editCompany.saving', 'Saving...')
                : t('editCompany.save', 'Save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Internal Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            &#9660; {t('editCompany.internal.title', 'Internal Fields')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            {t(
              'editCompany.internal.helper',
              'Fields used by the system and not normally edited manually.',
            )}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {(
              [
                ['handbookReady', t('editCompany.internal.handbookReady', 'The handbook has been published')],
                ['ownHandbookReady', t('editCompany.internal.ownHandbook', 'Own handbook ready')],
                ['freeDone', t('editCompany.internal.freeDone', 'Free course completed')],
                ['demoCompany', t('editCompany.internal.demo', 'Demo company')],
                ['testCompany', t('editCompany.internal.test', 'Test company')],
              ] as Array<[keyof InternalForm, string]>
            ).map(([key, label]) => (
              <label key={String(key)} className="flex items-center gap-2 text-sm text-gray-700">
                <Checkbox
                  checked={Boolean(internalForm[key])}
                  onChange={(e) =>
                    setInternalForm((p) => ({ ...p, [key]: e.target.checked }))
                  }
                />
                {label}
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="int-popup">
                {t('editCompany.internal.employeesPopup', 'Number of employees pop up')}
              </Label>
              <Input
                id="int-popup"
                type="number"
                min={0}
                value={internalForm.employeesPopup}
                onChange={(e) =>
                  setInternalForm((p) => ({ ...p, employeesPopup: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveInternal}
              disabled={isSaving('internal')}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              {isSaving('internal')
                ? t('editCompany.saving', 'Saving...')
                : t('editCompany.save', 'Save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Administrative Settings */}
      <Card id="admin-allow-reset">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            {t('editCompany.admin.title', 'Administrative Settings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <Checkbox
              className="mt-0.5"
              checked={adminForm.allowReset}
              onChange={(e) =>
                setAdminForm({ allowReset: e.target.checked })
              }
            />
            <span>
              <span className="font-medium">{t('editCompany.admin.allowReset', 'Allow reset')}</span>
              <span className="block text-xs text-gray-500">
                {t('editCompany.admin.allowResetHint', 'Check here to enable resetting of company data.')}
              </span>
            </span>
          </label>
          <div className="flex justify-end">
            <Button
              onClick={handleSaveAdmin}
              disabled={isSaving('admin')}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              {isSaving('admin')
                ? t('editCompany.saving', 'Saving...')
                : t('editCompany.save', 'Save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status & Version Info (tabbed) */}
      <StatusVersionInfoCard
        value={sviValue}
        onChange={setSviValue}
        published={statusForm.published}
        onPublishedChange={(v) => setStatusForm((p) => ({ ...p, published: v }))}
        authorDisplay={primaryContact?.name ?? '—'}
        lastSavedLabel={
          company.keyFigures?.lastEdited
            ? formatDateDisplay(
                new Date(company.keyFigures.lastEdited * 1000).toISOString(),
              )
            : undefined
        }
        onSave={handleSaveStatus}
        onCancel={() => navigate(companyDetailPath)}
        saving={isSaving('status')}
      />
      </>)}

      {/* Confirm sending login credentials when the company email changes */}
      <Dialog open={emailConfirmOpen} onOpenChange={(o) => { if (!o) setEmailConfirmOpen(false); }}>
        <DialogContent className="sm:max-w-md p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">
            {t('editCompany.emailConfirm.title', 'Send login credentials?')}
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            {t(
              'editCompany.emailConfirm.body',
              'Login credentials for the handbook console will be sent to {{email}}. The contact person can use them to set a password and access their console.',
              { email: aboutForm.email.trim() },
            )}
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setEmailConfirmOpen(false)}>
              {t('editCompany.emailConfirm.cancel', 'Cancel')}
            </Button>
            <Button
              className="bg-gray-900 text-white hover:bg-gray-800"
              disabled={isSaving('about')}
              onClick={confirmSaveAbout}
            >
              {isSaving('about')
                ? t('editCompany.saving', 'Saving...')
                : t('editCompany.emailConfirm.confirm', 'Save & send')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Sub-tab panels (TOC / Delete / Versions) ────────────────────────────────

const CompanyTocPanel: React.FC<{ companyHandbooks: Array<{ nid: number; title: string }> }> = ({ companyHandbooks }) => {
  const { t } = useTranslation('admin');
  const primary = companyHandbooks[0];
  const { data: tree = [], isLoading } = useAdminHandbookBookTree(primary ? primary.nid : null);

  if (!primary) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-gray-500 text-center">
          {t('editCompany.toc.empty', 'This company has no handbook assigned yet.')}
        </CardContent>
      </Card>
    );
  }

  const renderTree = (nodes: AdminHandbookTreeNode[]) => (
    <ul className="text-sm">
      {nodes.map((n) => (
        <li key={n.nid} className="py-0.5">
          <span className="text-gray-500 mr-1">·</span>
          <Link
            to={adminRoutes.handbookPage.replace(':nid', String(n.nid))}
            className="text-[#0d0e0e] hover:underline"
          >
            {n.title}
          </Link>
          {n.children.length > 0 && (
            <div className="pl-5 border-l border-gray-100 ml-1 mt-0.5">{renderTree(n.children)}</div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">
          {t('editCompany.toc.title', 'Table of Contents')} — {primary.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-gray-500">{t('common.loading', 'Loading…')}</p>
        ) : tree.length === 0 ? (
          <p className="text-sm text-gray-500">{t('editCompany.toc.noPages', 'This handbook has no pages yet.')}</p>
        ) : (
          renderTree(tree)
        )}
      </CardContent>
    </Card>
  );
};

const CompanyDeletePanel: React.FC<{
  companyId: number;
  companyTitle: string;
  onDeleted: () => void;
  onConfirm: () => Promise<void>;
  deleting: boolean;
}> = ({ companyTitle, onConfirm, deleting }) => {
  const { t } = useTranslation('admin');
  const [confirmTitle, setConfirmTitle] = useState('');
  const matches = confirmTitle.trim() === companyTitle.trim();

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          {t('editCompany.delete.title', 'Delete this company')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700">
          {t(
            'editCompany.delete.warning',
            'Deleting this company is permanent for end users. The record is soft-deleted and will be retained for 30 days, after which it cannot be recovered.',
          )}
        </p>
        <div className="space-y-2">
          <Label htmlFor="confirm-title">
            {t('editCompany.delete.confirmLabel', 'Type the company name to confirm')}
          </Label>
          <Input
            id="confirm-title"
            value={confirmTitle}
            onChange={(e) => setConfirmTitle(e.target.value)}
            placeholder={companyTitle}
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            disabled={!matches || deleting}
            onClick={() => void onConfirm()}
            className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300"
          >
            {deleting
              ? t('editCompany.delete.deleting', 'Deleting…')
              : t('editCompany.delete.confirmButton', 'Delete company')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const CompanyVersionsPanel: React.FC<{ companyHandbooks: Array<{ nid: number; title: string }> }> = ({ companyHandbooks }) => {
  const { t } = useTranslation('admin');
  const primary = companyHandbooks[0];
  const { data: versions = [], isLoading } = useAdminHandbookVersions(primary ? primary.nid : null);

  if (!primary) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-gray-500 text-center">
          {t('editCompany.versions.empty', 'No handbook assigned — no versions to show.')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">
          {t('editCompany.versions.title', 'Versions')} — {primary.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-gray-500">{t('common.loading', 'Loading…')}</p>
        ) : versions.length === 0 ? (
          <p className="text-sm text-gray-500">{t('editCompany.versions.none', 'No versions recorded yet.')}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {versions.map((v) => (
              <li key={v.vid} className="py-2 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-gray-900">{v.title || `#${v.vid}`}</div>
                  <div className="text-xs text-gray-500">
                    {v.authorName || 'Unknown'} · {new Date(v.changed * 1000).toLocaleString()}
                  </div>
                  {v.logMessage && <div className="text-xs text-gray-400 mt-0.5">{v.logMessage}</div>}
                </div>
                <span className="text-xs text-gray-500 flex items-center gap-2">
                  {v.isCurrent && (
                    <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-700">
                      {t('editCompany.versions.current', 'Current')}
                    </span>
                  )}
                  vid {v.vid}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminEditCompanyPage;
