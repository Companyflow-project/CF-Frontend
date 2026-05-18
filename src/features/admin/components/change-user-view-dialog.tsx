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
import { enterUserConsole } from '../impersonation';
import type { AdminUser } from '../types';

interface ChangeUserViewDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ChangeUserViewDialog: React.FC<ChangeUserViewDialogProps> = ({ open, onClose }) => {
  const { t } = useTranslation('admin');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [busyUid, setBusyUid] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounce input → query param (250ms).
  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  // Reset state when the dialog closes so it opens fresh next time.
  useEffect(() => {
    if (!open) {
      setSearchInput('');
      setDebouncedSearch('');
      setBusyUid(null);
      setError(null);
    }
  }, [open]);

  const enabled = open && debouncedSearch.length >= 2;
  const { data, isFetching, isError } = useQuery({
    queryKey: ['admin-users-search', debouncedSearch],
    queryFn: () => adminApi.getUsers({ search: debouncedSearch, limit: 10, status: '1' }),
    enabled,
    placeholderData: keepPreviousData,
  });

  const users: AdminUser[] = enabled ? (data?.data ?? []) : [];

  const onPick = async (user: AdminUser) => {
    setError(null);
    setBusyUid(user.uid);
    try {
      await enterUserConsole({
        userId: user.uid,
        displayName: user.name,
        returnTo: window.location.pathname + window.location.search,
      });
      // page navigates away on success
    } catch (e) {
      const err = e as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to switch user.');
      setBusyUid(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="w-[min(560px,92vw)] max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">
            {t('nav.changeUserView', 'Change user view')}
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
              placeholder={t('impersonate.searchPlaceholder', 'Search by name or email…')}
              className="pl-9"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t('impersonate.help', 'Pick a user to view CompanyFlow as them. A banner stays visible while you’re impersonating; click Exit to return.')}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 min-h-[160px]">
          {!enabled && (
            <p className="text-sm text-gray-400 text-center py-8 px-4">
              {t('impersonate.minChars', 'Type at least 2 characters to search.')}
            </p>
          )}
          {enabled && isFetching && users.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8 px-4">
              {t('common.loading', 'Loading…')}
            </p>
          )}
          {enabled && isError && (
            <p className="text-sm text-red-600 text-center py-8 px-4">
              {t('impersonate.searchError', 'Search failed. Try again.')}
            </p>
          )}
          {enabled && !isFetching && !isError && users.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8 px-4">
              {t('impersonate.noResults', 'No users matched.')}
            </p>
          )}
          {users.map((u) => {
            const isBusy = busyUid === u.uid;
            return (
              <button
                key={u.uid}
                type="button"
                onClick={() => onPick(u)}
                disabled={busyUid !== null}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between gap-3 transition-colors ${
                  isBusy ? 'bg-gray-100' : 'hover:bg-gray-50'
                } ${busyUid !== null && !isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#0d0e0e] truncate">{u.name}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {u.mail}
                    {u.companyName && <> · {u.companyName}</>}
                  </div>
                </div>
                <div className="text-xs text-gray-500 shrink-0">
                  {isBusy
                    ? t('impersonate.switching', 'Switching…')
                    : t('impersonate.viewAsAction', 'View as')}
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
