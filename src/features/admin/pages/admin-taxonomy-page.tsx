import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { adminRoutes } from '../routes';
import {
  useAdminTaxonomyVocabularies,
  useReorderTaxonomyVocabularies,
  useCreateTaxonomyVocabulary,
  useDeleteTaxonomyVocabulary,
} from '../hooks';
import type { AdminTaxonomyVocabulary } from '../types';

function arrayMove<T>(arr: readonly T[], from: number, to: number): T[] {
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export const AdminTaxonomyPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const { data: vocabularies = [], isLoading, isError } = useAdminTaxonomyVocabularies();
  const reorder = useReorderTaxonomyVocabularies();
  const createMutation = useCreateTaxonomyVocabulary();
  const deleteMutation = useDeleteTaxonomyVocabulary();

  const [order, setOrder] = useState<AdminTaxonomyVocabulary[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const baselineRef = useRef<string>('');

  useEffect(() => {
    // Reset working list whenever the server list updates.
    setOrder(vocabularies);
    baselineRef.current = vocabularies.map(v => v.vid).join('|');
  }, [vocabularies]);

  const isDirty = useMemo(
    () => order.map(v => v.vid).join('|') !== baselineRef.current,
    [order]
  );

  const localizeName = (v: AdminTaxonomyVocabulary) =>
    t(`taxonomy.vid.${v.vid}`, { defaultValue: v.name });

  const onSave = () => {
    const items = order.map((v, i) => ({ vid: v.vid, weight: i }));
    reorder.mutate(items);
  };

  const onDelete = (vid: string) => {
    if (!confirm(t('taxonomy.confirmDeleteVocab', 'Delete this vocabulary? It must be empty first.'))) return;
    deleteMutation.mutate(vid);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500">
            <Link to={adminRoutes.dashboard} className="hover:underline">
              {t('nav.console', 'Console')}
            </Link>
            <span className="mx-1.5">›</span>
            <span className="text-gray-700">{t('taxonomy.breadcrumb', 'Taxonomy')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">
            {t('taxonomy.title', 'Taxonomy')}
          </h1>
        </div>
        <Button
          type="button"
          onClick={() => { setShowAdd(true); setFormError(null); }}
          className="bg-[#0d0e0e] text-white rounded-lg"
        >
          {t('taxonomy.addVocabulary', '+ Add vocabulary')}
        </Button>
      </div>

      <p className="text-sm text-gray-600 max-w-3xl">
        {t('taxonomy.description', '')}
      </p>

      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-10" />
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t('taxonomy.colVocabulary', 'Vocabulary')}
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t('taxonomy.colDescription', 'Description')}
              </TableHead>
              <TableHead className="w-[220px] text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t('taxonomy.colActions', 'Actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-gray-500 py-6 text-center">
                  {t('taxonomy.loading', 'Loading…')}
                </TableCell>
              </TableRow>
            )}
            {isError && !isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-red-600 py-6 text-center">
                  {t('taxonomy.loadError', 'Failed to load vocabularies.')}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && order.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-gray-500 py-6 text-center">
                  {t('taxonomy.empty', 'No vocabularies found.')}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && order.map((v, idx) => (
              <TableRow
                key={v.vid}
                className={`hover:bg-gray-50 ${hoverIndex === idx && dragIndex !== null && dragIndex !== idx ? 'bg-blue-50' : ''}`}
                draggable
                onDragStart={() => setDragIndex(idx)}
                onDragEnter={() => setHoverIndex(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={() => { setDragIndex(null); setHoverIndex(null); }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null && dragIndex !== idx) {
                    setOrder(arrayMove(order, dragIndex, idx));
                  }
                  setDragIndex(null);
                  setHoverIndex(null);
                }}
              >
                <TableCell className="w-10 text-gray-400 cursor-grab">
                  <GripVertical className="h-4 w-4" />
                </TableCell>
                <TableCell>
                  <Link
                    to={adminRoutes.taxonomyTerms.replace(':vid', v.vid)}
                    className="text-blue-600 hover:underline"
                    title={v.vid}
                  >
                    {localizeName(v)}
                  </Link>
                </TableCell>
                <TableCell className="text-gray-600 text-sm">
                  {v.description ?? ''}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={adminRoutes.taxonomyTerms.replace(':vid', v.vid)}>
                        {t('taxonomy.showWords', 'Show words')}
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => onDelete(v.vid)}
                      disabled={v.termCount > 0 || deleteMutation.isPending}
                      title={v.termCount > 0 ? t('taxonomy.deleteBlockedByTerms', 'Vocabulary must be empty to delete.') : ''}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={!isDirty || reorder.isPending}
          onClick={onSave}
          className="bg-[#0d0e0e] text-white rounded-lg disabled:opacity-50"
        >
          {reorder.isPending ? t('taxonomy.saving', 'Saving…') : t('taxonomy.save', 'Save')}
        </Button>
      </div>

      {showAdd && (
        <AddVocabularyDialog
          open={showAdd}
          onClose={() => setShowAdd(false)}
          loading={createMutation.isPending}
          error={formError}
          onSubmit={async (data) => {
            setFormError(null);
            try {
              await createMutation.mutateAsync(data);
              setShowAdd(false);
            } catch (err) {
              const e = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
              setFormError(e?.response?.data?.error?.message ?? e?.message ?? 'Failed to create vocabulary.');
            }
          }}
        />
      )}
    </div>
  );
};

interface AddVocabularyDialogProps {
  open: boolean;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (data: { vid: string; name: string; description?: string }) => void;
}

const AddVocabularyDialog: React.FC<AddVocabularyDialogProps> = ({
  open, loading, error, onClose, onSubmit,
}) => {
  const { t } = useTranslation('admin');
  const [name, setName] = useState('');
  const [vid, setVid] = useState('');
  const [vidTouched, setVidTouched] = useState(false);
  const [description, setDescription] = useState('');

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 32);

  useEffect(() => {
    if (!vidTouched) setVid(slugify(name));
  }, [name, vidTouched]);

  const canSubmit = name.trim().length > 0 && /^[a-z][a-z0-9_]{0,31}$/.test(vid);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="w-[min(560px,90vw)]">
        <DialogHeader>
          <DialogTitle>{t('taxonomy.addVocabularyTitle', 'Add vocabulary')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="vocab-name">{t('taxonomy.fieldName', 'Name')}</Label>
            <Input
              id="vocab-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Departments"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vocab-vid">{t('taxonomy.fieldMachineName', 'Machine name')}</Label>
            <Input
              id="vocab-vid"
              value={vid}
              onChange={(e) => { setVidTouched(true); setVid(e.target.value.toLowerCase()); }}
              placeholder="departments"
            />
            <p className="text-xs text-gray-500">
              {t('taxonomy.machineNameHelp', 'Lowercase letters, digits and underscores only. Starts with a letter.')}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vocab-description">{t('taxonomy.fieldDescription', 'Description')}</Label>
            <Textarea
              id="vocab-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            disabled={!canSubmit || loading}
            onClick={() => onSubmit({
              vid,
              name: name.trim(),
              description: description.trim() || undefined,
            })}
            className="bg-[#0d0e0e] text-white"
          >
            {loading ? t('taxonomy.saving', 'Saving…') : t('taxonomy.create', 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
