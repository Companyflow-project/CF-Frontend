import { useTranslation } from 'react-i18next';
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
import { UserPlus, Plus, X } from 'lucide-react';

export interface BatchContactTarget {
  id: string;
  name: string;
  email?: string;
  telephone?: string;
  uid: number;
}

export interface AddSelectedAsContactsPayload {
  areaIds: number[];
  newAreas?: string[];
}

interface AddSelectedAsContactsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** People to add; each must have uid for POST /contacts */
  targets: BatchContactTarget[];
  onConfirm: (payload: AddSelectedAsContactsPayload) => void;
}

export const AddSelectedAsContactsModal: React.FC<AddSelectedAsContactsModalProps> = ({
  open,
  onOpenChange,
  targets,
  onConfirm,
}) => {
  const { t } = useTranslation('contacts');
  const { data: areasData } = useContactAreas();
  const [selectedAreaIds, setSelectedAreaIds] = useState<number[]>([]);
  const [customAreas, setCustomAreas] = useState<string[]>([]);
  const [newCustomArea, setNewCustomArea] = useState('');
  const [isAddingCustomArea, setIsAddingCustomArea] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedAreaIds([]);
      setCustomAreas([]);
      setNewCustomArea('');
      setIsAddingCustomArea(false);
    }
  }, [open]);

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
    const newAreas = customAreas.map((a) => a.trim()).filter(Boolean);
    onConfirm({ areaIds: selectedAreaIds, newAreas });
    onOpenChange(false);
  };

  const count = targets.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 flex flex-col gap-0 rounded-[20px] overflow-hidden border border-[#e5efea] shadow-[0_20px_60px_rgba(14,51,38,0.15)] max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#e5efea] bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[12px] bg-[#d4f4e6] flex items-center justify-center flex-shrink-0">
              <UserPlus className="h-5 w-5 text-[#1a5948]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#0d0e0e]">
                {t('addSelected.title', { count })}
              </DialogTitle>
              <p className="text-xs text-[#6b7280] mt-0.5">
                {t('addSelected.subtitle')}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 bg-white space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="text-xs font-medium text-[#0d0e0e] mb-2 block">{t('addSelected.peopleToAdd')}</label>
            <ul className="text-sm text-[#374151] space-y-1 max-h-24 overflow-y-auto rounded-[10px] border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2">
              {targets.map((t) => (
                <li key={t.id}>
                  {t.name}
                  {t.email ? ` · ${t.email}` : ''}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-[#f0f4f2] pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-[#0d0e0e]">{t('field.areas')}<span className="ml-1 text-xs font-normal text-[#9ca3af]">(optional)</span>
              </label>
              {!isAddingCustomArea && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleStartCustomArea}
                  className="h-8 gap-1.5 text-xs text-[#1a5948] hover:bg-[#f0f7f5] rounded-[8px] px-3"
                >
                  <Plus className="h-3.5 w-3.5" />{t('field.createNew')}</Button>
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
                      'flex items-center gap-2 px-3 py-2 rounded-[10px] border text-sm font-medium transition-all text-left',
                      checked
                        ? 'bg-[#d4f4e6] border-[#3d997d] text-[#1a5948]'
                        : 'bg-white border-[#e5e7eb] text-[#374151] hover:border-[#3d997d]/40 hover:bg-[#f6fbf9]',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'h-4 w-4 rounded-[4px] border-2 flex items-center justify-center flex-shrink-0',
                        checked ? 'bg-[#3d997d] border-[#3d997d]' : 'border-[#d1d5db] bg-white',
                      ].join(' ')}
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
              {customAreas.map((label, index) => (
                <button
                  key={`new-${index}`}
                  type="button"
                  onClick={() => handleRemoveCustomArea(index)}
                  className="flex items-center gap-2 px-3 py-2 rounded-[10px] border text-sm font-medium bg-[#d4f4e6] border-[#3d997d] text-[#1a5948] text-left"
                >
                  <span className="h-4 w-4 rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 bg-[#3d997d] border-[#3d997d]">
                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {label}
                  <X className="h-3.5 w-3.5 ml-auto flex-shrink-0" />
                </button>
              ))}
            </div>
            {isAddingCustomArea && (
              <div className="flex items-center gap-2 pt-2">
                <Input
                  autoFocus
                  placeholder={t('field.newAreaNamePlaceholder')}
                  value={newCustomArea}
                  onChange={(e) => setNewCustomArea(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmCustomArea();
                    }
                  }}
                  className="h-10 rounded-[10px] border-[#3d997d]/50 text-sm"
                />
                <Button type="button" onClick={handleConfirmCustomArea} className="h-10 px-4 rounded-[10px] bg-[#3d997d] text-white hover:bg-[#3d997d]/90">
                  Add
                </Button>
                <button
                  type="button"
                  onClick={() => { setIsAddingCustomArea(false); setNewCustomArea(''); }}
                  className="h-10 w-10 flex items-center justify-center rounded-[10px] hover:bg-[#ffecef] text-[#9ca3af] hover:text-[#d5384b]"
                  aria-label={t('field.cancel')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#e5efea] bg-[#f9fafb] flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-[10px]">{t('field.cancel')}</Button>
          <Button onClick={handleSubmit} className="rounded-[10px] bg-[#3d997d] hover:bg-[#3d997d]/90 text-white">
            Add {count} {count === 1 ? 'contact' : 'contacts'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
