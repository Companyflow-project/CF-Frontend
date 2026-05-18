import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { adminRoutes } from '../routes';
import { useAdminTaxonomyVocabularies, useAdminTaxonomyTerms } from '../hooks';
import { adminApi } from '../api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminTaxonomyTerm } from '../types';

function arrayMove<T>(arr: readonly T[], from: number, to: number): T[] {
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export const AdminTaxonomyTermsPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const { vid = '' } = useParams<{ vid: string }>();
  const { data: vocabularies = [] } = useAdminTaxonomyVocabularies();
  const { data: terms = [], isLoading, isError } = useAdminTaxonomyTerms(vid);
  const qc = useQueryClient();
  const reorderTerms = useMutation({
    mutationFn: (items: Array<{ tid: number; weight: number; parentTid: number }>) =>
      adminApi.reorderTaxonomyTerms(vid, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-taxonomy-terms', vid] });
    },
  });

  const vocab = vocabularies.find(v => v.vid === vid);
  const vocabLabel = vocab
    ? t(`taxonomy.vid.${vocab.vid}`, { defaultValue: vocab.name })
    : vid;

  const [order, setOrder] = useState<AdminTaxonomyTerm[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    setOrder(terms);
  }, [terms]);

  const isDirty = useMemo(() => {
    if (order.length !== terms.length) return false;
    return order.some((t, i) => t.tid !== terms[i]?.tid);
  }, [order, terms]);

  const onSave = () => {
    reorderTerms.mutate(order.map((term, i) => ({
      tid: term.tid,
      weight: i,
      parentTid: term.parentTid,
    })));
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
            <Link to={adminRoutes.taxonomy} className="hover:underline">
              {t('taxonomy.breadcrumb', 'Taxonomy')}
            </Link>
            <span className="mx-1.5">›</span>
            <span className="text-gray-700">{vocabLabel}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">
            {vocabLabel}
          </h1>
        </div>
        <Button asChild className="bg-[#0d0e0e] text-white rounded-lg">
          <Link to={adminRoutes.taxonomyTermCreate.replace(':vid', vid)}>
            {t('taxonomy.addWords', '+ Add words')}
          </Link>
        </Button>
      </div>

      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-10" />
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t('taxonomy.colTermName', 'Name')}
              </TableHead>
              <TableHead className="w-[160px] text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t('taxonomy.colStatus', 'Status')}
              </TableHead>
              <TableHead className="w-[120px] text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
                  {t('taxonomy.loadError', 'Failed to load terms.')}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && order.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-gray-500 py-6 text-center">
                  {t('taxonomy.termsEmpty', 'No terms in this vocabulary yet.')}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && order.map((term, idx) => (
              <TableRow
                key={term.tid}
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
                    to={adminRoutes.taxonomyTermEdit
                      .replace(':vid', vid)
                      .replace(':tid', String(term.tid))}
                    className="text-blue-600 hover:underline"
                  >
                    {term.name}
                  </Link>
                </TableCell>
                <TableCell>
                  {term.status ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {t('taxonomy.statusPublished', 'Published')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                      {t('taxonomy.statusUnpublished', 'Unpublished')}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      to={adminRoutes.taxonomyTermEdit
                        .replace(':vid', vid)
                        .replace(':tid', String(term.tid))}
                    >
                      {t('common.edit', 'Edit')}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isDirty && (
        <div className="flex justify-end">
          <Button
            type="button"
            disabled={reorderTerms.isPending}
            onClick={onSave}
            className="bg-[#0d0e0e] text-white rounded-lg disabled:opacity-50"
          >
            {reorderTerms.isPending ? t('taxonomy.saving', 'Saving…') : t('taxonomy.save', 'Save')}
          </Button>
        </div>
      )}
    </div>
  );
};
