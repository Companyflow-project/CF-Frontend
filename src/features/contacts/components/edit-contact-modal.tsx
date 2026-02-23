import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { contactsApi } from '../api';
import { contactsQueries } from '../queries';
import { useContactAreas } from '../hooks';
import { Loader2, Pencil } from 'lucide-react';

interface EditContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string | null;
  onSaved: () => void;
}

export const EditContactModal: React.FC<EditContactModalProps> = ({
  open,
  onOpenChange,
  contactId,
  onSaved,
}) => {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [selectedTids, setSelectedTids] = useState<number[]>([]);

  const { data: contactData, isLoading: loading, error: fetchError } = useQuery({
    queryKey: contactsQueries.detail(contactId ?? ''),
    queryFn: () => contactsApi.getContact(contactId!),
    enabled: open && !!contactId,
    staleTime: 30_000,
  });

  const { data: areas } = useContactAreas();

  // Reset form when modal closes or contactId changes
  useEffect(() => {
    if (!open) {
      setName('');
      setPhone('');
      setEmail('');
      setRole('');
      setSelectedTids([]);
      setSaveError(null);
    }
  }, [open, contactId]);

  // Populate form fields when contact data arrives
  useEffect(() => {
    if (!contactData) return;
    const { contact: c, selectedTids: tids } = contactData;
    setName(c.name ?? '');
    setPhone(c.telephone ?? '');
    setEmail(c.email ?? '');
    setRole(c.functionTitle ?? '');
    setSelectedTids(Array.isArray(tids) ? tids : []);
  }, [contactData]);

  const handleAreaToggle = useCallback((tid: number) => {
    setSelectedTids((prev) =>
      prev.includes(tid) ? prev.filter((t) => t !== tid) : [...prev, tid],
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!contactId) return;
    setSaving(true);
    setSaveError(null);
    try {
      await contactsApi.updateContact(contactId, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        role: role.trim() || undefined,
        selectedTids: selectedTids.length ? selectedTids : undefined,
      });
      onSaved();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status === 403
            ? 'You can only edit contacts in your company.'
            : (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : 'Failed to update contact';
      setSaveError(msg ?? 'Failed to update contact');
    } finally {
      setSaving(false);
    }
  }, [contactId, name, phone, email, role, selectedTids, onSaved, onOpenChange]);

  const contact = contactData?.contact ?? null;
  const fetchErrorMsg = fetchError instanceof Error
    ? fetchError.message
    : fetchError
      ? 'Contact not found'
      : null;
  const displayError = saveError ?? fetchErrorMsg;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 rounded-[20px] overflow-hidden border border-[#e5efea] shadow-[0_20px_60px_rgba(14,51,38,0.15)]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e5efea] bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[12px] bg-[#e7f5ef] flex items-center justify-center flex-shrink-0">
              <Pencil className="h-5 w-5 text-[#2c7860]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#0d0e0e]">Edit contact</DialogTitle>
              <p className="text-xs text-[#6b7280] mt-0.5">Update name, phone, email and role</p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4 bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-[#6b7280]">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading…
            </div>
          ) : displayError && !contact ? (
            <p className="text-sm text-red-600 py-2">{displayError}</p>
          ) : contact ? (
            <>
              {displayError && (
                <p className="text-sm text-red-600">{displayError}</p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-sm font-semibold text-[#0d0e0e]">Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 rounded-[10px] border-[#e5e7eb] text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-phone" className="text-sm font-semibold text-[#0d0e0e]">Phone</Label>
                <Input
                  id="edit-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 000 000 0000"
                  className="h-11 rounded-[10px] border-[#e5e7eb] text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-email" className="text-sm font-semibold text-[#0d0e0e]">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="h-11 rounded-[10px] border-[#e5e7eb] text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-role" className="text-sm font-semibold text-[#0d0e0e]">Role</Label>
                <Input
                  id="edit-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Manager"
                  className="h-11 rounded-[10px] border-[#e5e7eb] text-sm"
                />
              </div>
              {areas.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[#0d0e0e]">
                    Areas of responsibility
                    <span className="ml-1 text-xs font-normal text-[#9ca3af]">(optional)</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {areas.map((area) => {
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
                </div>
              )}
            </>
          ) : null}
        </div>

        {contact && (
          <DialogFooter className="px-6 py-4 border-t border-[#e5efea] bg-[#f9fafb]">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-[10px]">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !name.trim()}
              className="rounded-[10px] bg-[#3d997d] hover:bg-[#3d997d]/90 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
