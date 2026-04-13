import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAdminSubscriptions } from '../hooks';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  expiring: 'bg-amber-100 text-amber-800 border-amber-200',
  expired: 'bg-red-100 text-red-800 border-red-200',
};

export const AdminSubscriptionsPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminSubscriptions({ page, limit: PAGE_SIZE });

  const subscriptions = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.total ? Math.ceil(meta.total / PAGE_SIZE) : 1;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('da-DK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {t('subscriptions.title', 'Subscriptions')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('subscriptions.description', 'Active customer subscriptions')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('subscriptions.overview', 'Overview')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-gray-400">
              {t('common.loading', 'Loading...')}
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              {t('subscriptions.noResults', 'No subscriptions found')}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('subscriptions.columns.company', 'Company')}</TableHead>
                    <TableHead>{t('subscriptions.columns.product', 'Product')}</TableHead>
                    <TableHead>{t('subscriptions.columns.start', 'Start')}</TableHead>
                    <TableHead>{t('subscriptions.columns.end', 'End')}</TableHead>
                    <TableHead className="text-right">
                      {t('subscriptions.columns.daysLeft', 'Days left')}
                    </TableHead>
                    <TableHead className="text-right">
                      {t('subscriptions.columns.licenses', 'Licenses')}
                    </TableHead>
                    <TableHead className="text-right">
                      {t('subscriptions.columns.sms', 'SMS')}
                    </TableHead>
                    <TableHead>{t('subscriptions.columns.status', 'Status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.companyId}>
                      <TableCell className="font-medium">
                        {sub.companyName}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {sub.productName ?? '-'}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {formatDate(sub.subscriptionStart)}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {formatDate(sub.subscriptionEnd)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {sub.daysRemaining !== null ? (
                          <span
                            className={
                              sub.daysRemaining <= 0
                                ? 'text-red-600 font-semibold'
                                : sub.daysRemaining <= 30
                                  ? 'text-amber-600 font-semibold'
                                  : 'text-gray-900'
                            }
                          >
                            {sub.daysRemaining}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-gray-700">
                        <span className="font-medium">{sub.licensesUsed}</span>
                        <span className="text-gray-400"> / {sub.licensesTotal}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-gray-700">
                        <span className="font-medium">{sub.smsUsed}</span>
                        <span className="text-gray-400">
                          {' '}
                          / {sub.smsCreditsTotal}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[sub.status] ?? ''}>
                          {t(`subscriptions.status.${sub.status}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  {t('common.pagination', {
                    from: (page - 1) * PAGE_SIZE + 1,
                    to: Math.min(page * PAGE_SIZE, meta?.total ?? 0),
                    total: meta?.total ?? 0,
                  })}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
