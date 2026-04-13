import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminCompany, useUpdateSubscription } from '../hooks';
import { adminRoutes } from '../routes';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/lib/utils';
import { Plus, Edit, MessageSquare, ArrowRight, Upload } from 'lucide-react';
import type { AdminCompanyDetail, UpdateSubscriptionPayload } from '../types';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
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

function formatDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function formatDateTimeShort(ts: number | null | undefined): { date: string; time: string } {
  if (!ts) return { date: '—', time: '' };
  try {
    const d = new Date(ts * 1000);
    const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  } catch {
    return { date: '—', time: '' };
  }
}

function formatFupDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function daysSince(ts: number | null | undefined): string {
  if (!ts) return '—';
  const now = Date.now() / 1000;
  const days = Math.floor((now - ts) / 86400);
  if (days < 0) return '0';
  return String(days);
}

function getRemainingMonthsBadgeClasses(months: number | null): string {
  if (months === null || months <= 0) return 'bg-red-100 text-red-700 border-red-200';
  if (months <= 2) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-green-100 text-green-700 border-green-200';
}

function getStatusBadgeForActivity(statusName: string, t: (key: string, fallback: string) => string): { label: string; classes: string } {
  const normalized = (statusName || '').toLowerCase();
  if (normalized.includes('færdig') || normalized.includes('done') || normalized.includes('complete')) {
    return { label: t('company.statusDone', 'Done'), classes: 'bg-green-100 text-green-700 border-green-200' };
  }
  if (normalized.includes('i gang') || normalized.includes('progress') || normalized.includes('ongoing')) {
    return { label: t('company.statusInProgress', 'In progress'), classes: 'bg-amber-100 text-amber-700 border-amber-200' };
  }
  return { label: statusName || '—', classes: 'bg-gray-100 text-gray-700 border-gray-200' };
}

