import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { usePotentialContacts } from '../hooks';
import { useContactAreas } from '../hooks';
import { Loader2, UserCheck, ChevronDown } from 'lucide-react';

export interface AddExistingEmployeeContactPayload {
  uid: number;
  name: string;
  selectedTids: number[];
  customArea?: string;
}

interface AddExistingEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: AddExistingEmployeeContactPayload) => void;
}

export const AddExistingEmployeeModal: React.FC<AddExistingEmployeeModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const { data: potentialContacts, loading: loadingPotential } = usePotentialContacts();
  const { data: areasData } = useContactAreas();
  const [selectedUid, setSelectedUid] = useState<string>('');
  const [selectedTids, setSelectedTids] = useState<number[]>([]);
  const [customArea, setCustomArea] = useState('');

  useEffect(() => {
    if (open) {
      setSelectedUid('');
      setSelectedTids([]);
      setCustomArea('');
    }
  }, [open]);

  const handleAreaToggle = (tid: number) => {
    setSelectedTids((prev) =>
      prev.includes(tid) ? prev.filter((t) => t !== tid) : [...prev, tid],
    );
  };

  const handleSubmit = () => {
    const uid = selectedUid ? Number(selectedUid) : 0;
    const item = potentialContacts.find((p) => p.uid === uid);
    if (!uid || !item) return;
    onConfirm({
      uid,
      name: item.name,
      selectedTids,
      customArea: customArea.trim() || undefined,
    });
    onOpenChange(false);
    setSelectedUid('');
    setSelectedTids([]);
    setCustomArea('');
  };

  const selectedItem = potentialContacts.find((p) => String(p.uid) === selectedUid);
  const canSubmit = selectedUid !== '' && selectedItem;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 rounded-[20px] overflow-hidden border border-[#e5efea] shadow-[0_20px_60px_rgba(14,51,38,0.15)]">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e5efea] bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[12px] bg-[#d4f4e6] flex items-center justify-center flex-shrink-0">
              <UserCheck className="h-5 w-5 text-[#1a5948]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#0d0e0e]">Add contact</DialogTitle>
              <p className="text-xs text-[#6b7280] mt-0.5">Select an employee to add as a contact</p>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 bg-white">
          {/* Employee select */}
          <div className="space-y-1.5">
            <Label htmlFor="add-contact-employee" className="text-sm font-semibold text-[#0d0e0e]">
              Employee
            </Label>
            <div className="relative">
              <Select
                id="add-contact-employee"
                value={selectedUid}
                onChange={(e) => setSelectedUid(e.target.value)}
                disabled={loadingPotential}
                className="w-full h-11 rounded-[10px] border border-[#e5e7eb] bg-white px-4 text-sm text-[#0d0e0e] appearance-none focus:outline-none focus:ring-2 focus:ring-[#3d997d]/30 focus:border-[#3d997d] pr-10 disabled:opacity-60"
              >
                <option value="">Select an employee…</option>
                {potentialContacts.map((item) => (
                  <option key={item.uid} value={item.uid}>
                    {item.name}
                  </option>
                ))}
              </Select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
            </div>
            {loadingPotential && (
              <p className="text-xs text-[#6b7280] flex items-center gap-1.5 mt-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading employees…
              </p>
            )}
            {!loadingPotential && potentialContacts.length === 0 && (
              <p className="text-xs text-[#6b7280] mt-1">No employees available to add as contacts.</p>
            )}
          </div>

          {/* Areas of responsibility */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#0d0e0e]">
              Areas of responsibility
              <span className="ml-1 text-xs font-normal text-[#9ca3af]">(optional)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {areasData.map((area) => {
                const checked = selectedTids.includes(area.tid);
                return (
                  <button
                    key={area.tid}
                    type="button"
                    onClick={() => handleAreaToggle(area.tid)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] border text-sm font-medium transition-all text-left ${checked
                      ? 'bg-[#d4f4e6] border-[#3d997d] text-[#1a5948]'
                      : 'bg-white border-[#e5e7eb] text-[#374151] hover:border-[#3d997d]/40 hover:bg-[#f6fbf9]'
                      }`}
                  >
                    <span
                      className={`h-4 w-4 rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked
                        ? 'bg-[#3d997d] border-[#3d997d]'
                        : 'border-[#d1d5db] bg-white'
                        }`}
                    >
                      {checked && (
                        <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {area.name}
                  </button>
                );
              })}
            </div>
            <div className="pt-2">
              <Label htmlFor="add-contact-other-area" className="text-xs text-[#9ca3af]">Other</Label>
              <input
                id="add-contact-other-area"
                type="text"
                placeholder="Type custom area…"
                value={customArea}
                onChange={(e) => setCustomArea(e.target.value)}
                className="mt-1 w-full h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-sm placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#3d997d]/30 focus:border-[#3d997d]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-[#e5efea] bg-[#f9fafb] flex justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-[10px] border-[#e5e7eb] text-[#374151] px-5 py-2 h-auto text-sm hover:bg-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-[10px] bg-[#3d997d] hover:bg-[#3d997d]/90 text-white px-6 py-2 h-auto text-sm shadow-[0_4px_12px_rgba(23,102,79,0.3)] disabled:opacity-50 disabled:shadow-none"
          >
            Add contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
