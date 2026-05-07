import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminSettings } from '../../hooks';
import { useAdminHandbookPage } from '../../handbook-hooks';
import { adminRoutes } from '../../routes';

const DEFAULT_HELP_PARAGRAPHS = [
  'The management handbook is a tool to help you find quick information about some of the areas related to employment and employees.',
  'We have selected something that we know is important to have under control, and the text gives you a brief introduction to the content.',
  'The content is not necessarily complete and you should always contact an advisor in cases you are in doubt about.',
  'We ensure that the content is updated in relation to legislation.',
];

export const HandbookHelpSection: React.FC = () => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const { data: settings } = useAdminSettings();

  const [open, setOpen] = useState(true);

  // The Help section is backed by a real handbook page. Settings stores its
  // nid so admins can edit it via the same page editor used elsewhere — keeps
  // the edit flow consistent and avoids a parallel "settings text" model.
  const helpPageNid: number | null = (() => {
    const raw = (settings as Record<string, unknown> | undefined)?.handbookHelpPageNid;
    const n = typeof raw === 'string' || typeof raw === 'number' ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  })();

  const { data: page } = useAdminHandbookPage(helpPageNid);

  // Fallback text used when no help page has been designated yet.
  const fallbackText = (() => {
    const stored = (settings as Record<string, unknown> | undefined)?.handbookHelpText;
    if (typeof stored === 'string' && stored.length > 0) return stored;
    return DEFAULT_HELP_PARAGRAPHS.join('\n\n');
  })();

  const fallbackParagraphs = fallbackText.split(/\n\n+/).filter((p) => p.trim().length > 0);

  const handleEdit = () => {
    if (helpPageNid) {
      navigate(
        adminRoutes.handbookPageTab
          .replace(':nid', String(helpPageNid))
          .replace(':tab', 'edit'),
      );
      return;
    }
    // No designated help page — open admin settings so an admin can configure
    // which page acts as the help intro.
    navigate(adminRoutes.settings);
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
          {page && page.body ? (
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: page.body }}
            />
          ) : (
            fallbackParagraphs.map((p, i) => <p key={i}>{p}</p>)
          )}
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              size="sm"
              className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90"
              onClick={handleEdit}
            >
              {t('handbook.editHelp', 'Edit')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
