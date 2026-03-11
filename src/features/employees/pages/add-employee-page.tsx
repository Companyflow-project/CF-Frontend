import React, { useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { HelpBanner } from '@/components/common/help-banner';
import { AddEmployeeForm, EmployeeFormData } from '../components/add-employee-form';
import { Button } from '@/components/ui/button';
import { Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { employeesApi } from '../api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const AddEmployeePage: React.FC = () => {
  const { t } = useTranslation('employees');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof EmployeeFormData, string>>>({});

  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    mobileNumber: '',
    alternateNumber: '',
    makeContactPublic: false,
    emergencyName: '',
    emergencyMobile: '',
    makeEmergencyPublic: false,
    employmentType: 'none',
    status: true,
    isSeniorEmployee: false,
    isBusinessAdmin: false,
    sendEmail: 'no',
    userPictureFid: null,
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EmployeeFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('form.validation.nameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('form.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('form.validation.emailInvalid');
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = t('form.validation.mobileRequired');
    } else if (parseInt(formData.mobileNumber, 10) > 2_147_483_647) {
      newErrors.mobileNumber = t('form.validation.mobileExceeds');
    }

    if (formData.alternateNumber && parseInt(formData.alternateNumber, 10) > 2_147_483_647) {
      newErrors.alternateNumber = t('form.validation.alternateExceeds');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error(t('toast.fixErrors'));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        alternateNumber: formData.alternateNumber || undefined,
        isPublic: formData.makeContactPublic,
        emergencyContactName: formData.emergencyName || undefined,
        emergencyContactMobile: formData.emergencyMobile || undefined,
        // Send both field names for backward/forward backend compat
        emergencyContactIsPublic: formData.makeEmergencyPublic,
        isEmergencyPublic: formData.makeEmergencyPublic,
        employmentType: formData.employmentType,
        status: formData.status,
        isSeniorEmployee: formData.isSeniorEmployee,
        isBusinessAdmin: formData.isBusinessAdmin,
        sendEmailType: formData.sendEmail,
        ...(formData.userPictureFid != null && { userPictureFid: formData.userPictureFid }),
      };

      await employeesApi.createEmployee(payload);

      toast.success(t('toast.created'));

      // Redirect to employees list after a short delay
      setTimeout(() => {
        navigate('/employees');
      }, 1500);
    } catch (error: any) {
      console.error('Error creating employee:', error);
      console.error('Backend response body:', error?.response?.data);

      const apiError = error?.response?.data?.error;
      const message =
        typeof apiError?.message === 'string' && apiError.message.trim()
          ? apiError.message.trim()
          : t('toast.createFailed');

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/employees');
  };

  return (
    <PageShell>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="h-9 px-3"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {tCommon('back')}
            </Button>
            <h1 className="text-2xl font-bold text-[#0d0e0e]">{t('add.title')}</h1>
          </div>
          <Button
            className="bg-teal-600 hover:bg-teal-700"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? tCommon('saving') : t('add.save')}
          </Button>
        </div>

        <HelpBanner
          title="Help."
          description="Create, edit, and remove employees. Send a message with a handbook link, and re-send when needed. Choose which profiles are Public (visible in the info list) per employee or use the bulk visibility buttons. Use work email@phones where possible so notifications arrive reliably."
          linkText="User manual"
          linkHref="#"
        />


        <AddEmployeeForm
          formData={formData}
          onChange={setFormData}
          errors={errors}
        />
      </div>
    </PageShell>
  );
};
