import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminActivity } from '../hooks';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 25;

const actionColorMap: Record<string, string> = {
  create: 'bg-green-500',
  update: 'bg-blue-500',
  delete: 'bg-red-500',
  login: 'bg-purple-500',
  impersonate: 'bg-amber-500',
};

function getActionColor(action: string): string {
  const key = Object.keys(actionColorMap).find((k) =>
    action.toLowerCase().includes(k)
  );
  return key ? actionColorMap[key] : 'bg-gray-400';
}

export const AdminActivityPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminActivity({ page, limit: PAGE_SIZE });

  const entries = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.total ? Math.ceil(meta.total / PAGE_SIZE) : 1;

  const formatTimestamp = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString('da-DK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {t('activity.title', 'Activity')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('activity.description', 'Admin activity log')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('activity.log', 'Log')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-gray-400">
              {t('common.loading', 'Loading...')}
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              {t('activity.noEntries', 'No activity entries')}
            </div>
          ) : (
            <>
              <div className="space-y-0">
                {entries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="relative flex items-start gap-3 sm:gap-4 py-4 border-b border-gray-100 last:border-b-0"
                  >
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${getActionColor(entry.action)}`}
                      />
                      {idx < entries.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 mt-1" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <span className="text-xs text-gray-400 tabular-nums whitespace-nowrap">
                          {formatTimestamp(entry.createdAt)}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {entry.adminName}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-0.5">
                        {entry.action}
                      </p>
                      {(entry.targetType || entry.targetId) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {entry.targetType}
                          {entry.targetId ? ` #${entry.targetId}` : ''}
                        </p>
                      )}
                      {entry.details && Object.keys(entry.details).length > 0 && (
                        <div className="mt-1.5 text-xs text-gray-400 bg-gray-50 rounded px-2 py-1 inline-block">
                          {Object.entries(entry.details).map(([key, val]) => (
                            <span key={key} className="mr-3">
                              <span className="font-medium">{key}:</span>{' '}
                              {String(val)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
