import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { adminRoutes } from '../routes';
import {
  useAdminTaxonomyTerms,
  useAdminTaxonomyVocabularies,
  useCreateTaxonomyTerm,
  useUpdateTaxonomyTerm,
  useDeleteTaxonomyTerm,
  useAdminTaxonomyTermVersions,
  useRestoreTaxonomyTermVersion,
  useDeleteTaxonomyTermVersion,
} from '../hooks';
import { adminApi } from '../api';
import type { AdminTaxonomyTerm } from '../types';

type Tab = 'preview' | 'edit' | 'delete' | 'versions' | 'translate';

export const AdminTaxonomyTermEditPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const { vid = '', tid: tidParam } = useParams<{ vid: string; tid?: string }>();
  const isEdit = !!tidParam;
  const tid = tidParam ? Number(tidParam) : null;

  const { data: vocabularies = [] } = useAdminTaxonomyVocabularies();
  const { data: terms = [] } = useAdminTaxonomyTerms(vid);

  const vocab = vocabularies.find(v => v.vid === vid);
  const vocabLabel = vocab
    ? t(`taxonomy.vid.${vocab.vid}`, { defaultValue: vocab.name })
    : vid;

  const [tab, setTab] = useState<Tab>('edit');
  const [original, setOriginal] = useState<AdminTaxonomyTerm | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isEdit || !tid) return;
      setLoading(true);
      try {
        const term = await adminApi.getTaxonomyTerm(tid);
        if (cancelled) return;
        setOriginal(term);
      } catch (e) {
        const err = e as { response?: { data?: { error?: { message?: string } } }; message?: string };
        setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to load term.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [isEdit, tid]);

  const tabs: Array<{ key: Tab; label: string; enabled: boolean; danger?: boolean }> = [
    { key: 'preview', label: t('taxonomy.tabPreview', 'Preview'), enabled: false },
    { key: 'edit', label: t('taxonomy.tabEdit', 'Edit'), enabled: true },
    { key: 'delete', label: t('taxonomy.tabDelete', 'Delete'), enabled: isEdit, danger: true },
    { key: 'versions', label: t('taxonomy.tabVersions', 'Versions'), enabled: isEdit },
    { key: 'translate', label: t('taxonomy.tabTranslate', 'Translate'), enabled: false },
  ];

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <div className="text-sm text-gray-500">
          <Link to={adminRoutes.dashboard} className="hover:underline">
            {t('nav.console', 'Console')}
          </Link>
          <span className="mx-1.5">›</span>
          <Link to={adminRoutes.taxonomy} className="hover:underline">
            {t('taxonomy.breadcrumb', 'Taxonomy')}
          </Link>
          <span className="mx-1.5">›</span>
          <Link to={adminRoutes.taxonomyTerms.replace(':vid', vid)} className="hover:underline">
            {vocabLabel}
          </Link>
          {original && (
            <>
              <span className="mx-1.5">›</span>
              <span className="text-gray-700">{original.name}</span>
            </>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">
          {isEdit ? t('taxonomy.editWord', 'Edit word') : t('taxonomy.addWord', 'Add word')}
        </h1>
      </div>

      {/* Tab strip */}
      <div className="bg-white border border-gray-200 rounded-xl p-1.5 flex flex-wrap gap-1">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            type="button"
            disabled={!tabItem.enabled}
            onClick={() => tabItem.enabled && setTab(tabItem.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              tab === tabItem.key && tabItem.enabled && 'bg-[#0d0e0e] text-white',
              tab !== tabItem.key && tabItem.enabled && tabItem.danger && 'text-red-600 hover:bg-red-50',
              tab !== tabItem.key && tabItem.enabled && !tabItem.danger && 'text-gray-700 hover:bg-gray-100',
              !tabItem.enabled && 'text-gray-300 cursor-not-allowed',
            )}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {error && tab === 'edit' && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !original && isEdit && (
        <div className="text-center text-gray-500 py-8">{t('taxonomy.loading', 'Loading…')}</div>
      )}

      {tab === 'edit' && (!isEdit || original) && (
        <EditTab
          vid={vid}
          original={original}
          isEdit={isEdit}
          terms={terms}
          onSaved={(stayOnPage) => {
            if (!stayOnPage) {
              navigate(adminRoutes.taxonomyTerms.replace(':vid', vid));
            }
          }}
          onDeleted={() => navigate(adminRoutes.taxonomyTerms.replace(':vid', vid))}
        />
      )}

      {tab === 'delete' && isEdit && tid && original && (
        <DeleteTab
          vid={vid}
          term={original}
          onCancel={() => setTab('edit')}
          onDeleted={() => navigate(adminRoutes.taxonomyTerms.replace(':vid', vid))}
        />
      )}

      {tab === 'versions' && isEdit && tid && (
        <VersionsTab tid={tid} onRestored={() => setTab('edit')} />
      )}
    </div>
  );
};

