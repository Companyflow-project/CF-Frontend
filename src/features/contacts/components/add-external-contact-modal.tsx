import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useContactAreas } from '../hooks';
import { UserPlus, Plus, X } from 'lucide-react';

export interface AddExternalContactPayload {
  name: string;
  /** Required for external contacts. */
  email: string;
  /** Required for external contacts. */
  phone: string;
  areaIds: number[];
  /** Names of brand-new areas created in this modal. */
  newAreas?: string[];
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [selectedAreaIds, setSelectedAreaIds] = useState<number[]>([]);
  const [customAreas, setCustomAreas] = useState<string[]>([]);
  const [newCustomArea, setNewCustomArea] = useState('');
  const [isAddingCustomArea, setIsAddingCustomArea] = useState(false);

  const reset = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPhoneTouched(false);
    setNameTouched(false);
    setEmailTouched(false);
    setSelectedAreaIds([]);
    setCustomAreas([]);
    setNewCustomArea('');
    setIsAddingCustomArea(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const nameEmpty = name.trim() === '';
  const emailEmpty = email.trim() === '';
  const phoneEmpty = phone.trim() === '';
  const showNameError = nameTouched && nameEmpty;
  const showEmailError = emailTouched && emailEmpty;
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
    if (nameEmpty) { setNameTouched(true); return; }
    if (emailEmpty) { setEmailTouched(true); return; }
    if (phoneEmpty) { setPhoneTouched(true); return; }
    const newAreas = customAreas.map((a) => a.trim()).filter(Boolean);
    onConfirm({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      areaIds: selectedAreaIds,
      newAreas,
    });
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[680px] p-0 flex flex-col gap-0 rounded-[20px] overflow-hidden border border-[#e5efea] shadow-[0_20px_60px_rgba(14,51,38,0.15)] max-h-[90vh]">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e5efea] bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[12px] bg-[#dbeafe] flex items-center justify-center flex-shrink-0">
              <UserPlus className="h-5 w-5 text-[#1e40af]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#0d0e0e]">Add external contact</DialogTitle>
              <p className="text-xs text-[#6b7280] mt-0.5">Add someone outside your organisation</p>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-8 py-6 bg-white space-y-6 overflow-y-auto flex-1">
          {/* Inline fields row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Name — editable, required */}
            <div className="min-w-0">
              <label className="text-xs font-medium text-[#0d0e0e] mb-1.5 block">
                Name
                {nameEmpty && <span className="ml-1 text-[#d5384b]">*</span>}
              </label>
              <Input
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setNameTouched(true)}
                className={`h-11 rounded-[10px] text-sm transition-colors ${nameEmpty
                  ? 'border-[#d5384b] focus:ring-[#d5384b]/30 focus:border-[#d5384b]'
                  : 'border-[#e5e7eb] focus:ring-[#3d997d]/30 focus:border-[#3d997d]'
                  }`}
              />
              {showNameError && (
                <p className="text-xs text-[#d5384b] mt-1">Name is required</p>
              )}
            </div>

            {/* Email — required */}
            <div className="min-w-0">
              <label className="text-xs font-medium text-[#0d0e0e] mb-1.5 block">
                Email
                {emailEmpty && <span className="ml-1 text-[#d5384b]">*</span>}
              </label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                className={`h-11 rounded-[10px] text-sm transition-colors ${emailEmpty
                  ? 'border-[#d5384b] focus:ring-[#d5384b]/30 focus:border-[#d5384b]'
                  : 'border-[#e5e7eb] focus:ring-[#3d997d]/30 focus:border-[#3d997d]'
                  }`}
              />
              {showEmailError && (
                <p className="text-xs text-[#d5384b] mt-1">Email is required</p>
              )}
            </div>

            {/* Telephone — required */}
            <div className="min-w-0">
              <label className="text-xs font-medium text-[#0d0e0e] mb-1.5 block">
                Telephone
                {phoneEmpty && <span className="ml-1 text-[#d5384b]">*</span>}
              </label>
              <Input
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => setPhoneTouched(true)}
                className={`h-11 rounded-[10px] text-sm transition-colors ${phoneEmpty
                  ? 'border-[#d5384b] focus:ring-[#d5384b]/30 focus:border-[#d5384b]'
                  : 'border-[#e5e7eb] focus:ring-[#3d997d]/30 focus:border-[#3d997d]'
                  }`}
              />
              {showPhoneError && (
                <p className="text-xs text-[#d5384b] mt-1">Phone number is required</p>
              )}
            </div>

          </div>
        </div>

        {/* Areas of responsibility */}
        <div className="px-8 pb-6 pt-2 border-t border-[#f0f4f2] bg-white">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-[#0d0e0e]">
              Areas of responsibility
              <span className="ml-1 text-xs font-normal text-[#9ca3af]">(optional)</span>
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
              const checked = selectedAreaIds.includes(area.id);
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => handleAreaToggle(area.id)}
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

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#e5efea] bg-[#f9fafb] flex justify-end gap-2 z-50">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="h-10 px-5 rounded-[10px] border-[#e5e7eb] text-[#374151] text-sm hover:bg-[#f9fafb]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="h-10 px-5 rounded-[10px] bg-[#2f946f] hover:bg-[#2f946f]/90 text-white text-sm shadow-[0_4px_12px_rgba(13,94,67,0.3)]"
          >
            Save Contact
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
