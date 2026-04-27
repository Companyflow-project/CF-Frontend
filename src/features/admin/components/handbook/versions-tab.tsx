import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  useAdminHandbookVersions,
  useAdminHandbookPage,
  useDeleteAdminHandbookVersion,
  useRestoreAdminHandbookVersion,
} from '../../handbook-hooks';

interface Props {
  nid: number;
  langcode?: string;
}

function formatTimestamp(unix: number): string {
  if (!unix) return '—';
  const d = new Date(unix * 1000);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} – ${hour}:${minute}`;
}

export const AdminHandbookVersionsTab: React.FC<Props> = ({ nid, langcode }) => {
  const { t } = useTranslation('admin');
  const { data: versions = [], isLoading } = useAdminHandbookVersions(nid);
  const { data: page } = useAdminHandbookPage(nid, langcode);
  const deleteVersion = useDeleteAdminHandbookVersion();
  const restoreVersion = useRestoreAdminHandbookVersion();

  if (isLoading) return <div className="text-sm text-gray-500">{t('handbook.common.loading', 'Loading…')}</div>;

  if (versions.length === 0) {
    return <div className="text-sm text-gray-500">{t('handbook.versions.empty', 'No revision history available for this page.')}</div>;
  }

  const handleDelete = async (vid: number) => {
    if (!confirm(t('handbook.versions.deleteConfirm', 'Delete this version? This cannot be undone.'))) return;
    try {
      await deleteVersion.mutateAsync({ nid, vid });
      toast.success(t('handbook.versions.deleted', 'Version deleted'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('handbook.versions.deleteFailed', 'Failed to delete version'));
    }
  };

  const handleRestore = async (vid: number) => {
    if (!confirm(t('handbook.versions.restoreConfirm', 'Restore this version? The current content will be replaced.'))) return;
    try {
      await restoreVersion.mutateAsync({ nid, vid });
      toast.success(t('handbook.versions.restored', 'Version restored'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('handbook.versions.restoreFailed', 'Failed to restore version'));
    }
  };

  const title = page?.title ?? `page #${nid}`;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#0d0e0e]">
        {t('handbook.versions.heading', 'Versions of the {{title}}', { title })}
      </h2>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="text-left py-3 px-4 font-semibold">{t('handbook.versions.columnVersion', 'Version')}</th>
              <th className="text-left py-3 px-4 font-semibold">{t('handbook.versions.columnActions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((v) => {
              const isCurrent = v.isCurrent;
              const pending =
                (deleteVersion.isPending && deleteVersion.variables?.vid === v.vid) ||
                (restoreVersion.isPending && restoreVersion.variables?.vid === v.vid);
              return (
                <tr
                  key={v.vid}
                  className={`border-t border-gray-100 ${isCurrent ? 'bg-[#fbfaee]' : ''}`}
                >
                  <td className="py-3 px-4">
                    <span className="text-blue-600 font-medium">
                      {formatTimestamp(v.changed)}
                    </span>
                    {v.authorName && (
                      <span className="text-gray-600"> {t('handbook.versions.by', 'by')} </span>
                    )}
                    {v.authorName && (
                      <span className="text-blue-600 font-medium">{v.authorName}</span>
                    )}
                    {v.logMessage && (
                      <div className="text-xs text-gray-500 mt-1 truncate max-w-xl">{v.logMessage}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {isCurrent ? (
                      <span className="text-sm text-gray-500">
                        {t('handbook.versions.currentVersion', 'Current version')}
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                          disabled={pending}
                          onClick={() => handleDelete(v.vid)}
                        >
                          {t('handbook.common.delete', 'Delete')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          disabled={pending}
                          onClick={() => handleRestore(v.vid)}
                        >
                          {t('handbook.versions.restore', 'Restore')}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
