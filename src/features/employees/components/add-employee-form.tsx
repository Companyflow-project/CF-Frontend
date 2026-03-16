import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Upload, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useEmploymentTypes } from '@/features/employment-types/hooks';
import { employeesApi } from '../api';

/** All languages that can be assigned to employees. */
const ALL_LANGUAGES: readonly { code: string; label: string; flag: string; isDefault?: boolean }[] = [
  { code: 'da', label: 'Danish', flag: '🇩🇰', isDefault: true },
  { code: 'en', label: 'English (US)', flag: '🇺🇸' },
  { code: 'en-uk', label: 'English (UK)', flag: '🇬🇧' },
  { code: 'nl', label: 'Dutch', flag: '🇳🇱' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
];

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
  languages: string[];
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
  /** True when the employee being edited is the account owner (company registrant) — locks permissions */
  isAccountOwner?: boolean;
  /** Existing profile photo URI from the backend — shown as initial preview in edit mode */
  existingPhotoUri?: string | null;
  /**
   * Callback ref-setter: called once with the ref that always holds the latest uploaded fid.
   * The parent page reads ref.current when building the PATCH payload.
   * This avoids stale-closure issues with formData at save time.
   */
  onFidRefReady?: (ref: React.MutableRefObject<number | null>) => void;
}

/** Strip non-digit characters; allow up to 15 digits (international E.164 max). */
const sanitisePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  return digits.slice(0, 15);
};

/** Format 8-digit Danish numbers as "XX XX XX XX"; longer numbers left as-is. */
const formatDanishPhone = (digits: string): string => {
  if (digits.length === 8) {
    return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  }
  return digits;
};

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

