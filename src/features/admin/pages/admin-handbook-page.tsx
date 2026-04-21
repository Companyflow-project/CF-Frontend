import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ChevronDown, List, Printer } from 'lucide-react';
import { useAdminSettings, useUpdateAdminSettings } from '../hooks';
import { adminRoutes } from '../routes';
import { toast } from 'sonner';

const DEFAULT_HELP_PARAGRAPHS = [
  'The management handbook is a tool to help you find quick information about some of the areas related to employment and employees.',
  'We have selected something that we know is important to have under control, and the text gives you a brief introduction to the content.',
  'The content is not necessarily complete and you should always contact an advisor in cases you are in doubt about.',
  'We ensure that the content is updated in relation to legislation.',
];

export const AdminHandbookPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const { data: settings } = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();

  const [helpOpen, setHelpOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [helpText, setHelpText] = useState<string>('');

  // Hydrate help text from settings
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
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb + title */}
      <div>
        <div className="text-sm text-gray-500">
          <Link to={adminRoutes.dashboard} className="hover:underline">
            {t('nav.console', 'Console')}
          </Link>
          {' › '}
          <span className="text-gray-700">{t('handbook.title', 'Management Handbook')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">
          {t('handbook.title', 'Management Handbook')}
        </h1>
      </div>

      {/* Help section */}
      <div className="border border-gray-200 rounded-xl p-4 sm:p-6">
        <button
          type="button"
          onClick={() => setHelpOpen((v) => !v)}
          className="flex items-center gap-1 text-sm font-semibold text-[#0d0e0e]"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${helpOpen ? '' : '-rotate-90'}`}
          />
          {t('handbook.help', 'Help')}
        </button>

        {helpOpen && (
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
                    {t('handbook.edit', 'Edit')}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Two cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl">
        <Link
          to={adminRoutes.handbookTableOfContents}
          className="border border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-[#0d0e0e] hover:shadow-sm transition-all"
        >
          <List className="h-8 w-8 text-[#0d0e0e] mb-4" />
          <h3 className="font-semibold text-[#0d0e0e]">
            {t('handbook.toc', 'Table of contents')}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('handbook.tocDesc', 'Searchable overview')}
          </p>
        </Link>

        <Link
          to={adminRoutes.handbookPrint}
          className="border border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-[#0d0e0e] hover:shadow-sm transition-all"
        >
          <Printer className="h-8 w-8 text-[#0d0e0e] mb-4" />
          <h3 className="font-semibold text-[#0d0e0e]">
            {t('handbook.print', 'Printer-Friendly version')}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('handbook.printDesc', 'The entire handbook')}
          </p>
        </Link>
      </div>
    </div>
  );
};
