import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Upload, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useEmploymentTypes } from '@/features/employment-types/hooks';
import { employeesApi } from '../api';

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
  /** fid returned from POST /files after the user picks a profile photo. null = no photo yet. */
  userPictureFid: number | null;
}

interface AddEmployeeFormProps {
  formData: EmployeeFormData;
  onChange: (data: EmployeeFormData) => void;
  errors?: Partial<Record<keyof EmployeeFormData, string>>;
  /** True when editing an existing employee (vs creating a new one) */
  isEditMode?: boolean;
  /** True when the employee being edited is the currently logged-in user */
  isSelf?: boolean;
  /** Existing profile photo URI from the backend — shown as initial preview in edit mode */
  existingPhotoUri?: string | null;
  /**
   * Callback ref-setter: called once with the ref that always holds the latest uploaded fid.
   * The parent page reads ref.current when building the PATCH payload.
   * This avoids stale-closure issues with formData at save time.
   */
  onFidRefReady?: (ref: React.MutableRefObject<number | null>) => void;
}

/** Strip non-digit characters and enforce the 10-digit INT max (2 147 483 647). */
const sanitisePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  return digits.slice(0, 10);
};

/** Format 8-digit Danish numbers as "XX XX XX XX"; longer numbers left as-is. */
const formatDanishPhone = (digits: string): string => {
  if (digits.length === 8) {
    return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  }
  return digits;
};

/** Strip non-digits; validate against INT max (no schema change). Returns number or null if empty. Throws 400 if overflow. */
const exceedsIntMax = (digits: string): boolean =>
  digits.length > 0 && parseInt(digits, 10) > 2_147_483_647;

/**
 * Drupal returns photo URIs as relative paths: /sites/default/files/2026-02/xxx.png
 * These must be prefixed with the backend origin so the browser can load them.
 * Locally-created object URLs (blob:...) and already-absolute URLs are passed through as-is.
 */
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
function resolvePhotoUrl(uri: string | null | undefined): string | null {
  if (!uri) return null;
  if (uri.startsWith('blob:') || uri.startsWith('http') || uri.startsWith('data:')) return uri;
  // Strip any trailing /api suffix from the base URL before appending the file path
  const base = API_ORIGIN.replace(/\/api\/?$/, '');
  return `${base}${uri}`;
}