export const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({ formData, onChange, errors, isEditMode = false, isSelf = false, isAccountOwner = false, existingPhotoUri, onFidRefReady }) => {
  const { t } = useTranslation('employees');
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
          <CardTitle className="text-lg font-semibold">{t('form.contactInfo')}</CardTitle>
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
                      alt={t('form.profilePreview')}
                      className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                    />
                    {!photoUploading && (
                      <button
                        type="button"
                        onClick={handleClearPhoto}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
                        aria-label={t('form.removePhoto')}
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
                        <span className="text-xs text-gray-500 text-center px-2">{t('form.clickToUpload')}</span>
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
              <p className="text-xs text-gray-500 mt-2 text-center">{t('form.photoFormats')}</p>
              {formData.userPictureFid != null && !photoUploading && (
                <p className="text-xs text-teal-600 mt-1">✓ {t('form.photoUploaded')}</p>
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
                    {t('form.name')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder={t('form.namePlaceholder')}
                    value={formData.name}
                    onChange={(e) => onChange({ ...formData, name: e.target.value })}
                    className="mt-1"
                  />
                  {errors?.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    {t('form.email')} {!isEditMode && <span className="text-red-500">*</span>}
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('form.emailPlaceholder')}
                      value={formData.email}
                      onChange={(e) => !isEditMode && onChange({ ...formData, email: e.target.value })}
                      readOnly={isEditMode}
                      className={isEditMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed select-none' : ''}
                    />
                    {isEditMode && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">{t('form.locked')}</span>
                    )}
                  </div>
                  {!isEditMode && errors?.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="mobileNumber" className="text-sm font-medium">
                    {t('form.mobileNumber')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mobileNumber"
                    type="text"
                    inputMode="numeric"
                    placeholder={t('form.phonePlaceholder')}
                    value={formatDanishPhone(formData.mobileNumber)}
                    onChange={handlePhoneChange('mobileNumber')}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('form.phoneHint')}</p>
                  {errors?.mobileNumber && (
                    <p className="text-xs text-red-600 mt-1">{errors.mobileNumber}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="alternateNumber" className="text-sm font-medium">
                    {t('form.alternateNumber')}
                  </Label>
                  <Input
                    id="alternateNumber"
                    type="text"
                    inputMode="numeric"
                    placeholder={t('form.phonePlaceholder')}
                    value={formatDanishPhone(formData.alternateNumber)}
                    onChange={handlePhoneChange('alternateNumber')}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('form.alternateNumberDesc')}
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
                  {t('form.makePublic')}
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t('form.emergency.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="emergencyName" className="text-sm font-medium">
              {t('form.name')}
            </Label>
            <Input
              id="emergencyName"
              placeholder={t('form.namePlaceholder')}
              value={formData.emergencyName}
              onChange={(e) => onChange({ ...formData, emergencyName: e.target.value })}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1 italic">
              {t('form.emergency.nameDesc')}
            </p>
          </div>

          <div>
            <Label htmlFor="emergencyMobile" className="text-sm font-medium">
              {t('form.mobileNumber')}
            </Label>
            <Input
              id="emergencyMobile"
              type="text"
              inputMode="numeric"
              placeholder={t('form.phonePlaceholder')}
              value={formatDanishPhone(formData.emergencyMobile)}
              onChange={handlePhoneChange('emergencyMobile')}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1 italic">
              {t('form.emergency.mobileDesc')}
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
              {t('form.emergency.makePublicPrefix')} <span className="text-red-600 font-semibold">{t('form.emergency.remember')}</span> {t('form.emergency.makePublicSuffix')}
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Employment Type, Permissions & Notifications — hidden when editing yourself */}
      {!isSelf && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t('form.employment.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Employment Type */}
            <div>
              <Label className="text-sm font-medium">
                {t('form.employment.type')} <span className="text-red-500">*</span>
              </Label>
              <div className="mt-2 space-y-2">
                <RadioGroup
                  value={formData.employmentType}
                  onValueChange={(value) => onChange({ ...formData, employmentType: value })}
                  className="space-y-2"
                >
                  <RadioGroupItem value="none" id="employment-none">
                    {t('form.employment.noType')}
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
                  <p className="text-xs text-gray-500">{t('form.employment.loading')}</p>
                )}
                {companyId &&
                  !employmentTypesLoading &&
                  uniqueEmploymentTypes.length === 0 && (
                    <p className="text-xs text-gray-500">{t('form.employment.noTypes')}</p>
                  )}
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-wrap items-center gap-3 py-2">
              <Label className="text-sm font-medium">{t('form.status')}</Label>
              <button
                type="button"
                onClick={() => onChange({ ...formData, status: !formData.status })}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${formData.status ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
              >
                <span className={`w-2 h-2 rounded-full ${formData.status ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium">{formData.status ? t('form.statusActive') : t('form.statusInactive')}</span>
              </button>
              <span className="text-xs text-gray-600">
                {t('form.statusDesc')}
              </span>
            </div>

            {/* Permissions */}
            <div>
              <Label className="text-sm font-medium mb-3 block">{t('form.permissions')}</Label>
              {isAccountOwner ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-amber-800 font-medium">{t('form.permAccountOwner')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="perm-senior"
                      checked={formData.isSeniorEmployee}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onChange({ ...formData, isSeniorEmployee: true, isBusinessAdmin: false });
                        } else {
                          onChange({ ...formData, isSeniorEmployee: false });
                        }
                      }}
                    />
                    <Label htmlFor="perm-senior" className="text-sm font-normal cursor-pointer">
                      {t('form.permSenior')}
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="perm-admin"
                      checked={formData.isBusinessAdmin}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onChange({ ...formData, isBusinessAdmin: true, isSeniorEmployee: false });
                        } else {
                          onChange({ ...formData, isBusinessAdmin: false });
                        }
                      }}
                    />
                    <Label htmlFor="perm-admin" className="text-sm font-normal cursor-pointer">
                      {t('form.permAdmin')}
                    </Label>
                  </div>
                </div>
              )}
            </div>

            {/* Employee Languages */}
            <div>
              <Label className="text-sm font-medium mb-3 block">{t('form.languages')}</Label>
              <p className="text-xs text-gray-500 mb-3">{t('form.languagesDesc')}</p>
              <div className="space-y-2">
                {ALL_LANGUAGES.map((lang) => {
                  const isCompanyLang = (user?.companyLanguages ?? ['da']).includes(lang.code);
                  if (!isCompanyLang) return null;
                  const isChecked = formData.languages.includes(lang.code);
                  const isDanish = lang.code === 'da';
                  return (
                    <div key={lang.code} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lang-${lang.code}`}
                        checked={isChecked}
                        disabled={isDanish}
                        onChange={(e) => {
                          if (isDanish) return;
                          const next = e.target.checked
                            ? [...formData.languages, lang.code]
                            : formData.languages.filter(l => l !== lang.code);
                          onChange({ ...formData, languages: next });
                        }}
                      />
                      <Label htmlFor={`lang-${lang.code}`} className={`text-sm font-normal cursor-pointer ${isDanish ? 'text-gray-500' : ''}`}>
                        <span className="mr-1.5">{lang.flag}</span>
                        {lang.label}
                        {isDanish && <span className="text-gray-400 text-xs ml-1">({t('form.languageDefault')})</span>}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Send Email to Employee */}
            <div>
              <Label className="text-sm font-medium mb-2 block">{t('form.sendEmail')}</Label>
              <RadioGroup
                value={formData.sendEmail}
                onValueChange={(value) => onChange({ ...formData, sendEmail: value })}
                className="space-y-2"
              >
                <RadioGroupItem value="no" id="email-no">{t('form.sendEmailNo')}</RadioGroupItem>
                <RadioGroupItem value="standard" id="email-standard">{t('form.sendEmailStandard')}</RadioGroupItem>
                <RadioGroupItem value="customized" id="email-customized">{t('form.sendEmailCustomized')}</RadioGroupItem>
              </RadioGroup>
              <p className="text-xs text-gray-500 mt-2 italic">
                {t('form.sendEmailDesc')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
