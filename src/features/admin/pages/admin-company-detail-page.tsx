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
import type { UpdateSubscriptionPayload } from '../types';

function formatDate(dateStr: string | null | undefined): string {
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

function formatDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function getRemainingMonthsBadgeClasses(months: number | null): string {
  if (months === null || months <= 0) return 'bg-red-100 text-red-700 border-red-200';
  if (months <= 2) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-green-100 text-green-700 border-green-200';
}

function getStatusBadge(status: number): { label: string; classes: string } {
  return status === 1
    ? { label: 'Active', classes: 'bg-green-100 text-green-700 border-green-200' }
    : { label: 'Inactive', classes: 'bg-gray-100 text-gray-500 border-gray-200' };
}

function getRoleBadge(role: string): { label: string; classes: string } {
  const normalized = role.toLowerCase();
  if (normalized.includes('admin')) return { label: role, classes: 'bg-purple-100 text-purple-700 border-purple-200' };
  if (normalized.includes('manager')) return { label: role, classes: 'bg-blue-100 text-blue-700 border-blue-200' };
  return { label: role, classes: 'bg-gray-100 text-gray-700 border-gray-200' };
}

export const AdminCompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t: _t } = useTranslation('admin');

  const { data: company, isLoading, isError } = useAdminCompany(id);
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
      await updateSubscription.mutateAsync({
        companyId: id,
        data: editForm,
      });
      toast.success('Subscription updated successfully');
      setIsEditDialogOpen(false);
    } catch {
      toast.error('Failed to update subscription. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        </div>
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to={adminRoutes.companies}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          &larr; Back to Companies
        </Link>
        <div className="text-center py-20">
          <p className="text-red-600 font-medium">Failed to load company details.</p>
          <p className="text-sm text-gray-500 mt-1">The company may not exist or an error occurred.</p>
        </div>
      </div>
    );
  }

  const remainingMonths = company.subscriptionRemainingMonths;
  const remainingLabel =
    remainingMonths === null
      ? 'No end date'
      : remainingMonths <= 0
        ? 'Expired'
        : `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''} remaining`;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link
        to={adminRoutes.companies}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        &larr; Back to Companies
      </Link>

      {/* Company Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{company.title}</h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 mt-2">
          <span>
            <span className="text-gray-400">Customer #</span>{' '}
            <span className="text-gray-700 font-medium">{company.customerNumber}</span>
          </span>
          <span>
            <span className="text-gray-400">CVR</span>{' '}
            <span className="text-gray-700 font-medium">{company.cvr || '-'}</span>
          </span>
          <span>
            <span className="text-gray-400">Address</span>{' '}
            <span className="text-gray-700 font-medium">
              {[company.street, company.zipCode, company.city].filter(Boolean).join(', ') || '-'}
            </span>
          </span>
          <span>
            <span className="text-gray-400">Phone</span>{' '}
            <span className="text-gray-700 font-medium">{company.phone || '-'}</span>
          </span>
          <span>
            <span className="text-gray-400">Email</span>{' '}
            <span className="text-gray-700 font-medium">{company.email || '-'}</span>
          </span>
        </div>
      </div>

      {/* Subscription Card */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Subscription</CardTitle>
          <Button variant="outline" size="sm" onClick={handleOpenEditDialog}>
            Edit Subscription
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Product</p>
              <p className="text-sm font-medium text-gray-900">{company.productName || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Start Date</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(company.subscriptionStart)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">End Date</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(company.subscriptionEnd)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Remaining</p>
              <Badge className={getRemainingMonthsBadgeClasses(remainingMonths)}>
                {remainingLabel}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Licenses</p>
              <p className="text-sm font-medium text-gray-900">
                {company.licensesUsed} <span className="text-gray-400">/ {company.licensesTotal}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">SMS Credits</p>
              <p className="text-sm font-medium text-gray-900">
                {company.smsUsed} <span className="text-gray-400">/ {company.smsCreditsTotal}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">
            Employees
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({company.employees.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {company.employees.length === 0 ? (
            <div className="px-6 pb-6 text-sm text-gray-500">No employees found for this company.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.employees.map((employee) => {
                  const statusBadge = getStatusBadge(employee.status);
                  const roleBadge = getRoleBadge(employee.role);
                  const lastActive = employee.access
                    ? formatRelativeTime(new Date(employee.access * 1000).toISOString())
                    : 'Never';

                  return (
                    <TableRow key={employee.uid}>
                      <TableCell className="font-medium text-gray-900">{employee.name}</TableCell>
                      <TableCell className="text-gray-600">{employee.mail}</TableCell>
                      <TableCell>
                        <Badge className={roleBadge.classes}>{roleBadge.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadge.classes}>{statusBadge.label}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">{lastActive}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Handbooks List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Handbooks
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({company.handbooks.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {company.handbooks.length === 0 ? (
            <p className="text-sm text-gray-500">No handbooks found for this company.</p>
          ) : (
            <div className="space-y-2">
              {company.handbooks.map((handbook) => (
                <div
                  key={handbook.nid}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                      HB
                    </div>
                    <span className="text-sm font-medium text-gray-900">{handbook.title}</span>
                  </div>
                  <span className="text-xs text-gray-400">#{handbook.nid}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Subscription Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-licenses">Licenses</Label>
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
                placeholder="Number of licenses"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-sms">SMS Credits</Label>
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
                placeholder="SMS credit cap"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-start">Start Date</Label>
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
              <Label htmlFor="edit-end">End Date</Label>
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={updateSubscription.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSubscription}
              disabled={updateSubscription.isPending}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              {updateSubscription.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