export const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({ formData, onChange, errors, isEditMode = false, isSelf = false, existingPhotoUri, onFidRefReady }) => {
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

  /** Centralised phone change handler — keeps raw digits in formData. */
  const handlePhoneChange =
    (field: 'mobileNumber' | 'alternateNumber' | 'emergencyMobile') =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const clean = sanitisePhone(e.target.value);
        onChange({ ...formData, [field]: clean });
      };

  // Ref that always holds the latest uploaded fid — immune to stale closures.
  // The parent reads this ref when building the PATCH payload at save time.
  const uploadedFidRef = useRef<number | null>(null);
  React.useEffect(() => { onFidRefReady?.(uploadedFidRef); }, [onFidRefReady]);

  // Local photo upload state — result surfaced via formData.userPictureFid
  // Initialise with the existing URI (edit mode) so the saved photo shows immediately.
  // resolvePhotoUrl prefixes the backend origin so relative /sites/default/files/... paths load correctly.
  const [photoPreview, setPhotoPreview] = useState<string | null>(resolvePhotoUrl(existingPhotoUri));
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Keep photoPreview in sync when existingPhotoUri arrives asynchronously
  // (e.g. the employee record loaded after the component first mounted)
  // Only update if there is no locally-uploaded preview already set.
  React.useEffect(() => {
    const resolved = resolvePhotoUrl(existingPhotoUri);
    if (resolved) {
      setPhotoPreview((current) => {
        // Don't overwrite a blob: URL the user just uploaded
        if (current && current.startsWith('blob:')) return current;
        return resolved;
      });
    }
  }, [existingPhotoUri]);

  /**
   * Step 1 of the two-step photo flow.
   * Upload immediately on file select → store returned fid in BOTH formData AND the ref.
   * The ref is always current; the parent reads it at save time to bypass stale-closure issues.
   */
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const { fid } = await employeesApi.uploadProfilePhoto(file);
      uploadedFidRef.current = fid; // always current — read by parent at save time
      onChange({ ...formData, userPictureFid: fid }); // also keep formData in sync if possible
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Photo upload failed. Please try again.');
      setPhotoPreview(resolvePhotoUrl(existingPhotoUri));
      uploadedFidRef.current = null;
      onChange({ ...formData, userPictureFid: null });
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const handleClearPhoto = () => {
    setPhotoPreview(null);
    setPhotoError(null);
    uploadedFidRef.current = null;
    onChange({ ...formData, userPictureFid: null });
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
              <div className="relative w-32 h-32">
                {photoPreview ? (
                  <>
                    <img
                      src={photoPreview}
                      alt="Profile preview"
                      className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                    />
                    {!photoUploading && (
                      <button
                        type="button"
                        onClick={handleClearPhoto}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
                        aria-label="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {photoUploading && (
                      <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                      </div>
                    )}
                  </>
                ) : (
                  <label
                    htmlFor="photo-upload"
                    className={`w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center flex-col transition-colors ${photoUploading
                      ? 'border-teal-400 bg-teal-50 cursor-not-allowed'
                      : 'border-gray-300 hover:bg-gray-50 cursor-pointer'
                      }`}
                  >
                    {photoUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500 text-center px-2">Click to upload</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              <input
                id="photo-upload"
                type="file"
                accept=".jpg,.jpeg,.png"
                className="hidden"
                disabled={photoUploading}
                onChange={handlePhotoUpload}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">Only .jpg, .jpeg, .png</p>
              {formData.userPictureFid != null && !photoUploading && (
                <p className="text-xs text-teal-600 mt-1">✓ Photo uploaded</p>
              )}
              {photoError && (
                <p className="text-xs text-red-600 mt-1 text-center">{photoError}</p>
              )}
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
                    Email {!isEditMode && <span className="text-red-500">*</span>}
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="email"
                      type="email"
                      placeholder="jd@sample.com"
                      value={formData.email}
                      onChange={(e) => !isEditMode && onChange({ ...formData, email: e.target.value })}
                      readOnly={isEditMode}
                      className={isEditMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed select-none' : ''}
                    />
                    {isEditMode && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">Locked</span>
                    )}
                  </div>
                  {!isEditMode && errors?.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="mobileNumber" className="text-sm font-medium">
                    Mobile number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mobileNumber"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 71143360"
                    value={formatDanishPhone(formData.mobileNumber)}
                    onChange={handlePhoneChange('mobileNumber')}
                    className={`mt-1 ${exceedsIntMax(formData.mobileNumber) ? 'border-red-500 focus-visible:ring-red-400' : ''}`}
                  />
                  {exceedsIntMax(formData.mobileNumber) && (
                    <p className="text-xs text-red-600 mt-1">Number exceeds system limit (max 2 147 483 647).</p>
                  )}
                  {errors?.mobileNumber && !exceedsIntMax(formData.mobileNumber) && (
                    <p className="text-xs text-red-600 mt-1">{errors.mobileNumber}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="alternateNumber" className="text-sm font-medium">
                    Alternate number
                  </Label>
                  <Input
                    id="alternateNumber"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 71143360"
                    value={formatDanishPhone(formData.alternateNumber)}
                    onChange={handlePhoneChange('alternateNumber')}
                    className={`mt-1 ${exceedsIntMax(formData.alternateNumber) ? 'border-red-500 focus-visible:ring-red-400' : ''}`}
                  />
                  {exceedsIntMax(formData.alternateNumber) && (
                    <p className="text-xs text-red-600 mt-1">Number exceeds system limit (max 2 147 483 647).</p>
                  )}
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
              type="text"
              inputMode="numeric"
              placeholder="e.g. 71143360"
              value={formatDanishPhone(formData.emergencyMobile)}
              onChange={handlePhoneChange('emergencyMobile')}
              className={`mt-1 ${exceedsIntMax(formData.emergencyMobile) ? 'border-red-500 focus-visible:ring-red-400' : ''}`}
            />
            {exceedsIntMax(formData.emergencyMobile) && (
              <p className="text-xs text-red-600 mt-1">Number exceeds system limit (max 2 147 483 647).</p>
            )}
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

      {/* Employment Type, Permissions & Notifications — hidden when editing yourself */}
      {!isSelf && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Employment type, permissions &amp; notifications</CardTitle>
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
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${formData.status ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
              >
                <span className={`w-2 h-2 rounded-full ${formData.status ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium">{formData.status ? 'ACTIVE' : 'INACTIVE'}</span>
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
                    onChange={(e) => onChange({ ...formData, isSeniorEmployee: e.target.checked })}
                  />
                  <Label htmlFor="senior" className="text-sm font-normal cursor-pointer">
                    Senior employee. Allow the employee to view the management handbook.
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="admin"
                    checked={formData.isBusinessAdmin}
                    onChange={(e) => onChange({ ...formData, isBusinessAdmin: e.target.checked })}
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
                <RadioGroupItem value="no" id="email-no">No</RadioGroupItem>
                <RadioGroupItem value="standard" id="email-standard">Standard</RadioGroupItem>
                <RadioGroupItem value="customized" id="email-customized">Customized</RadioGroupItem>
              </RadioGroup>
              <p className="text-xs text-gray-500 mt-2 italic">
                Send a message with a link to the handbook.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
