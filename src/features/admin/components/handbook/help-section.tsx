import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAdminSettings, useUpdateAdminSettings } from '../../hooks';

const DEFAULT_HELP_PARAGRAPHS = [
  'The management handbook is a tool to help you find quick information about some of the areas related to employment and employees.',
  'We have selected something that we know is important to have under control, and the text gives you a brief introduction to the content.',
  'The content is not necessarily complete and you should always contact an advisor in cases you are in doubt about.',
  'We ensure that the content is updated in relation to legislation.',
];

export const HandbookHelpSection: React.FC = () => {
  const { t } = useTranslation('admin');
  const { data: settings } = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();

  const [open, setOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [helpText, setHelpText] = useState<string>('');

  useEffect(() => {
    if (!settings) return;
    const stored = (settings as Record<string, unknown>).handbookHelpText;
    if (typeof stored === 'string' && stored.length > 0) {
      setHelpText(stored);
    } else {
      setHelpText(DEFAULT_HELP_PARAGRAPHS.join('\n\n'));
    }
  }, [settings]);

  const paragraphs = helpText.split(/\n\n+/).filter((p) => p.trim().length > 0);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({ handbookHelpText: helpText });
      toast.success(t('handbook.helpSaved', 'Help text saved'));
      setIsEditing(false);
    } catch {
      toast.error(t('handbook.helpSaveFailed', 'Failed to save help text'));
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 sm:p-6 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm font-semibold text-[#0d0e0e]"
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? '' : '-rotate-90'}`}
        />
        {t('handbook.help', 'Help')}
      </button>

      {open && (
        <div className="mt-4 space-y-3 text-sm text-gray-700 leading-relaxed">
          {isEditing ? (
            <>
              <textarea
                value={helpText}
                onChange={(e) => setHelpText(e.target.value)}
                className="w-full min-h-[160px] rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d0e0e]/10"
                placeholder={t('handbook.helpPlaceholder', 'Help text (paragraphs separated by blank lines)')}
              />
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={updateSettings.isPending}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90"
                  onClick={handleSave}
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? t('common.saving', 'Saving…') : t('common.save', 'Save')}
                </Button>
              </div>
            </>
          ) : (
            <>
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90"
                  onClick={() => setIsEditing(true)}
                >
                  {t('handbook.editHelp', 'Edit')}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
