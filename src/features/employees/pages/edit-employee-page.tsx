import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { HelpBanner } from '@/components/common/help-banner';
import { AddEmployeeForm, EmployeeFormData } from '../components/add-employee-form';
import { Button } from '@/components/ui/button';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { employeesApi } from '../api';
import { employeesRoutes } from '../routes';
import type { Employee } from '@/types/models';

function employeeToFormData(emp: Employee): EmployeeFormData {
  return {
    name: emp.name ?? '',
    email: emp.email ?? '',
    mobileNumber: emp.mobileNumber ?? '',
    alternateNumber: emp.alternateNumber ?? '',
    makeContactPublic: emp.isPublic ?? false,
    emergencyName: '',
    emergencyMobile: '',
    makeEmergencyPublic: false,
    employmentType: emp.employmentType ?? 'none',
    status: emp.status === 'ACTIVE',
    isSeniorEmployee: false,
    isBusinessAdmin: false,
    sendEmail: 'no',
    photoFile: null,
  };
}

export const EditEmployeePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof EmployeeFormData, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData | null>(null);

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
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!id || !formData) return;
    setGeneralError(null);
    setSuccessMessage(null);
    if (!validateForm()) {
      setGeneralError('Please fix the errors above before submitting');
      return;
    }
    setIsSubmitting(true);
    try {
      await employeesApi.updateEmployee(id, {
        name: formData.name,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        alternateNumber: formData.alternateNumber || undefined,
        isPublic: formData.makeContactPublic,
        emergencyContactName: formData.emergencyName || undefined,
        emergencyContactMobile: formData.emergencyMobile || undefined,
        emergencyContactIsPublic: formData.makeEmergencyPublic,
        employmentType: formData.employmentType,
        status: formData.status,
        isSeniorEmployee: formData.isSeniorEmployee,
        isBusinessAdmin: formData.isBusinessAdmin,
      });
      setSuccessMessage('Employee updated successfully!');
      setTimeout(() => navigate(employeesRoutes.list), 1500);
    } catch (error) {
      console.error('Error updating employee:', error);
      setGeneralError(error instanceof Error ? error.message : 'Failed to update employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate(employeesRoutes.list);

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading employee…
        </div>
      </PageShell>
    );
  }

  if (!id || !employee || !formData) {
    return (
      <PageShell>
        <div className="py-12 text-center text-gray-500">
          Employee not found.
          <Button variant="link" onClick={handleBack} className="ml-2">
            Back to list
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
              Back
            </Button>
            <h1 className="text-2xl font-bold text-[#0d0e0e]">Edit employee</h1>
          </div>
          <Button
            className="bg-teal-600 hover:bg-teal-700"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </Button>
        </div>

        <HelpBanner
          title="Help."
          description="Update employee details. Changes are saved to the company profile."
          linkText="User manual"
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

        <AddEmployeeForm formData={formData} onChange={setFormData} errors={errors} />
      </div>
    </PageShell>
  );
};
