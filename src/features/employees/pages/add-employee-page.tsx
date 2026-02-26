import React, { useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { HelpBanner } from '@/components/common/help-banner';
import { AddEmployeeForm, EmployeeFormData } from '../components/add-employee-form';
import { Button } from '@/components/ui/button';
import { Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { employeesApi } from '../api';

export const AddEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof EmployeeFormData, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (parseInt(formData.mobileNumber, 10) > 2_147_483_647) {
      newErrors.mobileNumber = 'Mobile number exceeds system limit';
    }

    if (formData.alternateNumber && parseInt(formData.alternateNumber, 10) > 2_147_483_647) {
      newErrors.alternateNumber = 'Alternate number exceeds system limit';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    setGeneralError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      setGeneralError('Please fix the errors above before submitting');
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

      setSuccessMessage('Employee created successfully!');

      // Redirect to employees list after a short delay
      setTimeout(() => {
        navigate('/employees');
      }, 1500);
    } catch (error: any) {
      // Log the raw backend response to help diagnose validation errors
      const backendMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        error?.response?.data?.error ||
        (typeof error?.response?.data === 'string' ? error.response.data : null);

      console.error('Error creating employee:', error);
      console.error('Backend response body:', error?.response?.data);

      setGeneralError(
        backendMsg
          ? `Server error: ${backendMsg}`
          : error instanceof Error
            ? error.message
            : 'Failed to create employee. Please try again.'
      );
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
              Back
            </Button>
            <h1 className="text-2xl font-bold text-[#0d0e0e]">Add employee</h1>
          </div>
          <Button
            className="bg-teal-600 hover:bg-teal-700"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save information'}
          </Button>
        </div>

        <HelpBanner
          title="Help."
          description="Create, edit, and remove employees. Send a message with a handbook link, and re-send when needed. Choose which profiles are Public (visible in the info list) per employee or use the bulk visibility buttons. Use work email@phones where possible so notifications arrive reliably."
          linkText="User manual"
          linkHref="#"
        />

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {generalError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">{generalError}</p>
          </div>
        )}

        <AddEmployeeForm
          formData={formData}
          onChange={setFormData}
          errors={errors}
        />
      </div>
    </PageShell>
  );
};
