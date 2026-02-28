import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePotentialContacts, useContactAreas } from '../hooks';
import { useEmployees } from '@/lib/api-hooks';
import { transformEmployee, type BackendEmployeeLike } from '@/lib/api-transformers';
import { UserCheck, ChevronDown, Loader2, Plus, X } from 'lucide-react';

export interface AddExistingEmployeeContactPayload {
  uid: number;
  name: string;
  phone?: string;
  selectedTids: number[];
  customAreas: string[];
}

interface AddExistingEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: AddExistingEmployeeContactPayload) => void;
}

/** Values that mean "no real phone number" — treated as empty */
const isPlaceholder = (v?: string | null) =>
  !v || ['n/a', 'not available', '-', 'none', ''].includes(v.trim().toLowerCase());

export const AddExistingEmployeeModal: React.FC<AddExistingEmployeeModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const { data: potentialContacts, loading: loadingPotential } = usePotentialContacts();
  const { data: areasData } = useContactAreas();
  const { data: rawEmployees } = useEmployees({ limit: 1000 });

  // Build a uid → Employee map for email/phone lookup
  const employeeByUid = useMemo(() => {
    const map = new Map<number, ReturnType<typeof transformEmployee>>();
    const list = (rawEmployees as unknown as BackendEmployeeLike[] | null) ?? [];
    list.forEach((raw) => {
      const emp = transformEmployee(raw);
      const uid = raw.uid ?? (raw.id != null ? Number(raw.id) : null);
      if (uid != null) map.set(uid, emp);
    });
    return map;
  }, [rawEmployees]);

  const [selectedUid, setSelectedUid] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [selectedTids, setSelectedTids] = useState<number[]>([]);
  const [customAreas, setCustomAreas] = useState<string[]>([]);
  const [newCustomArea, setNewCustomArea] = useState('');
  const [isAddingCustomArea, setIsAddingCustomArea] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedUid('');
      setPhone('');
      setPhoneTouched(false);
      setSelectedTids([]);
      setCustomAreas([]);
      setNewCustomArea('');
      setIsAddingCustomArea(false);
    }
  }, [open]);

  // Auto-fill phone when an employee is selected
  useEffect(() => {
    if (!selectedUid) {
      setPhone('');
      setPhoneTouched(false);
      return;
    }
    const uid = Number(selectedUid);
    const emp = employeeByUid.get(uid);
    const raw = emp?.mobileNumber ?? emp?.telephone ?? emp?.alternateNumber;
    setPhone(isPlaceholder(raw) ? '' : (raw ?? ''));
    setPhoneTouched(false);
  }, [selectedUid, employeeByUid]);

  const selectedPotential = potentialContacts.find((p) => String(p.uid) === selectedUid);
  const selectedEmployee = selectedUid ? employeeByUid.get(Number(selectedUid)) : undefined;

  const phoneEmpty = phone.trim() === '';
  const showPhoneError = phoneTouched && phoneEmpty;

  const handleAreaToggle = (tid: number) => {
    setSelectedTids((prev) =>
      prev.includes(tid) ? prev.filter((t) => t !== tid) : [...prev, tid],
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
    if (!selectedPotential) return;
    if (phoneEmpty) {
      setPhoneTouched(true);
      return;
    }
    onConfirm({
      uid: selectedPotential.uid,
      name: selectedPotential.name,
      phone: phone.trim() || undefined,
      selectedTids,
      customAreas: customAreas.filter((a) => a.trim() !== ''),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] p-0 flex flex-col gap-0 rounded-[20px] overflow-hidden border border-[#e5efea] shadow-[0_20px_60px_rgba(14,51,38,0.15)] max-h-[90vh]">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e5efea] bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[12px] bg-[#d4f4e6] flex items-center justify-center flex-shrink-0">
              <UserCheck className="h-5 w-5 text-[#1a5948]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#0d0e0e]">Add existing employee</DialogTitle>
              <p className="text-xs text-[#6b7280] mt-0.5">Select an employee and confirm their details</p>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 bg-white space-y-5 overflow-y-auto flex-1">
          {/* Employee dropdown */}
          <div>
            <label className="text-xs font-medium text-[#0d0e0e] mb-1 block">
              Employee
              <span className="ml-1 text-[#d5384b]">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedUid}
                onChange={(e) => setSelectedUid(e.target.value)}
                disabled={loadingPotential}
                className="w-full h-11 rounded-[10px] border border-[#e5e7eb] bg-white px-4 pr-10 text-sm text-[#0d0e0e] appearance-none focus:outline-none focus:ring-2 focus:ring-[#3d997d]/30 focus:border-[#3d997d] disabled:opacity-60"
              >
                <option value="">
                  {loadingPotential ? 'Loading employees…' : 'Select an employee…'}
                </option>
                {potentialContacts.map((item) => (
                  <option key={item.uid} value={item.uid}>
                    {item.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
              {loadingPotential && (
                <Loader2 className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af] animate-spin" />
              )}
            </div>
            {!loadingPotential && potentialContacts.length === 0 && (
              <p className="text-xs text-[#6b7280] mt-1">
                All employees are already contacts.
              </p>
            )}
          </div>

          {/* Auto-filled fields — shown once an employee is selected */}
          {selectedPotential && (
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
              {/* Name — muted */}
              <div className="flex-1 min-w-0">
                <label className="text-xs font-medium text-[#6b7280] mb-1 block">Name</label>
                <Input
                  readOnly
                  tabIndex={-1}
                  value={selectedPotential.name}
                  className="h-10 rounded-[10px] border-[#e5e7eb] bg-[#f3f4f6] text-[#6b7280] cursor-not-allowed text-sm select-none"
                />
              </div>

              {/* Email — muted */}
              <div className="flex-1 min-w-0">
                <label className="text-xs font-medium text-[#6b7280] mb-1 block">Email</label>
                <Input
                  readOnly
                  tabIndex={-1}
                  value={selectedEmployee?.email ?? ''}
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
          )}

          {/* Areas of responsibility */}
          <div className="space-y-2 pt-1 border-t border-[#f0f4f2]">
            <div className="flex items-center justify-between pt-3">
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

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {areasData.map((area) => {
                const checked = selectedTids.includes(area.tid);
                return (
                  <button
                    key={area.tid}
                    type="button"
                    onClick={() => handleAreaToggle(area.tid)}
                    className={[
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] border text-sm font-medium transition-all text-left',
                      checked
                        ? 'bg-[#d4f4e6] border-[#3d997d] text-[#1a5948]'
                        : 'bg-white border-[#e5e7eb] text-[#374151] hover:border-[#3d997d]/40 hover:bg-[#f6fbf9]',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'h-4 w-4 rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                        checked ? 'bg-[#3d997d] border-[#3d997d]' : 'border-[#d1d5db] bg-white',
                      ].join(' ')}
                    >
                      {checked && (
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
              {customAreas.map((area, index) => (
                <button
                  key={`custom-${index}`}
                  type="button"
                  onClick={() => handleRemoveCustomArea(index)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] border text-sm font-medium transition-all text-left bg-[#d4f4e6] border-[#3d997d] text-[#1a5948]"
                >
                  <span className="h-4 w-4 rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 transition-colors bg-[#3d997d] border-[#3d997d]">
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
                  {area}
                </button>
              ))}
            </div>

            {/* Custom area input */}
            {isAddingCustomArea && (
              <div className="flex items-center gap-2 pt-2">
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

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#e5efea] bg-[#f9fafb] flex justify-end gap-2 z-50">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 px-5 rounded-[10px] border-[#e5e7eb] text-[#374151] text-sm hover:bg-[#f9fafb]"
          >
            Cancel
          </Button>
          {selectedPotential && (
            <Button
              onClick={handleSubmit}
              className="h-10 px-5 rounded-[10px] bg-[#3d997d] hover:bg-[#3d997d]/90 text-white text-sm shadow-[0_4px_12px_rgba(23,102,79,0.3)]"
            >
              Add
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
