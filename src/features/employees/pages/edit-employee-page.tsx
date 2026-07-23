import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { HelpBanner } from '@/components/common/help-banner';
import { AddEmployeeForm, EmployeeFormData } from '../components/add-employee-form';
import { Button } from '@/components/ui/button';
import { Save, ArrowLeft, Loader2, Link2, Copy, Check, Download, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { employeesApi } from '../api';
import { documentsApi, EmployeeDocument, DocRequirement } from '@/features/documents/api';
import { toast } from 'sonner';
import { employeesRoutes } from '../routes';
import { useAuth } from '@/context/auth-context';
import { isAdminRole } from '@/lib/utils';
import { resolveRbacRole } from '@/lib/rbac';
import type { Employee } from '@/types/models';
import { useTranslation } from 'react-i18next';

function employeeToFormData(emp: Employee): EmployeeFormData {
  return {
    name: emp.name ?? '',
    email: emp.email ?? '',
    mobileNumber: emp.mobileNumber ?? '',
    alternateNumber: emp.alternateNumber ?? '',
    makeContactPublic: emp.isPublic ?? false,
    // Load existing emergency contact data from the API
    emergencyName: emp.emergencyContactName ?? '',
    emergencyMobile: emp.emergencyContactMobile ?? '',
    makeEmergencyPublic: emp.isEmergencyPublic ?? false,
    employmentType: emp.employmentTypeId != null ? String(emp.employmentTypeId) : 'none',
    status: emp.status === 'ACTIVE',
    isSeniorEmployee: emp.isSeniorEmployee ?? false,
    isBusinessAdmin: emp.isBusinessAdmin ?? false,
    languages: emp.languages ?? ['da'],
    sendEmail: 'no',
    sendSmsInvite: false,
    customMessage: '',
    userPictureFid: null,
  };
}

export const EditEmployeePage: React.FC = () => {
  const { t } = useTranslation('employees');
  const { t: tCommon } = useTranslation('common');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof EmployeeFormData, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData | null>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkCopied, setMagicLinkCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [eraseDialogOpen, setEraseDialogOpen] = useState(false);
  const [erasing, setErasing] = useState(false);
  // CF-22: per-employee document assignment
  const [assignedDocs, setAssignedDocs] = useState<EmployeeDocument[]>([]);
  const [pendingUpload, setPendingUpload] = useState<{ fid: number; uri: string; name: string } | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docRequirement, setDocRequirement] = useState<DocRequirement>('signature');
  const [docBusy, setDocBusy] = useState(false);
  const docFileRef = useRef<HTMLInputElement>(null);
  // Ref to the latest uploaded fid — set by AddEmployeeForm via onFidRefReady.
  // Using a ref avoids stale-closure issues: formData.userPictureFid may lag a render behind.
  const uploadedFidRef = useRef<number | null>(null);
  const handleFidRefReady = React.useCallback((ref: React.MutableRefObject<number | null>) => {
    // Wire the child's internal ref into our local variable so handleSave can read it
    (uploadedFidRef as React.MutableRefObject<number | null>).current = ref.current;
    // Keep them in sync by replacing the ref object reference
    Object.defineProperty(uploadedFidRef, 'current', {
      get: () => ref.current,
      set: (v) => { ref.current = v; },
      configurable: true,
    });
  }, []);

  // True when the employee being edited is the currently logged-in user
  const isSelf = !!(employee && authUser && (
    String(employee.id) === String(authUser.id) ||
    employee.email.toLowerCase() === (authUser.email ?? '').toLowerCase()
  ));

  // Email edit policy:
  // - CompanyFlow platform admins (superadmin / admin — staff "sitting in CompanyFlow")
  //   may change ANY login email, including account owners. Confirmed with the client.
  // - Otherwise: company admins can change non-owner employees, but self and account
  //   owners stay locked (the email is the login identity / magic-link target), and
  //   non-admin viewers can never change it.
  const viewerRbac = resolveRbacRole(authUser?.role);
  const viewerIsPlatformAdmin = viewerRbac === 'superadmin' || viewerRbac === 'admin';
  const viewerIsAdmin = isAdminRole(authUser?.role);
  const isAccountOwner = employee?.role === 'account_owner';
  const emailLocked = viewerIsPlatformAdmin
    ? false
    : isSelf || isAccountOwner || !viewerIsAdmin;

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    employeesApi
      .getEmployee(id)
      .then((data) => {
        if (!cancelled && data) {
          setEmployee(data);
          setFormData(employeeToFormData(data));
        } else if (!cancelled) {
          setEmployee(null);
          setFormData(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEmployee(null);
          setFormData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const validateForm = (): boolean => {
    if (!formData) return false;
    const newErrors: Partial<Record<keyof EmployeeFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = t('form.validation.nameRequired');
    if (!emailLocked) {
      if (!formData.email.trim()) newErrors.email = t('form.validation.emailRequired');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t('form.validation.emailInvalid');
    }
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = t('form.validation.mobileRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!id || !formData) return;
    setGeneralError(null);
    setSuccessMessage(null);
    if (!validateForm()) {
      setGeneralError(t('toast.fixErrors'));
      return;
    }
    setIsSubmitting(true);
    const fidToSend = uploadedFidRef.current ?? formData.userPictureFid;
    try {
      await employeesApi.updateEmployee(id, {
        name: formData.name,
        // Email is sent only when unlocked AND actually changed; otherwise omitted so the backend keeps the existing value.
        ...(!emailLocked && employee && formData.email.trim().toLowerCase() !== (employee.email ?? '').toLowerCase()
          ? { email: formData.email.trim() }
          : {}),
        mobileNumber: formData.mobileNumber,
        alternateNumber: formData.alternateNumber || undefined,
        isPublic: formData.makeContactPublic,
        emergencyContactName: formData.emergencyName || undefined,
        emergencyContactMobile: formData.emergencyMobile || undefined,
        emergencyContactIsPublic: formData.makeEmergencyPublic,
        isEmergencyPublic: formData.makeEmergencyPublic,
        // Skip employment/permission fields when editing yourself
        ...(!isSelf && {
          employmentType: formData.employmentType,
          status: formData.status,
          isSeniorEmployee: formData.isSeniorEmployee,
          isBusinessAdmin: formData.isBusinessAdmin,
          languages: formData.languages,
          sendEmailType: formData.sendEmail,
          sendSmsInvite: formData.sendSmsInvite,
          ...(formData.sendEmail === 'customized' && formData.customMessage && { customMessage: formData.customMessage }),
        }),
        // Send userPictureFid: new fid to set, null to clear, or omit to leave unchanged
        // Photo was cleared if ref is null AND formData fid is null AND employee originally had a photo
        ...(fidToSend != null
          ? { userPictureFid: fidToSend }
          : uploadedFidRef.current === null && formData.userPictureFid === null && employee?.userPictureUri
            ? { userPictureFid: null }
            : {}),
      });
      setSuccessMessage(t('toast.updated'));
      setTimeout(() => navigate(employeesRoutes.list), 1500);
    } catch (error: any) {
      console.error('Error updating employee:', error);
      console.error('Backend response body:', error?.response?.data);

      const apiError = error?.response?.data?.error;
      const message =
        typeof apiError?.message === 'string' && apiError.message.trim()
          ? apiError.message.trim()
          : t('toast.updateFailed');

      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    if (!id) return;
    setExporting(true);
    try {
      await employeesApi.exportEmployeeData(id);
    } catch {
      setGeneralError(t('edit.exportError'));
    } finally {
      setExporting(false);
    }
  };

  const handleErase = async () => {
    if (!id) return;
    setErasing(true);
    try {
      await employeesApi.eraseEmployeeData(id);
      setEraseDialogOpen(false);
      navigate(employeesRoutes.list);
    } catch {
      setGeneralError(t('edit.erase.error'));
    } finally {
      setErasing(false);
    }
  };

  useEffect(() => {
    if (id && !isSelf) {
      documentsApi.listForEmployee(id).then(setAssignedDocs).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDocFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocBusy(true);
      try {
        const { fid, uri } = await documentsApi.uploadFile(file);
        setPendingUpload({ fid, uri, name: file.name });
      } catch {
        toast.error(t('docs.uploadError'));
      } finally {
        setDocBusy(false);
      }
    }
    e.target.value = '';
  };

  const handleAssignDoc = async () => {
    if (!id || !pendingUpload) return;
    setDocBusy(true);
    try {
      await documentsApi.assign({
        employeeId: Number(id),
        fid: pendingUpload.fid,
        fileUri: pendingUpload.uri,
        filename: pendingUpload.name,
        title: docTitle.trim() || pendingUpload.name,
        requirement: docRequirement,
      });
      toast.success(t('docs.assigned'));
      setPendingUpload(null);
      setDocTitle('');
      const list = await documentsApi.listForEmployee(id);
      setAssignedDocs(list);
    } catch {
      toast.error(t('docs.assignError'));
    } finally {
      setDocBusy(false);
    }
  };

  const handleGenerateMagicLink = async () => {
    if (!id) return;
    setMagicLinkLoading(true);
    setMagicLink(null);
    try {
      const url = await employeesApi.generateMagicLink(id);
      setMagicLink(url);
    } catch (error: any) {
      const apiError = error?.response?.data?.error;
      const message =
        typeof apiError?.message === 'string' && apiError.message.trim()
          ? apiError.message.trim()
          : t('toast.magicLinkFailed');
      setGeneralError(message);
    } finally {
      setMagicLinkLoading(false);
    }
  };

  const handleCopyMagicLink = async () => {
    if (!magicLink) return;
    await navigator.clipboard.writeText(magicLink);
    setMagicLinkCopied(true);
    setTimeout(() => setMagicLinkCopied(false), 2000);
  };

  const handleBack = () => navigate(employeesRoutes.list);

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          {t('edit.loading')}
        </div>
      </PageShell>
    );
  }

  if (!id || !employee || !formData) {
    return (
      <PageShell>
        <div className="py-12 text-center text-gray-500">
          {t('edit.notFound')}
          <Button variant="link" onClick={handleBack} className="ml-2">
            {t('edit.backToList')}
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleBack} className="h-9 px-3">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {tCommon('back')}
            </Button>
            <h1 className="text-2xl font-bold text-[#0d0e0e]">{t('edit.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            {!isSelf && (
              <Button
                variant="outline"
                className="rounded-md px-4 py-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setEraseDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('edit.erase.button')}
              </Button>
            )}
            <Button
              variant="outline"
              className="rounded-md px-4 py-2"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {t('edit.exportData')}
            </Button>
            <Button
              className="rounded-md px-4 py-2"
              style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
              onClick={handleSave}
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? tCommon('saving') : t('edit.save')}
            </Button>
          </div>
        </div>

        <HelpBanner
          title={t('edit.helpTitle')}
          description={t('edit.helpDesc')}
          linkText={t('edit.userManual')}
          linkHref="#"
        />

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">{successMessage}</p>
          </div>
        )}
        {generalError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">{generalError}</p>
          </div>
        )}

        <AddEmployeeForm
          formData={formData}
          onChange={setFormData}
          errors={errors}
          isEditMode
          isSelf={isSelf}
          isAccountOwner={isAccountOwner}
          emailLocked={emailLocked}
          existingPhotoUri={employee.userPictureUri ?? null}
          onFidRefReady={handleFidRefReady}
        />

        {!isSelf && (
          <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">{t('edit.magicLink.title')}</h3>
            <p className="text-xs text-gray-500 mb-3">
              {t('edit.magicLink.desc')}
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateMagicLink}
                disabled={magicLinkLoading}
              >
                {magicLinkLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Link2 className="h-4 w-4 mr-2" />
                )}
                {magicLinkLoading ? t('edit.magicLink.generating') : t('edit.magicLink.generate')}
              </Button>
              {magicLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyMagicLink}
                  className="text-teal-700 border-teal-300 hover:bg-teal-50"
                >
                  {magicLinkCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      {t('edit.magicLink.copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      {t('edit.magicLink.copy')}
                    </>
                  )}
                </Button>
              )}
            </div>
            {magicLink && (
              <p className="text-xs text-gray-400 mt-2 break-all font-mono">{magicLink}</p>
            )}
          </div>
        )}

        {!isSelf && (
          <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">{t('docs.title')}</h3>
            <p className="text-xs text-gray-500 mb-3">{t('docs.desc')}</p>

            <div className="flex flex-col gap-3 mb-4">
              <input
                ref={docFileRef}
                type="file"
                className="hidden"
                onChange={handleDocFile}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => docFileRef.current?.click()} disabled={docBusy}>
                  {pendingUpload ? pendingUpload.name : t('docs.choose')}
                </Button>
                <select
                  value={docRequirement}
                  onChange={(e) => setDocRequirement(e.target.value as DocRequirement)}
                  className="text-sm border border-gray-200 rounded-[8px] px-3 py-2 bg-white"
                >
                  <option value="signature">{t('docs.reqSignature')}</option>
                  <option value="approval">{t('docs.reqApproval')}</option>
                </select>
              </div>
              {pendingUpload && (
                <input
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder={t('docs.titleLabel')}
                  className="text-sm border border-gray-200 rounded-[8px] px-3 py-2 bg-white max-w-[360px]"
                />
              )}
              <div>
                <Button
                  size="sm"
                  onClick={handleAssignDoc}
                  disabled={docBusy || !pendingUpload}
                  className="bg-[#1a5948] hover:bg-[#143e33] text-white"
                >
                  {docBusy ? t('docs.assigning') : t('docs.assign')}
                </Button>
              </div>
            </div>

            {assignedDocs.length === 0 ? (
              <p className="text-xs text-gray-400">{t('docs.none')}</p>
            ) : (
              <ul className="divide-y divide-gray-100 border-t border-gray-100">
                {assignedDocs.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 py-2 text-sm">
                    <span className="flex-1 truncate text-gray-700">{d.title || d.filename}</span>
                    <span className="text-xs text-gray-400">
                      {d.requirement === 'approval' ? t('docs.reqApproval') : t('docs.reqSignature')}
                    </span>
                    <span className={`text-xs ${d.status === 'pending' ? 'text-amber-600' : 'text-[#1a5948]'}`}>
                      {d.status === 'signed' ? t('docs.signed') : d.status === 'approved' ? t('docs.approved') : t('docs.pending')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <Dialog open={eraseDialogOpen} onOpenChange={setEraseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('edit.erase.title')}</DialogTitle>
            <DialogDescription>{t('edit.erase.description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEraseDialogOpen(false)} disabled={erasing}>
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleErase}
              disabled={erasing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {erasing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {t('edit.erase.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};