// ----- EDIT TAB -----

interface EditTabProps {
  vid: string;
  original: AdminTaxonomyTerm | null;
  isEdit: boolean;
  terms: AdminTaxonomyTerm[];
  onSaved: (stayOnPage: boolean) => void;
  onDeleted: () => void;
}

const EditTab: React.FC<EditTabProps> = ({ vid, original, isEdit, terms, onSaved, onDeleted }) => {
  const { t } = useTranslation('admin');
  const createMutation = useCreateTaxonomyTerm(vid);
  const updateMutation = useUpdateTaxonomyTerm(vid);
  const deleteMutation = useDeleteTaxonomyTerm(vid);

  const [name, setName] = useState(original?.name ?? '');
  const [description, setDescription] = useState(original?.description ?? '');
  const [parentTid, setParentTid] = useState<number>(original?.parentTid ?? 0);
  const [isRoot, setIsRoot] = useState<boolean>((original?.parentTid ?? 0) === 0);
  const [status, setStatus] = useState<boolean>(original?.status ?? true);
  const [busy, setBusy] = useState<null | 'save' | 'saveAndList' | 'delete'>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!original) return;
    setName(original.name);
    setDescription(original.description ?? '');
    setParentTid(original.parentTid);
    setIsRoot(original.parentTid === 0);
    setStatus(original.status);
  }, [original]);

  // Parent dropdown options exclude self.
  const parentOptions = useMemo(
    () => terms.filter(o => !isEdit || o.tid !== original?.tid),
    [terms, isEdit, original?.tid]
  );

  const submit = async (mode: 'save' | 'saveAndList') => {
    setError(null);
    if (!name.trim()) {
      setError(t('taxonomy.errors.nameRequired', 'Name is required.'));
      return;
    }
    setBusy(mode);
    try {
      const effectiveParent = isRoot ? 0 : parentTid;
      if (isEdit && original) {
        await updateMutation.mutateAsync({
          tid: original.tid,
          data: {
            name: name.trim(),
            description: description.trim() || null,
            parentTid: effectiveParent,
            status,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          parentTid: effectiveParent,
          status,
        });
      }
      onSaved(mode === 'save' && isEdit);
    } catch (e) {
      const err = e as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to save term.');
    } finally {
      setBusy(null);
    }
  };

  const onInlineDelete = async () => {
    if (!isEdit || !original) return;
    if (!confirm(t('taxonomy.confirmDeleteTerm', { defaultValue: 'Delete term "{{name}}"?', name: original.name }))) return;
    setError(null);
    setBusy('delete');
    try {
      await deleteMutation.mutateAsync(original.tid);
      onDeleted();
    } catch (e) {
      const err = e as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to delete term.');
      setBusy(null);
    }
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit('save'); }}
      className="bg-white border border-gray-200 rounded-xl p-6 space-y-5"
    >
      <div className="space-y-1.5">
        <Label htmlFor="term-name">
          {t('taxonomy.fieldTitle', 'Title')} <span className="text-red-600">*</span>
        </Label>
        <Input
          id="term-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="term-description">
          {t('taxonomy.fieldBodyText', 'Body text (Edit intro)')}
        </Label>
        <Textarea
          id="term-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
        />
        <p className="text-xs text-gray-500">
          {t('taxonomy.aboutTextFormats', 'About text formats')}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>{t('taxonomy.fieldTextFormat', 'Text format')}</Label>
        <Input value="Simple HTML" disabled className="bg-gray-50" />
      </div>

      <div className="space-y-1.5">
        <Label>{t('taxonomy.fieldLanguage', 'Language')}</Label>
        <Input value="Danish" disabled className="bg-gray-50" />
      </div>

      <div className="pt-4 border-t border-gray-100">
        <p className="text-sm font-semibold text-[#0d0e0e] mb-3 flex items-center gap-1">
          <span className="text-gray-400">•</span>
          {t('taxonomy.parentWords', 'Parent words')}
        </p>
        <div className="flex items-center gap-2 mb-3">
          <input
            id="term-root"
            type="checkbox"
            checked={isRoot}
            onChange={(e) => {
              const checked = e.target.checked;
              setIsRoot(checked);
              if (checked) setParentTid(0);
            }}
            className="h-4 w-4"
          />
          <Label htmlFor="term-root" className="cursor-pointer font-medium">
            {t('taxonomy.rootWord', 'Root word')}
          </Label>
        </div>
        <select
          value={parentTid}
          onChange={(e) => {
            const next = Number(e.target.value);
            setParentTid(next);
            setIsRoot(next === 0);
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value={0}>{t('taxonomy.noParent', '– Root –')}</option>
          {parentOptions.map((p) => (
            <option key={p.tid} value={p.tid}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <input
            id="term-status"
            type="checkbox"
            checked={status}
            onChange={(e) => setStatus(e.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="term-status" className="cursor-pointer font-medium">
            {t('taxonomy.fieldPublished', 'Published')}
          </Label>
        </div>
        <div className="flex gap-2">
          {isEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={onInlineDelete}
              disabled={busy !== null}
            >
              {busy === 'delete' ? t('taxonomy.saving', 'Saving…') : t('common.delete', 'Delete')}
            </Button>
          )}
          <Button
            type="submit"
            disabled={busy !== null}
            className="bg-[#0d0e0e] text-white"
          >
            {busy === 'save' ? t('taxonomy.saving', 'Saving…') : t('common.save', 'Save')}
          </Button>
          <Button
            type="button"
            disabled={busy !== null}
            onClick={() => submit('saveAndList')}
            className="bg-[#0d0e0e] text-white"
          >
            {busy === 'saveAndList' ? t('taxonomy.saving', 'Saving…') : t('taxonomy.saveAndGoToList', 'Save and go to list')}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
};

// ----- DELETE TAB -----

interface DeleteTabProps {
  vid: string;
  term: AdminTaxonomyTerm;
  onCancel: () => void;
  onDeleted: () => void;
}

const DeleteTab: React.FC<DeleteTabProps> = ({ vid, term, onCancel, onDeleted }) => {
  const { t } = useTranslation('admin');
  const deleteMutation = useDeleteTaxonomyTerm(vid);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    try {
      await deleteMutation.mutateAsync(term.tid);
      onDeleted();
    } catch (e) {
      const err = e as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Failed to delete term.');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-[#0d0e0e]">
        {t('taxonomy.deleteHeading', { defaultValue: 'Delete "{{name}}"?', name: term.name })}
      </h2>
      <p className="text-sm text-gray-600">
        {t('taxonomy.deleteWarning', 'This action cannot be undone. The term will be removed from this vocabulary along with all its revisions.')}
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={deleteMutation.isPending}>
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button
          type="button"
          onClick={run}
          disabled={deleteMutation.isPending}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {deleteMutation.isPending ? t('taxonomy.saving', 'Saving…') : t('common.delete', 'Delete')}
        </Button>
      </div>
    </div>
  );
};

// ----- VERSIONS TAB -----

interface VersionsTabProps {
  tid: number;
  onRestored: () => void;
}

function formatTimestamp(unix: number): string {
  if (!unix) return '—';
  try {
    return new Date(unix * 1000).toLocaleString();
  } catch {
    return '—';
  }
}

const VersionsTab: React.FC<VersionsTabProps> = ({ tid, onRestored }) => {
  const { t } = useTranslation('admin');
  const { data: versions = [], isLoading, isError } = useAdminTaxonomyTermVersions(tid);
  const restoreMutation = useRestoreTaxonomyTermVersion(tid);
  const deleteMutation = useDeleteTaxonomyTermVersion(tid);
  const [busy, setBusy] = useState<number | null>(null);

  const onRestore = async (revisionId: number) => {
    if (!confirm(t('taxonomy.confirmRestoreVersion', 'Restore this version? A new revision will be created with these values.'))) return;
    setBusy(revisionId);
    try {
      await restoreMutation.mutateAsync(revisionId);
      onRestored();
    } finally {
      setBusy(null);
    }
  };

  const onDelete = async (revisionId: number) => {
    if (!confirm(t('taxonomy.confirmDeleteVersion', 'Delete this revision?'))) return;
    setBusy(revisionId);
    try {
      await deleteMutation.mutateAsync(revisionId);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-[#0d0e0e]">
          {t('taxonomy.versionsHeading', 'Versions')}
        </h2>
      </div>
      {isLoading && (
        <div className="px-6 py-6 text-sm text-gray-500 text-center">
          {t('taxonomy.loading', 'Loading…')}
        </div>
      )}
      {isError && (
        <div className="px-6 py-6 text-sm text-red-600 text-center">
          {t('taxonomy.versionsLoadError', 'Failed to load versions.')}
        </div>
      )}
      {!isLoading && !isError && versions.length === 0 && (
        <div className="px-6 py-6 text-sm text-gray-500 text-center">
          {t('taxonomy.versionsEmpty', 'No versions found.')}
        </div>
      )}
      {!isLoading && !isError && versions.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {versions.map((v) => (
            <li key={v.revisionId} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#0d0e0e]">{v.name || `#${v.revisionId}`}</span>
                  {v.isCurrent && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {t('taxonomy.versionCurrent', 'Current')}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {formatTimestamp(v.changed)}
                  {v.authorName && <> · {v.authorName}</>}
                  {v.logMessage && <> · {v.logMessage}</>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {!v.isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRestore(v.revisionId)}
                    disabled={busy === v.revisionId || restoreMutation.isPending}
                  >
                    {t('taxonomy.versionRestore', 'Restore')}
                  </Button>
                )}
                {!v.isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => onDelete(v.revisionId)}
                    disabled={busy === v.revisionId || deleteMutation.isPending}
                  >
                    {t('common.delete', 'Delete')}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
