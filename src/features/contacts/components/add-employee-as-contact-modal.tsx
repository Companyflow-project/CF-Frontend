import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useContactAreas } from '../hooks';
import { UserCheck, Plus, X } from 'lucide-react';

export interface AddEmployeeAsContactPayload {
  uid: number;
  name: string;
  phone?: string;
  areaIds: number[];
  /** Names of brand-new areas created in this modal. */
  newAreas?: string[];
}

export interface EmployeeContactData {
  uid: number;
  name: string;
  email: string;
  telephone?: string;
}

interface AddEmployeeAsContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeContactData | null;
  /** Area ids already assigned to this contact (edit mode) */
  existingAreaIds?: number[];
  /** If provided the modal is in edit mode (shows "Save" instead of "Add") */
  contactId?: string;
  onConfirm: (data: AddEmployeeAsContactPayload) => void;
}

/** Values that mean "no real phone number" — treated as empty */
const isPlaceholder = (v?: string) =>
  !v || ['n/a', 'not available', '-', 'none', ''].includes(v.trim().toLowerCase());

export const AddEmployeeAsContactModal: React.FC<AddEmployeeAsContactModalProps> = ({
  open,
  onOpenChange,
  employee,
  existingAreaIds = [],
  contactId,
  onConfirm,
}) => {
  const isEditMode = !!contactId;
  const { data: areasData } = useContactAreas();
  const [phone, setPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [selectedAreaIds, setSelectedAreaIds] = useState<number[]>([]);
  const [customAreas, setCustomAreas] = useState<string[]>([]);
  const [newCustomArea, setNewCustomArea] = useState('');
  const [isAddingCustomArea, setIsAddingCustomArea] = useState(false);

  useEffect(() => {
    if (open && employee) {
      setPhone(isPlaceholder(employee.telephone) ? '' : (employee.telephone ?? ''));
      setPhoneTouched(false);
      setSelectedAreaIds(existingAreaIds ?? []);
      setCustomAreas([]);
      setNewCustomArea('');
      setIsAddingCustomArea(false);
    }
    // existingAreaIds omitted: when default [] is used it's a new ref each render → infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employee]);

  const phoneEmpty = phone.trim() === '';
  const showPhoneError = phoneTouched && phoneEmpty;

  const handleAreaToggle = (areaId: number) => {
    setSelectedAreaIds((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId],
    );
  };

  const handleStartCustomArea = () => setIsAddingCustomArea(true);
  const handleConfirmCustomArea = () => {
    const trimmed = newCustomArea.trim();
    if (trimmed && !customAreas.includes(trimmed)) {
      setCustomAreas((prev) => [...prev, trimmed]);
    }
    setNewCustomArea('');
    setIsAddingCustomArea(false);
  };
  const handleRemoveCustomArea = (index: number) =>
    setCustomAreas((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = () => {
    if (!employee) return;
    if (phoneEmpty) {
      setPhoneTouched(true);
      return;
    }
    const newAreas = customAreas.map((a) => a.trim()).filter((a) => a !== '');
    onConfirm({
      uid: employee.uid,
      name: employee.name,
      phone: phone.trim() || undefined,
      areaIds: selectedAreaIds,
      newAreas,
    });
    onOpenChange(false);
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] w-[95vw] p-0 flex flex-col gap-0 rounded-[20px] overflow-hidden border border-[#e5efea] shadow-[0_20px_60px_rgba(14,51,38,0.15)] max-h-[90vh]">

        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e5efea] bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[12px] bg-[#d4f4e6] flex items-center justify-center flex-shrink-0">
              <UserCheck className="h-5 w-5 text-[#1a5948]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#0d0e0e]">
                {isEditMode ? 'Edit employee contact' : 'Add existing employee'}
              </DialogTitle>
              <p className="text-xs text-[#6b7280] mt-0.5">
                {isEditMode
                  ? 'Update details and areas of responsibility'
                  : 'Confirm details and areas of responsibility'}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 bg-white space-y-5">

          {/* Name / Email / Phone row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Name — read-only */}
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-[#6b7280] mb-1 block">Name</label>
              <Input
                readOnly
                tabIndex={-1}
                value={employee.name}
                className="h-10 rounded-[10px] border-[#e5e7eb] bg-[#f3f4f6] text-[#6b7280] cursor-not-allowed text-sm select-none"
              />
            </div>

            {/* Email — read-only */}
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-[#6b7280] mb-1 block">Email</label>
              <Input
                readOnly
                tabIndex={-1}
                value={employee.email}
                className="h-10 rounded-[10px] border-[#e5e7eb] bg-[#f3f4f6] text-[#6b7280] cursor-not-allowed text-sm select-none"
              />
            </div>

            {/* Telephone */}
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-[#0d0e0e] mb-1 block">
                Telephone
                {phoneEmpty && <span className="ml-1 text-[#d5384b]">*</span>}
              </label>
              <Input
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => setPhoneTouched(true)}
                className={`h-10 rounded-[10px] text-sm transition-colors ${phoneEmpty
                    ? 'border-[#d5384b] focus:ring-[#d5384b]/30 focus:border-[#d5384b]'
                    : 'border-[#e5e7eb] focus:ring-[#3d997d]/30 focus:border-[#3d997d]'
                  }`}
              />
              {showPhoneError && (
                <p className="text-xs text-[#d5384b] mt-1">Phone number is required</p>
              )}
            </div>
          </div>

          {/* ── Areas of responsibility ── */}
          <div className="space-y-3">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#0d0e0e]">
                Areas of responsibility
                <span className="ml-1 text-[#d5384b]">*</span>
              </label>
              {!isAddingCustomArea && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleStartCustomArea}
                  className="h-8 gap-1.5 text-xs text-[#1a5948] hover:bg-[#f0f7f5] rounded-[8px] px-3"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create new
                </Button>
              )}
            </div>

            {/* 3-column flat checkbox grid — buttons so clicks register reliably in the dialog */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
              {areasData.map((area) => {
                const isChecked = selectedAreaIds.includes(area.id);
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => handleAreaToggle(area.id)}
                    className={[
                      'flex items-center gap-2 rounded-[10px] border text-left transition-all w-full px-3 py-2 text-sm font-medium',
                      isChecked
                        ? 'bg-[#d4f4e6] border-[#3d997d] text-[#1a5948]'
                        : 'bg-white border-[#e5e7eb] text-[#374151] hover:border-[#3d997d]/40 hover:bg-[#f6fbf9]',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'h-4 w-4 rounded-[4px] border-2 flex items-center justify-center flex-shrink-0',
                        isChecked ? 'bg-[#3d997d] border-[#3d997d]' : 'border-[#d1d5db] bg-white',
                      ].join(' ')}
                    >
                      {isChecked && (
                        <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    {area.name}
                  </button>
                );
              })}

              {/* Custom (user-added) areas */}
              {customAreas.map((area, index) => (
                <div
                  key={`custom-${index}`}
                  className="flex items-center gap-2 group"
                >
                  <span className="h-4 w-4 rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 bg-[#3d997d] border-[#3d997d]">
                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="text-sm text-[#1a5948] font-medium flex-1">{area}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomArea(index)}
                    className="h-4 w-4 rounded-full flex items-center justify-center text-[#9ca3af] hover:text-[#d5384b] hover:bg-[#ffecef] transition-colors flex-shrink-0"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Custom area input */}
            {isAddingCustomArea && (
              <div className="flex items-center gap-2 pt-1">
                <Input
                  autoFocus
                  placeholder="New area of responsibility…"
                  value={newCustomArea}
                  onChange={(e) => setNewCustomArea(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmCustomArea();
                    }
                  }}
                  className="h-10 rounded-[10px] border-[#3d997d]/50 text-sm placeholder:text-[#9ca3af] focus:ring-2 focus:ring-[#3d997d]/30 focus:border-[#3d997d]"
                />
                <Button
                  type="button"
                  onClick={handleConfirmCustomArea}
                  className="h-10 px-4 rounded-[10px] bg-[#3d997d] text-white hover:bg-[#3d997d]/90"
                >
                  Add
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCustomArea(false);
                    setNewCustomArea('');
                  }}
                  className="h-10 w-10 flex items-center justify-center rounded-[10px] hover:bg-[#ffecef] text-[#9ca3af] hover:text-[#d5384b] transition-colors flex-shrink-0"
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-[#e5efea] bg-[#f9fafb] flex justify-end gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 px-5 rounded-[10px] border-[#e5e7eb] text-[#374151] text-sm hover:bg-[#f9fafb]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="h-10 px-5 rounded-[10px] bg-[#3d997d] hover:bg-[#3d997d]/90 text-white text-sm shadow-[0_4px_12px_rgba(23,102,79,0.3)]"
          >
            {isEditMode ? 'Save' : 'Add'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
