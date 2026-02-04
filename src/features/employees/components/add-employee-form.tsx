import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useEmploymentTypes } from '@/features/employment-types/hooks';

export interface EmployeeFormData {
  name: string;
  email: string;
  mobileNumber: string;
  alternateNumber: string;
  makeContactPublic: boolean;
  emergencyName: string;
  emergencyMobile: string;
  makeEmergencyPublic: boolean;
  employmentType: string;
  status: boolean;
  isSeniorEmployee: boolean;
  isBusinessAdmin: boolean;
  sendEmail: string;
  photoFile: File | null;
}

interface AddEmployeeFormProps {
  formData: EmployeeFormData;
  onChange: (data: EmployeeFormData) => void;
  errors?: Partial<Record<keyof EmployeeFormData, string>>;
}

export const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({ formData, onChange, errors }) => {
  const { user } = useAuth();
  const companyId = user?.companyId ? String(user.companyId) : undefined;
  const { data: employmentTypes, isLoading: employmentTypesLoading } = useEmploymentTypes(companyId);

  const uniqueEmploymentTypes = React.useMemo(
    () => {
      if (!employmentTypes) return [];
      const seen = new Set<number>();
      return employmentTypes.filter((type) => {
        if (seen.has(type.id)) return false;
        seen.add(type.id);
        return true;
      });
    },
    [employmentTypes],
  );

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange({ ...formData, photoFile: file });
    }
  };

  return (
    <div className="space-y-6">
      {/* Employee Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Employee contact information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-8">
            {/* Photo Upload */}
            <div className="flex flex-col items-center">
              <label
                htmlFor="photo-upload"
                className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center flex-col cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Upload className="h-6 w-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Click to upload photo</span>
              </label>
              <input
                id="photo-upload"
                type="file"
                accept=".jpg,.jpeg,.png"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Only upload .jpg, .jpeg, .png
              </p>
            </div>

            {/* Contact Fields */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => onChange({ ...formData, name: e.target.value })}
                    className="mt-1"
                  />
                  {errors?.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jd@sample.com"
                    value={formData.email}
                    onChange={(e) => onChange({ ...formData, email: e.target.value })}
                    className="mt-1"
                  />
                  {errors?.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="mobileNumber" className="text-sm font-medium">
                    Mobile number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mobileNumber"
                    type="tel"
                    placeholder="+45 71143360"
                    value={formData.mobileNumber}
                    onChange={(e) => onChange({ ...formData, mobileNumber: e.target.value })}
                    className="mt-1"
                  />
                  {errors?.mobileNumber && <p className="text-xs text-red-600 mt-1">{errors.mobileNumber}</p>}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="alternateNumber" className="text-sm font-medium">
                    Alternate number
                  </Label>
                  <Input
                    id="alternateNumber"
                    type="tel"
                    placeholder="+45 71143360"
                    value={formData.alternateNumber}
                    onChange={(e) => onChange({ ...formData, alternateNumber: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    SMS messages will be attempted to be sent to this number if Mobile number is not filled in.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="public-info"
                  checked={formData.makeContactPublic}
                  onChange={(e) =>
                    onChange({ ...formData, makeContactPublic: e.target.checked })
                  }
                />
                <Label htmlFor="public-info" className="text-sm font-normal cursor-pointer">
                  Make information public. Once public, their information will be visible in the infolist.
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Emergency contact information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="emergencyName" className="text-sm font-medium">
              Name
            </Label>
            <Input
              id="emergencyName"
              placeholder="John Doe"
              value={formData.emergencyName}
              onChange={(e) => onChange({ ...formData, emergencyName: e.target.value })}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1 italic">
              Name of the person who we will contact in case of emergency.
            </p>
          </div>

          <div>
            <Label htmlFor="emergencyMobile" className="text-sm font-medium">
              Mobile number
            </Label>
            <Input
              id="emergencyMobile"
              type="tel"
              placeholder="+45 71143360"
              value={formData.emergencyMobile}
              onChange={(e) => onChange({ ...formData, emergencyMobile: e.target.value })}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1 italic">
              The number will be used to contact your relative in case of emergency.
            </p>
          </div>

          <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="public-emergency"
              checked={formData.makeEmergencyPublic}
              onChange={(e) =>
                onChange({ ...formData, makeEmergencyPublic: e.target.checked })
              }
            />
            <Label htmlFor="public-emergency" className="text-sm font-normal cursor-pointer">
              Make information public. <span className="text-red-600 font-semibold">REMEMBER</span> to seek your relative's permission to make their contact details public. Once public, their information will be visible in the infolist.
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Employment Type, Permissions & Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Employment type, permissions & notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Employment Type */}
          <div>
            <Label className="text-sm font-medium">
              Employment type <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2 space-y-2">
              <RadioGroup
                value={formData.employmentType}
                onValueChange={(value) => onChange({ ...formData, employmentType: value })}
                className="space-y-2"
              >
                <RadioGroupItem value="none" id="employment-none">
                  No employment type
                </RadioGroupItem>
                {companyId &&
                  !employmentTypesLoading &&
                  uniqueEmploymentTypes.length > 0 &&
                  uniqueEmploymentTypes.map((type) => (
                    <RadioGroupItem
                      key={type.id}
                      value={String(type.id)}
                      id={`employment-${type.id}`}
                    >
                      {type.name}
                    </RadioGroupItem>
                  ))}
              </RadioGroup>
              {companyId && employmentTypesLoading && (
                <p className="text-xs text-gray-500">Loading employment types…</p>
              )}
              {companyId &&
                !employmentTypesLoading &&
                uniqueEmploymentTypes.length === 0 && (
                  <p className="text-xs text-gray-500">No employment types created yet.</p>
                )}
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-wrap items-center gap-3 py-2">
            <Label className="text-sm font-medium">Status</Label>
            <button
              type="button"
              onClick={() => onChange({ ...formData, status: !formData.status })}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
                formData.status
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  formData.status ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
              <span className="text-sm font-medium">
                {formData.status ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </button>
            <span className="text-xs text-gray-600">
              Untick to block access, but keep the employee in the list without the license counting.
            </span>
          </div>

          {/* Permissions */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Permissions</Label>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="senior"
                  checked={formData.isSeniorEmployee}
                  onChange={(e) =>
                    onChange({ ...formData, isSeniorEmployee: e.target.checked })
                  }
                />
                <Label htmlFor="senior" className="text-sm font-normal cursor-pointer">
                  Senior employee. Allow the employee to view the management handbook.
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="admin"
                  checked={formData.isBusinessAdmin}
                  onChange={(e) =>
                    onChange({ ...formData, isBusinessAdmin: e.target.checked })
                  }
                />
                <Label htmlFor="admin" className="text-sm font-normal cursor-pointer">
                  Business administrator. Allow the employee to edit and change the handbook.
                </Label>
              </div>
            </div>
          </div>

          {/* Send Email to Employee */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Send email to employee</Label>
            <RadioGroup
              value={formData.sendEmail}
              onValueChange={(value) => onChange({ ...formData, sendEmail: value })}
              className="space-y-2"
            >
              <RadioGroupItem value="no" id="email-no">
                No
              </RadioGroupItem>
              <RadioGroupItem value="standard" id="email-standard">
                Standard
              </RadioGroupItem>
              <RadioGroupItem value="customized" id="email-customized">
                Customized
              </RadioGroupItem>
            </RadioGroup>
            <p className="text-xs text-gray-500 mt-2 italic">
              Send a message with a link to the handbook.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
