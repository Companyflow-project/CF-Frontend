import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useContactAreas, useDeleteContactArea } from '../hooks';
import { UserCheck, Plus, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const deleteAreaMutation = useDeleteContactArea();

  const [phone, setPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [selectedAreaIds, setSelectedAreaIds] = useState<number[]>([]);
  const [customAreas, setCustomAreas] = useState<string[]>([]);
  /** Tracks which session-only new areas are currently checked (by index). Starts as all checked. */
  const [checkedCustomAreaIndices, setCheckedCustomAreaIndices] = useState<number[]>([]);
  const [newCustomArea, setNewCustomArea] = useState('');
  const [isAddingCustomArea, setIsAddingCustomArea] = useState(false);
  /** areaId of a persisted custom area pending delete confirmation */
  const [pendingDeleteAreaId, setPendingDeleteAreaId] = useState<number | null>(null);

  useEffect(() => {
    if (open && employee) {
      setPhone(isPlaceholder(employee.telephone) ? '' : (employee.telephone ?? ''));
      setPhoneTouched(false);
      setSelectedAreaIds(existingAreaIds ?? []);
      setCustomAreas([]);
      setCheckedCustomAreaIndices([]);
      setNewCustomArea('');
      setIsAddingCustomArea(false);
      setPendingDeleteAreaId(null);
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
      setCustomAreas((prev) => {
        const newIndex = prev.length;
        // Auto-check the new area
        setCheckedCustomAreaIndices((ci) => [...ci, newIndex]);
        return [...prev, trimmed];
      });
    }
    setNewCustomArea('');
    setIsAddingCustomArea(false);
  };
  const handleRemoveCustomArea = (index: number) => {
    setCustomAreas((prev) => prev.filter((_, i) => i !== index));
    // Re-index the checked indices after removal
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
      // Also deselect it if currently chosen
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
          serverMsg?.includes('Default') || serverMsg?.includes('default')
            ? 'Built-in areas cannot be removed. Only custom areas you created can be deleted.'
            : 'You don\'t have permission to delete this area.',
        );
      } else {
        toast.error(serverMsg ?? 'Failed to delete area');
      }
    }
  };

  const handleSubmit = () => {
    if (!employee) return;
    if (phoneEmpty) {
      setPhoneTouched(true);
      return;
    }
    // Only submit session-only areas that are still checked
    const newAreas = customAreas
      .filter((_, i) => checkedCustomAreaIndices.includes(i))
      .map((a) => a.trim())
      .filter((a) => a !== '');
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

  const pendingDeleteArea =
    pendingDeleteAreaId !== null
      ? areasData.find((a) => a.id === pendingDeleteAreaId)
      : null;

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

            {/* 3-column flat checkbox grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
              {areasData.map((area) => {
                const isChecked = selectedAreaIds.includes(area.id);
                // A persisted custom area: not a default and belongs to a company
                const isCustom = !area.isDefault && !!area.companyId;
                return (
                  <div key={area.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => handleAreaToggle(area.id)}
                      className={[
                        'flex items-center gap-2 rounded-[10px] border text-left transition-all w-full px-3 py-2 text-sm font-medium',
                        isChecked
                          ? 'bg-[#d4f4e6] border-[#3d997d] text-[#1a5948]'
                          : 'bg-white border-[#e5e7eb] text-[#374151] hover:border-[#3d997d]/40 hover:bg-[#f6fbf9]',
                        // leave room for the delete button on custom areas
                        isCustom ? 'pr-7' : '',
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
                      <span className="truncate">{area.name}</span>
                    </button>

                    {/* Delete button — only for persisted custom areas, always visible */}
                    {isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDeleteAreaId(area.id);
                        }}
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

              {/* Session-only (unsaved) areas typed in this modal */}
              {customAreas.map((area, index) => {
                const isCustomChecked = checkedCustomAreaIndices.includes(index);
                return (
                  <div key={`custom-${index}`} className="relative">
                    <button
                      type="button"
                      onClick={() => handleToggleCustomArea(index)}
                      className={[
                        'flex items-center gap-2 rounded-[10px] border text-left transition-all w-full px-3 py-2 pr-7 text-sm font-medium',
                        isCustomChecked
                          ? 'bg-[#d4f4e6] border-[#3d997d] text-[#1a5948]'
                          : 'bg-white border-[#e5e7eb] text-[#374151] hover:border-[#3d997d]/40 hover:bg-[#f6fbf9]',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'h-4 w-4 rounded-[4px] border-2 flex items-center justify-center flex-shrink-0',
                          isCustomChecked ? 'bg-[#3d997d] border-[#3d997d]' : 'border-[#d1d5db] bg-white',
                        ].join(' ')}
                      >
                        {isCustomChecked && (
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
                      <span className="truncate">{area}</span>
                    </button>
                    {/* Delete button — always visible for session-only areas */}
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomArea(index)}
                      title="Remove this area"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center text-[#9ca3af] hover:text-[#d5384b] hover:bg-[#ffecef] transition-all"
                      aria-label={`Remove ${area}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
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

      {/* ── Delete area confirmation dialog ── */}
      <Dialog
        open={pendingDeleteAreaId !== null}
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
              <span className="font-semibold">&ldquo;{pendingDeleteArea?.name}&rdquo;</span> will be
              permanently removed and will no longer be available to assign to any contact.
            </p>
            <p className="text-xs text-[#6b7280] bg-[#f9fafb] rounded-[8px] px-3 py-2 border border-[#e5e7eb]">
              Only custom areas you created can be deleted. Built-in default areas cannot be removed.
            </p>
          </div>
          <div className="px-5 py-3 border-t border-[#f3f4f6] bg-[#f9fafb] flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
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
    </Dialog>
  );
};
