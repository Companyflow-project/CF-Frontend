import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useContactAreas, useDeleteContactArea } from '../hooks';
import { useEmployees } from '@/lib/api-hooks';
import { transformEmployee, type BackendEmployeeLike } from '@/lib/api-transformers';
import { UserCheck, ChevronDown, Loader2, Plus, X, Search, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export interface AddExistingEmployeeContactPayload {
  uid: number;
  name: string;
  phone?: string;
  email?: string;
  areaIds: number[];
  /** Names of brand-new areas created in this modal. */
  newAreas?: string[];
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
  const { data: areasData } = useContactAreas();
  const { data: rawEmployees, loading: loadingEmployees } = useEmployees({ limit: 1000 });
  const deleteAreaMutation = useDeleteContactArea();
  /** areaId of a persisted custom area pending delete confirmation */
  const [pendingDeleteAreaId, setPendingDeleteAreaId] = useState<number | null>(null);

  // Build full employee list from the employees API (all employees, not just potential)
  const allEmployees = useMemo(() => {
    const list = (rawEmployees as unknown as BackendEmployeeLike[] | null) ?? [];
    return list
      .map((raw) => {
        const emp = transformEmployee(raw);
        const uid = raw.uid ?? (raw.id != null ? Number(raw.id) : null);
        return uid != null ? { ...emp, uid } : null;
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rawEmployees]);

  // ── State ──
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [selectedAreaIds, setSelectedAreaIds] = useState<number[]>([]);
  const [customAreas, setCustomAreas] = useState<string[]>([]);
  const [checkedCustomAreaIndices, setCheckedCustomAreaIndices] = useState<number[]>([]);
  const [newCustomArea, setNewCustomArea] = useState('');
  const [isAddingCustomArea, setIsAddingCustomArea] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedUid(null);
      setDropdownOpen(false);
      setSearchQuery('');
      setPhone('');
      setPhoneTouched(false);
      setSelectedAreaIds([]);
      setCustomAreas([]);
      setCheckedCustomAreaIndices([]);
      setNewCustomArea('');
      setIsAddingCustomArea(false);
      setPendingDeleteAreaId(null);
    }
  }, [open]);

  // Auto-fill phone when an employee is selected
  useEffect(() => {
    if (selectedUid == null) { setPhone(''); setPhoneTouched(false); return; }
    const emp = allEmployees.find((e) => e.uid === selectedUid);
    const raw = emp?.mobileNumber ?? emp?.telephone ?? emp?.alternateNumber;
    setPhone(isPlaceholder(raw) ? '' : (raw ?? ''));
    setPhoneTouched(false);
  }, [selectedUid, allEmployees]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (dropdownOpen) setTimeout(() => searchRef.current?.focus(), 0);
  }, [dropdownOpen]);

  const selectedEmployee = selectedUid != null
    ? allEmployees.find((e) => e.uid === selectedUid)
    : undefined;

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allEmployees;
    return allEmployees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.email && e.email.toLowerCase().includes(q)),
    );
  }, [allEmployees, searchQuery]);

  const phoneEmpty = phone.trim() === '';
  const showPhoneError = phoneTouched && phoneEmpty;

  const handleAreaToggle = (areaId: number) => {
    setSelectedAreaIds((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId],
    );
  };

  const handleConfirmCustomArea = () => {
    const trimmed = newCustomArea.trim();
    if (trimmed && !customAreas.includes(trimmed)) {
      // Use current length as the new index BEFORE updating customAreas
      const nextIndex = customAreas.length;
      setCustomAreas((prev) => [...prev, trimmed]);
      setCheckedCustomAreaIndices((prev) => [...prev, nextIndex]);
    }
    setNewCustomArea('');
    setIsAddingCustomArea(false);
  };

  const handleRemoveCustomArea = (index: number) => {
    setCustomAreas((prev) => prev.filter((_, i) => i !== index));
    setCheckedCustomAreaIndices((prev) =>
      prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)),
    );
  };

  const handleToggleCustomArea = (index: number) => {
    setCheckedCustomAreaIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  /** Called when the user confirms deleting a persisted custom area. */
  const handleConfirmDeletePersistedArea = async () => {
    if (pendingDeleteAreaId === null) return;
    const areaId = pendingDeleteAreaId;
    setPendingDeleteAreaId(null);
    try {
      await deleteAreaMutation.mutateAsync(areaId);
      setSelectedAreaIds((prev) => prev.filter((id) => id !== areaId));
      toast.success('Area deleted');
    } catch (err: unknown) {
      const status =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      const serverMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      if (status === 403) {
        toast.error(
          serverMsg?.toLowerCase().includes('default')
            ? 'Built-in areas cannot be removed. Only custom areas you created can be deleted.'
            : "You don't have permission to delete this area.",
        );
      } else {
        toast.error(serverMsg ?? 'Failed to delete area');
      }
    }
  };

  const handleSubmit = () => {
    if (!selectedEmployee) return;
    if (phoneEmpty) { setPhoneTouched(true); return; }
    const newAreas = customAreas
      .filter((_, i) => checkedCustomAreaIndices.includes(i))
      .map((a) => a.trim())
      .filter((a) => a !== '');
    onConfirm({
      uid: selectedEmployee.uid,
      name: selectedEmployee.name,
      phone: phone.trim() || undefined,
      email: selectedEmployee.email || undefined,
      areaIds: selectedAreaIds,
      newAreas,
    });
    onOpenChange(false);
  };

  // ── Initials avatar helper ──
  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[680px] p-0 flex flex-col gap-0 rounded-[20px] overflow-hidden border border-[#e5efea] shadow-[0_20px_60px_rgba(14,51,38,0.15)] max-h-[90vh]">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e5efea] bg-white flex-shrink-0">
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

            {/* ── Custom employee dropdown ── */}
            <div>
              <label className="text-xs font-medium text-[#0d0e0e] mb-1.5 block">
                Employee <span className="text-[#d5384b]">*</span>
              </label>
              <div className="relative" ref={dropdownRef}>
                {/* Trigger */}
                <button
                  type="button"
                  onClick={() => { setDropdownOpen((v) => !v); }}
                  disabled={loadingEmployees}
                  className={[
                    'w-full h-11 rounded-[10px] border bg-white px-4 pr-10 text-sm text-left flex items-center gap-3 transition-colors',
                    dropdownOpen
                      ? 'border-[#3d997d] ring-2 ring-[#3d997d]/20'
                      : 'border-[#e5e7eb] hover:border-[#3d997d]/40',
                    loadingEmployees ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                  ].join(' ')}
                >
                  {selectedEmployee ? (
                    <>
                      <span className="h-6 w-6 rounded-full bg-[#d4f4e6] text-[#1a5948] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {initials(selectedEmployee.name)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="font-medium text-[#0d0e0e] truncate block">{selectedEmployee.name}</span>
                      </span>
                      <span className="text-xs text-[#9ca3af] truncate hidden sm:block">{selectedEmployee.email}</span>
                    </>
                  ) : (
                    <span className="text-[#9ca3af]">
                      {loadingEmployees ? 'Loading employees…' : 'Select an employee…'}
                    </span>
                  )}
                  {loadingEmployees
                    ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af] animate-spin" />
                    : <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  }
                </button>

                {/* Dropdown panel */}
                {dropdownOpen && (
                  <div className="absolute z-50 mt-1.5 w-full bg-white rounded-[12px] border border-[#e5e7eb] shadow-[0_8px_24px_rgba(14,51,38,0.12)] overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-[#f3f4f6]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca3af]" />
                        <input
                          ref={searchRef}
                          type="text"
                          placeholder="Search by name or email…"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full h-9 pl-8 pr-3 text-sm bg-[#f9fafb] rounded-[8px] border border-[#f3f4f6] focus:outline-none focus:ring-2 focus:ring-[#3d997d]/20 focus:border-[#3d997d] placeholder:text-[#9ca3af]"
                        />
                      </div>
                    </div>

                    {/* Employee list */}
                    <ul className="max-h-[220px] overflow-y-auto py-1">
                      {filteredEmployees.length === 0 ? (
                        <li className="px-4 py-3 text-sm text-[#9ca3af] text-center">No employees found</li>
                      ) : (
                        filteredEmployees.map((emp) => {
                          const isSelected = emp.uid === selectedUid;
                          return (
                            <li key={emp.uid}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUid(emp.uid);
                                  setDropdownOpen(false);
                                  setSearchQuery('');
                                }}
                                className={[
                                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                                  isSelected
                                    ? 'bg-[#f0f9f5] text-[#1a5948]'
                                    : 'hover:bg-[#f9fafb] text-[#0d0e0e]',
                                ].join(' ')}
                              >
                                <span className={`h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-[#3d997d] text-white' : 'bg-[#e8f5ef] text-[#1a5948]'}`}>
                                  {initials(emp.name)}
                                </span>
                                <span className="flex-1 min-w-0">
                                  <span className="text-sm font-medium block truncate">{emp.name}</span>
                                  {emp.email && (
                                    <span className="text-xs text-[#6b7280] block truncate">{emp.email}</span>
                                  )}
                                </span>
                                {isSelected && <Check className="h-4 w-4 text-[#3d997d] flex-shrink-0" />}
                              </button>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* ── Pre-filled fields — shown once an employee is selected ── */}
            {selectedEmployee && (
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                {/* Name — read-only */}
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">Name</label>
                  <Input
                    readOnly tabIndex={-1}
                    value={selectedEmployee.name}
                    className="h-10 rounded-[10px] border-[#e5e7eb] bg-[#f3f4f6] text-[#6b7280] cursor-not-allowed text-sm select-none"
                  />
                </div>

                {/* Email — read-only */}
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">Email</label>
                  <Input
                    readOnly tabIndex={-1}
                    value={selectedEmployee.email ?? ''}
                    className="h-10 rounded-[10px] border-[#e5e7eb] bg-[#f3f4f6] text-[#6b7280] cursor-not-allowed text-sm select-none"
                  />
                </div>

                {/* Telephone */}
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-[#0d0e0e] mb-1 block">
                    Telephone{phoneEmpty && <span className="ml-1 text-[#d5384b]">*</span>}
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

            {/* ── Areas of responsibility ── */}
            <div className="space-y-2 pt-1 border-t border-[#f0f4f2]">
              <div className="flex items-center justify-between pt-3">
                <label className="text-sm font-semibold text-[#0d0e0e]">
                  Areas of responsibility <span className="text-[#d5384b]">*</span>
                </label>
                {!isAddingCustomArea && (
                  <Button
                    type="button" variant="ghost" size="sm"
                    onClick={() => setIsAddingCustomArea(true)}
                    className="h-8 gap-1.5 text-xs text-[#1a5948] hover:bg-[#f0f7f5] rounded-[8px] px-3"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create new
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {/* Persisted areas */}
                {areasData.map((area) => {
                  const checked = selectedAreaIds.includes(area.id);
                  const isCustom = !area.isDefault && !!area.companyId;
                  return (
                    <div key={area.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => handleAreaToggle(area.id)}
                        className={[
                          'flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] border text-sm font-medium transition-all text-left w-full',
                          checked
                            ? 'bg-[#d4f4e6] border-[#3d997d] text-[#1a5948]'
                            : 'bg-white border-[#e5e7eb] text-[#374151] hover:border-[#3d997d]/40 hover:bg-[#f6fbf9]',
                          isCustom ? 'pr-8' : '',
                        ].join(' ')}
                      >
                        <span className={['h-4 w-4 rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 transition-colors', checked ? 'bg-[#3d997d] border-[#3d997d]' : 'border-[#d1d5db] bg-white'].join(' ')}>
                          {checked && (
                            <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        {area.name}
                      </button>
                      {/* Delete button — always visible on custom (non-default) areas */}
                      {isCustom && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPendingDeleteAreaId(area.id); }}
                          title="Delete this custom area"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center text-[#9ca3af] hover:text-[#d5384b] hover:bg-[#ffecef] transition-all"
                          aria-label={`Delete ${area.name}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Session-only custom areas — toggleable, with always-visible delete */}
                {customAreas.map((area, index) => {
                  const isChecked = checkedCustomAreaIndices.includes(index);
                  return (
                    <div key={`custom-${index}`} className="relative">
                      <button
                        type="button"
                        onClick={() => handleToggleCustomArea(index)}
                        className={[
                          'flex items-center gap-2.5 px-3 py-2.5 pr-8 rounded-[10px] border text-sm font-medium transition-all text-left w-full',
                          isChecked
                            ? 'bg-[#d4f4e6] border-[#3d997d] text-[#1a5948]'
                            : 'bg-white border-[#e5e7eb] text-[#374151] hover:border-[#3d997d]/40 hover:bg-[#f6fbf9]',
                        ].join(' ')}
                      >
                        <span className={['h-4 w-4 rounded-[4px] border-2 flex items-center justify-center flex-shrink-0', isChecked ? 'bg-[#3d997d] border-[#3d997d]' : 'border-[#d1d5db] bg-white'].join(' ')}>
                          {isChecked && (
                            <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className="truncate">{area}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomArea(index)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center text-[#9ca3af] hover:text-[#d5384b] hover:bg-[#ffecef] transition-all"
                        aria-label={`Remove ${area}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Custom area input */}
              {isAddingCustomArea && (
                <div className="flex items-center gap-2 pt-2">
                  <Input
                    autoFocus
                    placeholder="New area of responsibility…"
                    value={newCustomArea}
                    onChange={(e) => setNewCustomArea(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleConfirmCustomArea(); } }}
                    className="h-10 rounded-[10px] border-[#3d997d]/50 text-sm placeholder:text-[#9ca3af] focus:ring-2 focus:ring-[#3d997d]/30 focus:border-[#3d997d]"
                  />
                  <Button type="button" onClick={handleConfirmCustomArea} className="h-10 px-4 rounded-[10px] bg-[#3d997d] text-white hover:bg-[#3d997d]/90">
                    Add
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingCustomArea(false); setNewCustomArea(''); }}
                    className="h-10 w-10 flex items-center justify-center rounded-[10px] hover:bg-[#ffecef] text-[#9ca3af] hover:text-[#d5384b] transition-colors flex-shrink-0"
                    aria-label="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#e5efea] bg-[#f9fafb] flex justify-end gap-2 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 px-5 rounded-[10px] border-[#e5e7eb] text-[#374151] text-sm hover:bg-[#f9fafb]"
            >
              Cancel
            </Button>
            {selectedEmployee && (
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

      {/* ── Delete area confirmation dialog ── */}
      {pendingDeleteAreaId !== null && (() => {
        const pendingArea = areasData.find((a) => a.id === pendingDeleteAreaId);
        return (
          <Dialog
            open
            onOpenChange={(open) => { if (!open) setPendingDeleteAreaId(null); }}
          >
            <DialogContent className="sm:max-w-[380px] rounded-[16px] border border-[#fce8ea] p-0 overflow-hidden">
              <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#fce8ea] bg-white">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-[10px] bg-[#ffecef] flex items-center justify-center flex-shrink-0">
                    <Trash2 className="h-4 w-4 text-[#d5384b]" />
                  </div>
                  <DialogTitle className="text-base font-bold text-[#0d0e0e]">
                    Delete custom area?
                  </DialogTitle>
                </div>
              </DialogHeader>
              <div className="px-5 py-4 bg-white space-y-3">
                <p className="text-sm text-[#374151]">
                  <span className="font-semibold">&ldquo;{pendingArea?.name}&rdquo;</span> will be
                  permanently removed and will no longer be available to assign to any contact.
                </p>
                <p className="text-xs text-[#6b7280] bg-[#f9fafb] rounded-[8px] px-3 py-2 border border-[#e5e7eb]">
                  Only custom areas you created can be deleted. Built-in default areas cannot be removed.
                </p>
              </div>
              <div className="px-5 py-3 border-t border-[#f3f4f6] bg-[#f9fafb] flex justify-end gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => setPendingDeleteAreaId(null)}
                  className="rounded-[8px] border-[#e5e7eb] text-[#374151] text-sm"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={deleteAreaMutation.isPending}
                  onClick={handleConfirmDeletePersistedArea}
                  className="rounded-[8px] bg-[#d5384b] hover:bg-[#d5384b]/90 text-white text-sm"
                >
                  {deleteAreaMutation.isPending ? 'Deleting…' : 'Delete area'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </>
  );
};
