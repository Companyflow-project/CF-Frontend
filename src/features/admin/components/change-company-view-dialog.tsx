import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '../api';
import { enterCompanyConsole } from '../impersonation';
import type { AdminCompanyListItem } from '../types';

interface ChangeCompanyViewDialogProps {
  open: boolean;
  onClose: () => void;
  /** Where to land inside the company console (defaults to its dashboard). */
  targetPath?: string;
}

/**
 * Company picker for platform staff.
 *
 * Superadmins have no company of their own, so every company-scoped screen
 * (departments, employment types, appearance…) is scoped to nothing and renders
 * empty — which reads as data loss. This picker drops them into a chosen
 * company's console via the existing token swap, so the *backend* genuinely
 * scopes to that company. A frontend-only company override would not work:
 * some endpoints take companyId as a query parameter but others read it from
 * the JWT, so the two would disagree.
 */
export const ChangeCompanyViewDialog: React.FC<ChangeCompanyViewDialogProps> = ({
  open,
  onClose,
  targetPath,
}) => {
  const { t } = useTranslation('admin');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [busyNid, setBusyNid] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    if (!open) {
      setSearchInput('');
      setDebouncedSearch('');
      setBusyNid(null);
      setError(null);
    }
  }, [open]);

  // Unlike the user picker, show a useful list before anything is typed —
  // staff often just want the company they were last working in.
  const { data, isFetching, isError } = useQuery({
    queryKey: ['admin-companies-picker', debouncedSearch],
    queryFn: () => adminApi.getCompanies({ search: debouncedSearch || undefined, page: 1, limit: 10 }),
    enabled: open,
    placeholderData: keepPreviousData,
  });

  const companies: AdminCompanyListItem[] = data?.data ?? [];

  const onPick = async (company: AdminCompanyListItem) => {
    setError(null);
    setBusyNid(company.nid);
    try {
      await enterCompanyConsole({
        companyId: company.nid,
        companyName: company.title,
        targetPath: targetPath ?? '/',
        returnTo: window.location.pathname + window.location.search,
      });
      // page navigates away on success
    } catch (e) {
      const err = e as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to switch company.');
      setBusyNid(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="w-[min(560px,92vw)] max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">
            {t('nav.changeCompanyView', 'Go to company')}
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            aria-label={t('common.cancel', 'Cancel')}
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="px-6 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              autoFocus
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('company.searchPlaceholder', 'Search by company name or CVR…')}
              className="pl-9"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t(
              'company.pickerHelp',
              'Open a company’s console to manage its departments, employment types and settings. A banner stays visible while you’re there; click Exit to return.',
            )}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 min-h-[160px]">
          {isFetching && companies.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8 px-4">
              {t('common.loading', 'Loading…')}
            </p>
          )}
          {isError && (
            <p className="text-sm text-red-600 text-center py-8 px-4">
              {t('company.searchError', 'Search failed. Try again.')}
            </p>
          )}
          {!isFetching && !isError && companies.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8 px-4">
              {t('company.noResults', 'No companies matched.')}
            </p>
          )}
          {companies.map((c) => {
            const isBusy = busyNid === c.nid;
            return (
              <button
                key={c.nid}
                type="button"
                onClick={() => onPick(c)}
                disabled={busyNid !== null}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between gap-3 transition-colors ${
                  isBusy ? 'bg-gray-100' : 'hover:bg-gray-50'
                } ${busyNid !== null && !isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#0d0e0e] truncate">{c.title}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {c.cvr && <>CVR {c.cvr}</>}
                    {c.cvr && c.city && <> · </>}
                    {c.city}
                  </div>
                </div>
                <div className="text-xs text-gray-500 shrink-0">
                  {isBusy
                    ? t('impersonate.switching', 'Switching…')
                    : t('company.openAction', 'Open')}
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="px-6 pb-4 text-sm text-red-600">{error}</div>
        )}
      </DialogContent>
    </Dialog>
  );
};
