import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useContactAreas } from '../hooks';
import { UserPlus, Mail, Phone, User } from 'lucide-react';

export interface AddExternalContactPayload {
  name: string;
  email?: string;
  phone?: string;
  selectedTids: number[];
  customArea?: string;
}

interface AddExternalContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: AddExternalContactPayload) => void;
}


export const AddExternalContactModal: React.FC<AddExternalContactModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const { data: areasData } = useContactAreas();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telephone: '',
    selectedTids: [] as number[],
    customArea: '',
  });

  const handleAreaToggle = (tid: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedTids: prev.selectedTids.includes(tid)
        ? prev.selectedTids.filter((t) => t !== tid)
        : [...prev.selectedTids, tid],
    }));
  };

  const handleSubmit = () => {
    onConfirm({
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.telephone.trim() || undefined,
      selectedTids: formData.selectedTids,
      customArea: formData.customArea.trim() || undefined,
    });
    onOpenChange(false);
    setFormData({ name: '', email: '', telephone: '', selectedTids: [], customArea: '' });
  };

  const canSubmit = formData.name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 rounded-[20px] overflow-hidden border border-[#e5efea] shadow-[0_20px_60px_rgba(14,51,38,0.15)]">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e5efea] bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[12px] bg-[#dbeafe] flex items-center justify-center flex-shrink-0">
              <UserPlus className="h-5 w-5 text-[#1e40af]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#0d0e0e]">Add External Contact</DialogTitle>
              <p className="text-xs text-[#6b7280] mt-0.5">Add someone outside your organisation</p>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 bg-white max-h-[60vh] overflow-y-auto">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="ext-name" className="text-sm font-semibold text-[#0d0e0e] flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[#9ca3af]" /> Name
            </Label>
            <Input
              id="ext-name"
              placeholder="Full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-11 rounded-[10px] border-[#e5e7eb] text-sm placeholder:text-[#9ca3af] focus:ring-2 focus:ring-[#3d997d]/30 focus:border-[#3d997d]"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="ext-email" className="text-sm font-semibold text-[#0d0e0e] flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[#9ca3af]" /> Email
              <span className="text-xs font-normal text-[#9ca3af]">(optional)</span>
            </Label>
            <Input
              id="ext-email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-11 rounded-[10px] border-[#e5e7eb] text-sm placeholder:text-[#9ca3af] focus:ring-2 focus:ring-[#3d997d]/30 focus:border-[#3d997d]"
            />
          </div>

          {/* Telephone */}
          <div className="space-y-1.5">
            <Label htmlFor="ext-telephone" className="text-sm font-semibold text-[#0d0e0e] flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-[#9ca3af]" /> Telephone
              <span className="text-xs font-normal text-[#9ca3af]">(optional)</span>
            </Label>
            <Input
              id="ext-telephone"
              placeholder="+1 000 000 0000"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              className="h-11 rounded-[10px] border-[#e5e7eb] text-sm placeholder:text-[#9ca3af] focus:ring-2 focus:ring-[#3d997d]/30 focus:border-[#3d997d]"
            />
          </div>

          {/* Areas of responsibility */}
          <div className="space-y-2 pt-1">
            <Label className="text-sm font-semibold text-[#0d0e0e]">
              Areas of responsibility
              <span className="ml-1 text-xs font-normal text-[#9ca3af]">(optional)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {areasData.map((area) => {
                const checked = formData.selectedTids.includes(area.tid);
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
              <Label htmlFor="ext-other-area" className="text-xs text-[#9ca3af]">Other</Label>
              <Input
                id="ext-other-area"
                type="text"
                placeholder="Type custom area…"
                value={formData.customArea}
                onChange={(e) => setFormData({ ...formData, customArea: e.target.value })}
                className="mt-1 h-10 rounded-[10px] border-[#e5e7eb] text-sm placeholder:text-[#9ca3af] focus:ring-2 focus:ring-[#3d997d]/30 focus:border-[#3d997d]"
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
            Add Contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