export const AdminCompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('admin');

  const { data: company, isLoading, isError } = useAdminCompany(id) as {
    data: AdminCompanyDetail | undefined;
    isLoading: boolean;
    isError: boolean;
  };
  const updateSubscription = useUpdateSubscription();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<UpdateSubscriptionPayload>({
    licensesTotal: undefined,
    smsCreditsTotal: undefined,
    subscriptionStart: undefined,
    subscriptionEnd: undefined,
  });

  const handleOpenEditDialog = () => {
    if (!company) return;
    setEditForm({
      licensesTotal: company.licensesTotal,
      smsCreditsTotal: company.smsCreditsTotal,
      subscriptionStart: formatDateForInput(company.subscriptionStart),
      subscriptionEnd: formatDateForInput(company.subscriptionEnd),
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveSubscription = async () => {
    if (!id) return;
    try {
      await updateSubscription.mutateAsync({ companyId: id, data: editForm });
      toast.success(t('company.subscriptionUpdated', 'Subscription updated successfully'));
      setIsEditDialogOpen(false);
    } catch {
      toast.error(t('company.subscriptionUpdateFailed', 'Failed to update subscription. Please try again.'));
    }
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

  if (isError || !company) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        <Link
          to={adminRoutes.companies}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          &larr; {t('company.backToCompanies', 'Back to Companies')}
        </Link>
        <div className="text-center py-20">
          <p className="text-red-600 font-medium">{t('company.loadError', 'Failed to load company details.')}</p>
          <p className="text-sm text-gray-500 mt-1">{t('company.loadErrorDesc', 'The company may not exist or an error occurred.')}</p>
        </div>
      </div>
    );
  }

  const remainingMonths = company.subscriptionRemainingMonths;
  const remainingLabel =
    remainingMonths === null
      ? t('company.noEndDate', 'No end date')
      : remainingMonths <= 0
        ? t('company.expired', 'Expired')
        : `${remainingMonths} ${remainingMonths !== 1 ? t('company.months', 'months') : t('company.month', 'month')}`;

  const isFreeTrial = (company.productName || '').toLowerCase().includes('free trial');
  const keyFigures = company.keyFigures;
  const lastAccessTs = keyFigures?.lastAccess ?? null;
  const lastEditedTs = keyFigures?.lastEdited ?? null;

  const lastActivityLabel = lastEditedTs
    ? formatRelativeTime(new Date(lastEditedTs * 1000).toISOString())
    : t('company.never', 'Never');
  const lastLoginLabel = lastAccessTs
    ? formatRelativeTime(new Date(lastAccessTs * 1000).toISOString())
    : t('company.never', 'Never');

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb + Title row */}
      <div>
        <nav className="flex flex-wrap items-center gap-1 text-xs sm:text-sm text-gray-500 mb-3">
          <Link to={adminRoutes.dashboard} className="hover:text-gray-700">
            {t('breadcrumb.console', 'Console')}
          </Link>
          <span className="text-gray-300">›</span>
          <Link to={adminRoutes.companies} className="hover:text-gray-700">
            {t('breadcrumb.companies', 'Companies')}
          </Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-700 font-medium truncate">{company.title}</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{company.title}</h1>
          <Button asChild variant="outline" size="sm" className="self-start sm:self-auto">
            <Link to={adminRoutes.companies}>{t('company.allCompanies', 'All Companies')}</Link>
          </Button>
        </div>
      </div>

      {/* Two-column header row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Details card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              {t('company.businessDetails', 'Business Details')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-gray-100 text-sm">
              <div className="flex justify-between py-2 gap-4">
                <dt className="text-gray-500">{t('company.businessName', 'Business Name')}</dt>
                <dd className="text-gray-900 font-medium text-right flex items-center gap-2">
                  {company.title}
                  {isFreeTrial && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      {t('company.freeSample', 'Free sample')}
                    </Badge>
                  )}
                </dd>
              </div>
              <div className="flex justify-between py-2 gap-4">
                <dt className="text-gray-500">{t('company.customerNo', 'Customer no')}</dt>
                <dd className="text-gray-900 font-medium text-right">{company.customerNumber || '—'}</dd>
              </div>
              <div className="flex justify-between py-2 gap-4">
                <dt className="text-gray-500">{t('company.cvr', 'CVR')}</dt>
                <dd className="text-gray-900 font-medium text-right">{company.cvr || '—'}</dd>
              </div>
              <div className="flex justify-between py-2 gap-4">
                <dt className="text-gray-500">{t('company.product', 'Product')}</dt>
                <dd className="text-gray-900 font-medium text-right">{company.productName || '—'}</dd>
              </div>
              <div className="flex justify-between py-2 gap-4">
                <dt className="text-gray-500">{t('company.licenses', 'Licenses')}</dt>
                <dd className="text-gray-900 font-medium text-right">
                  {t('company.licensesUsedBy', '{{used}} used by {{total}}', {
                    used: company.licensesUsed,
                    total: company.licensesTotal,
                  })}
                </dd>
              </div>
              <div className="flex justify-between py-2 gap-4">
                <dt className="text-gray-500">{t('company.sms', 'SMS')}</dt>
                <dd className="text-gray-900 font-medium text-right">
                  {company.smsUsed} / {company.smsCreditsTotal}
                </dd>
              </div>
              <div className="flex justify-between py-2 gap-4">
                <dt className="text-gray-500">{t('company.sender', 'Sender')}</dt>
                <dd className="text-gray-900 font-medium text-right">{company.senderName || '—'}</dd>
              </div>
              <div className="flex justify-between py-2 gap-4">
                <dt className="text-gray-500">{t('company.employmentTypes', 'Employment Types')}</dt>
                <dd className="text-gray-900 font-medium text-right">—</dd>
              </div>
              <div className="flex justify-between py-2 gap-4">
                <dt className="text-gray-500">{t('company.additionalManuals', 'Additional Manuals')}</dt>
                <dd className="text-gray-900 font-medium text-right">—</dd>
              </div>
              <div className="flex justify-between py-2 gap-4">
                <dt className="text-gray-500">{t('company.optionalGraphicDesign', 'Optional Graphic Design')}</dt>
                <dd className="text-gray-900 font-medium text-right">—</dd>
              </div>
              <div className="flex justify-between py-2 gap-4">
                <dt className="text-gray-500">{t('company.whistleblower', 'Whistleblower')}</dt>
                <dd className="text-gray-900 font-medium text-right">
                  {company.whistleblowerAccess ? t('company.yes', 'Yes') : t('company.no', 'No')}
                </dd>
              </div>
              <div className="flex justify-between py-2 gap-4">
                <dt className="text-gray-500">{t('company.languages', 'Languages')}</dt>
                <dd className="text-gray-900 font-medium text-right">—</dd>
              </div>
              <div className="flex justify-between py-2 gap-4">
                <dt className="text-gray-500">{t('company.sop', 'SOP')}</dt>
                <dd className="text-gray-900 font-medium text-right">—</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Activity & Subscription card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base sm:text-lg">
              {t('company.activityAndSubscription', 'Activity & Subscription')}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleOpenEditDialog}>
              <Edit className="w-3 h-3 mr-1" />
              {t('company.edit', 'Edit')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {/* Activity */}
            <dl className="divide-y divide-gray-100">
              <div className="flex justify-between py-2 gap-4">
                <dt className="text-gray-500">{t('company.lastActivity', 'Last activity')}</dt>
                <dd className="text-gray-900 font-medium text-right">{lastActivityLabel}</dd>
              </div>
              <div className="flex justify-between py-2 gap-4">
                <dt className="text-gray-500">{t('company.lastLogin', 'Last login')}</dt>
                <dd className="text-gray-900 font-medium text-right">{lastLoginLabel}</dd>
              </div>
              <div className="flex justify-between py-2 gap-4">
                <dt className="text-gray-500">{t('company.daysSinceLastAccess', 'Days since last access')}</dt>
                <dd className="text-gray-900 font-medium text-right">{daysSince(lastAccessTs)}</dd>
              </div>
            </dl>

            {/* Subscription */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {t('company.subscription', 'Subscription')}
              </p>
              <dl className="divide-y divide-gray-100">
                <div className="flex justify-between py-2 gap-4">
                  <dt className="text-gray-500">{t('company.start', 'Start')}</dt>
                  <dd className="text-gray-900 font-medium text-right">{formatDate(company.subscriptionStart)}</dd>
                </div>
                <div className="flex justify-between py-2 gap-4">
                  <dt className="text-gray-500">{t('company.end', 'End')}</dt>
                  <dd className="text-gray-900 font-medium text-right">{formatDate(company.subscriptionEnd)}</dd>
                </div>
                <div className="flex justify-between py-2 gap-4 items-center">
                  <dt className="text-gray-500">{t('company.remainingMonths', 'Remaining months')}</dt>
                  <dd className="text-right">
                    <Badge className={getRemainingMonthsBadgeClasses(remainingMonths)}>
                      {remainingLabel}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Invoice */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {t('company.invoice', 'Invoice')}
              </p>
              <dl className="divide-y divide-gray-100">
                <div className="flex justify-between py-2 gap-4">
                  <dt className="text-gray-500">{t('company.type', 'Type')}</dt>
                  <dd className="text-gray-900 font-medium text-right">{t('company.annual', 'Annual')}</dd>
                </div>
                <div className="flex justify-between py-2 gap-4">
                  <dt className="text-gray-500">{t('company.next', 'Next')}</dt>
                  <dd className="text-gray-900 font-medium text-right">{formatDate(company.subscriptionEnd)}</dd>
                </div>
                <div className="flex justify-between py-2 gap-4 items-center">
                  <dt className="text-gray-500">{t('company.invoicesPublished', 'Invoices Published')}</dt>
                  <dd className="text-right">
                    <Badge
                      className={
                        keyFigures?.published
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }
                    >
                      {keyFigures?.published ? t('company.yes', 'Yes') : t('company.no', 'No')}
                    </Badge>
                  </dd>
                </div>
                <div className="flex justify-between py-2 gap-4 items-center">
                  <dt className="text-gray-500">{t('company.companies', 'Companies')}</dt>
                  <dd className="text-right">
                    <Badge
                      className={
                        company.status === 1
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }
                    >
                      {company.status === 1 ? t('company.active', 'Active') : t('company.inactive', 'Inactive')}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links row */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm">{t('company.allPages', 'All Pages')}</Button>
        <Button variant="outline" size="sm">{t('company.createYourHandbook', 'Create Your Handbook')}</Button>
        <Button variant="outline" size="sm">{t('company.controlPanel', 'Control Panel')}</Button>
        <Button variant="outline" size="sm">{t('company.employees', 'Employees')}</Button>
        <span className="mx-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {t('company.actions', 'Actions')}
        </span>
        <Button variant="outline" size="sm">{t('company.wise', 'Wise')}</Button>
        <Button variant="outline" size="sm">{t('company.reset', 'Reset')}</Button>
        <Button
          variant="outline"
          size="sm"
          className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
        >
          {t('company.deleteAll', 'Delete All')}
        </Button>
      </div>

      {/* Contacts section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base sm:text-lg">{t('company.contacts', 'Contacts')}</CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            {t('company.addContact', 'Add Contact')}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {company.contacts.length === 0 ? (
            <div className="px-4 sm:px-6 pb-6 text-sm text-gray-500">
              {t('company.noContacts', 'No contacts')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('company.table.name', 'NAME')}</TableHead>
                    <TableHead>{t('company.table.email', 'EMAIL')}</TableHead>
                    <TableHead>{t('company.table.telephone', 'TELEPHONE')}</TableHead>
                    <TableHead>{t('company.table.function', 'FUNCTION')}</TableHead>
                    <TableHead className="text-right">{t('company.table.actions', 'ACTIONS')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {company.contacts.map((contact) => (
                    <TableRow key={contact.uid}>
                      <TableCell className="font-medium text-gray-900">{contact.name}</TableCell>
                      <TableCell className="text-gray-600 break-all">{contact.email || '—'}</TableCell>
                      <TableCell className="text-gray-600">{contact.phone || '—'}</TableCell>
                      <TableCell className="text-gray-600">
                        {contact.isPrimary
                          ? t('company.primaryContactPerson', 'Primary contact person')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3 mr-1" />
                            {t('company.editBtn', 'Edit')}
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {t('company.message', 'Message')}
                          </Button>
                          <Button variant="outline" size="sm">
                            {t('company.change', 'Change')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base sm:text-lg">{t('company.documents', 'Documents')}</CardTitle>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-1" />
            {t('company.upload', 'Upload')}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('company.table.description', 'DESCRIPTION')}</TableHead>
                  <TableHead>{t('company.table.linkedTo', 'LINKED TO')}</TableHead>
                  <TableHead>{t('company.table.date', 'DATE')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-gray-500 py-6">
                    {t('company.noDocuments', 'No documents')}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Key Figures section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">{t('company.keyFigures', 'Key Figures')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('company.table.business', 'BUSINESS')}</TableHead>
                  <TableHead>{t('company.table.licenses', 'LICENSES')}</TableHead>
                  <TableHead>{t('company.table.used', 'USED')}</TableHead>
                  <TableHead>{t('company.table.exploitation', 'EXPLOITATION')}</TableHead>
                  <TableHead>{t('company.table.access', 'ACCESS')}</TableHead>
                  <TableHead>{t('company.table.editingContent', 'EDITING CONTENT')}</TableHead>
                  <TableHead>{t('company.table.published', 'PUBLISHED')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-gray-900">{company.title}</TableCell>
                  <TableCell className="text-gray-700">{keyFigures?.licenses ?? company.licensesTotal}</TableCell>
                  <TableCell className="text-gray-700">{keyFigures?.used ?? company.licensesUsed}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${Math.min(100, Math.max(0, keyFigures?.exploitationPct ?? 0))}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
                        {Math.round(keyFigures?.exploitationPct ?? 0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {lastAccessTs
                      ? formatRelativeTime(new Date(lastAccessTs * 1000).toISOString())
                      : t('company.never', 'Never')}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {lastEditedTs
                      ? formatRelativeTime(new Date(lastEditedTs * 1000).toISOString())
                      : t('company.never', 'Never')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        keyFigures?.published
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }
                    >
                      {keyFigures?.published ? t('company.yes', 'Yes') : t('company.no', 'No')}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* CRM Activities section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base sm:text-lg">
              {t('company.crmActivities', 'CRM Activities')}
            </CardTitle>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
              {t('company.customerLicense', 'Customer: {{name}} - license', { name: company.title })}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={adminRoutes.crm}
              className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              {t('company.allActivities', 'All Activities')}
              <ArrowRight className="w-3 h-3" />
            </Link>
            <Button asChild size="sm" className="bg-gray-900 text-white hover:bg-gray-800">
              <Link to={`${adminRoutes.crmCreate}?companyId=${company.nid}`}>
                <Plus className="w-4 h-4 mr-1" />
                {t('company.addActivity', 'Add Activity')}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {company.crmActivities.length === 0 ? (
            <div className="px-4 sm:px-6 pb-6 text-sm text-gray-500">
              {t('company.noActivities', 'No CRM activities')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('company.table.created', 'CREATED')}</TableHead>
                    <TableHead>{t('company.table.title', 'TITLE')}</TableHead>
                    <TableHead>{t('company.table.responsible', 'RESPONSIBLE')}</TableHead>
                    <TableHead>{t('company.table.next', 'NEXT')}</TableHead>
                    <TableHead>{t('company.table.of', 'OF')}</TableHead>
                    <TableHead>{t('company.table.status', 'STATUS')}</TableHead>
                    <TableHead className="text-right">{t('company.table.actions', 'ACTIONS')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {company.crmActivities.map((activity) => {
                    const { date, time } = formatDateTimeShort(activity.created);
                    const statusBadge = getStatusBadgeForActivity(activity.statusName, t);
                    return (
                      <TableRow key={activity.id}>
                        <TableCell className="text-gray-700 whitespace-nowrap">
                          <div className="text-sm">{date}</div>
                          {time && <div className="text-xs text-gray-400">{time}</div>}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">{activity.title}</div>
                          {activity.body && (
                            <div
                              className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-[320px]"
                              title={activity.body}
                            >
                              {activity.body}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-sm text-gray-700">{activity.responsibleName || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 whitespace-nowrap">
                          {formatFupDate(activity.fupDate)}
                        </TableCell>
                        <TableCell className="text-gray-600">{activity.authorName || '—'}</TableCell>
                        <TableCell>
                          <Badge className={statusBadge.classes}>{statusBadge.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="outline" size="sm">
                              <Edit className="w-3 h-3 mr-1" />
                              {t('company.editBtn', 'Edit')}
                            </Button>
                            <Button variant="outline" size="sm">
                              {t('company.view', 'View')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Subscription Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('company.editSubscription', 'Edit Subscription')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-licenses">{t('company.licenses', 'Licenses')}</Label>
              <Input
                id="edit-licenses"
                type="number"
                min={0}
                value={editForm.licensesTotal ?? ''}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    licensesTotal: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  }))
                }
                placeholder={t('company.numberOfLicenses', 'Number of licenses')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-sms">{t('company.smsCredits', 'SMS Credits')}</Label>
              <Input
                id="edit-sms"
                type="number"
                min={0}
                value={editForm.smsCreditsTotal ?? ''}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    smsCreditsTotal: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  }))
                }
                placeholder={t('company.smsCreditCap', 'SMS credit cap')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-start">{t('company.startDate', 'Start Date')}</Label>
              <Input
                id="edit-start"
                type="date"
                value={editForm.subscriptionStart ?? ''}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    subscriptionStart: e.target.value || undefined,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-end">{t('company.endDate', 'End Date')}</Label>
              <Input
                id="edit-end"
                type="date"
                value={editForm.subscriptionEnd ?? ''}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    subscriptionEnd: e.target.value || undefined,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={updateSubscription.isPending}
            >
              {t('company.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleSaveSubscription}
              disabled={updateSubscription.isPending}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              {updateSubscription.isPending ? t('company.saving', 'Saving...') : t('company.save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
