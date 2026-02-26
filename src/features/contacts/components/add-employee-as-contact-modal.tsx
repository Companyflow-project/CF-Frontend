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
  selectedTids: number[];
  customAreas: string[];
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
  /** Tids already assigned to this contact (edit mode) — shown as muted/disabled */
  existingTids?: number[];
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
  existingTids = [],
  contactId,
  onConfirm,
}) => {
  const isEditMode = !!contactId;
  const { data: areasData } = useContactAreas();
  const [phone, setPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [selectedTids, setSelectedTids] = useState<number[]>([]);
  const [customAreas, setCustomAreas] = useState<string[]>([]);

  useEffect(() => {
    if (open && employee) {
      setPhone(isPlaceholder(employee.telephone) ? '' : (employee.telephone ?? ''));
      setPhoneTouched(false);
      setSelectedTids([]);
      setCustomAreas([]);
    }
  }, [open, employee]);

  const phoneEmpty = phone.trim() === '';
  const showPhoneError = phoneTouched && phoneEmpty;

  const handleAreaToggle = (tid: number) => {
    // Muted (existing) areas cannot be toggled
    if (existingTids.includes(tid)) return;
    setSelectedTids((prev) =>
      prev.includes(tid) ? prev.filter((t) => t !== tid) : [...prev, tid],
    );
  };

  const handleAddCustomArea = () => setCustomAreas((prev) => [...prev, '']);

  const handleCustomAreaChange = (index: number, value: string) =>
    setCustomAreas((prev) => prev.map((a, i) => (i === index ? value : a)));

  const handleRemoveCustomArea = (index: number) =>
    setCustomAreas((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = () => {
    if (!employee) return;
    if (phoneEmpty) {
      setPhoneTouched(true);
      return;
    }
    onConfirm({
      uid: employee.uid,
      name: employee.name,
      phone: phone.trim() || undefined,
      // Include newly selected tids only (existing ones are managed by the backend)
      selectedTids,
      customAreas: customAreas.filter((a) => a.trim() !== ''),
    });
    onOpenChange(false);
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] p-0 gap-0 rounded-[20px] overflow-hidden border border-[#e5efea] shadow-[0_20px_60px_rgba(14,51,38,0.15)]">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e5efea] bg-white">
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

        {/* Body */}
        <div className="px-6 py-5 bg-white space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Inline fields row */}
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
            {/* Name — muted */}
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-[#6b7280] mb-1 block">Name</label>
              <Input
                readOnly
                tabIndex={-1}
                value={employee.name}
                className="h-10 rounded-[10px] border-[#e5e7eb] bg-[#f3f4f6] text-[#6b7280] cursor-not-allowed text-sm select-none"
              />
            </div>

            {/* Email — muted */}
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-[#6b7280] mb-1 block">Email</label>
              <Input
                readOnly
                tabIndex={-1}
                value={employee.email}
                className="h-10 rounded-[10px] border-[#e5e7eb] bg-[#f3f4f6] text-[#6b7280] cursor-not-allowed text-sm select-none"
              />
            </div>

            {/* Telephone — required if blank */}
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
                className={`h-10 rounded-[10px] text-sm transition-colors ${
                  phoneEmpty
                    ? 'border-[#d5384b] focus:ring-[#d5384b]/30 focus:border-[#d5384b]'
                    : 'border-[#e5e7eb] focus:ring-[#3d997d]/30 focus:border-[#3d997d]'
                }`}
              />
              {showPhoneError && (
                <p className="text-xs text-[#d5384b] mt-1">Phone number is required</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={handleSubmit}
                className="h-10 px-5 rounded-[10px] bg-[#3d997d] hover:bg-[#3d997d]/90 text-white text-sm shadow-[0_4px_12px_rgba(23,102,79,0.3)]"
              >
                {isEditMode ? 'Save' : 'Add'}
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 px-5 rounded-[10px] border-[#e5e7eb] text-[#374151] text-sm hover:bg-[#f9fafb]"
              >
                Cancel
              </Button>
            </div>
          </div>

          {/* Areas of responsibility */}
          <div className="space-y-2 pt-1 border-t border-[#f0f4f2]">
            <div className="flex items-center justify-between pt-3">
              <label className="text-sm font-semibold text-[#0d0e0e]">
                Areas of responsibility
                <span className="ml-1 text-[#d5384b]">*</span>
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddCustomArea}
                className="h-8 gap-1.5 text-xs text-[#1a5948] hover:bg-[#f0f7f5] rounded-[8px] px-3"
              >
                <Plus className="h-3.5 w-3.5" />
                Create new
              </Button>
            </div>

            {isEditMode && existingTids.length > 0 && (
              <p className="text-xs text-[#9ca3af]">
                Greyed areas are already assigned. Check new ones to add more.
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {areasData.map((area) => {
                const isExisting = existingTids.includes(area.tid);
                const isNewlyChecked = selectedTids.includes(area.tid);

                return (
                  <button
                    key={area.tid}
                    type="button"
                    disabled={isExisting}
                    onClick={() => handleAreaToggle(area.tid)}
                    className={[
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] border text-sm font-medium transition-all text-left',
                      isExisting
                        ? 'bg-[#f3f4f6] border-[#d1d5db] text-[#9ca3af] cursor-not-allowed opacity-70'
                        : isNewlyChecked
                          ? 'bg-[#d4f4e6] border-[#3d997d] text-[#1a5948]'
                          : 'bg-white border-[#e5e7eb] text-[#374151] hover:border-[#3d997d]/40 hover:bg-[#f6fbf9]',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'h-4 w-4 rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                        isExisting
                          ? 'bg-[#d1d5db] border-[#d1d5db]'
                          : isNewlyChecked
                            ? 'bg-[#3d997d] border-[#3d997d]'
                            : 'border-[#d1d5db] bg-white',
                      ].join(' ')}
                    >
                      {(isExisting || isNewlyChecked) && (
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
            </div>

            {/* Custom area inputs */}
            {customAreas.length > 0 && (
              <div className="space-y-2 pt-1">
                {customAreas.map((area, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="New area of responsibility…"
                      value={area}
                      onChange={(e) => handleCustomAreaChange(index, e.target.value)}
                      className="h-10 rounded-[10px] border-[#3d997d]/50 text-sm placeholder:text-[#9ca3af] focus:ring-2 focus:ring-[#3d997d]/30 focus:border-[#3d997d]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomArea(index)}
                      className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-[#ffecef] text-[#9ca3af] hover:text-[#d5384b] transition-colors flex-shrink-0"
                      aria-label="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
