import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAdminHandbookPage, useDeleteAdminHandbookPage } from '../../handbook-hooks';
import { adminRoutes } from '../../routes';

interface Props {
  nid: number;
  langcode?: string;
}

export const AdminHandbookDeleteTab: React.FC<Props> = ({ nid, langcode }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('admin');
  const { data: page } = useAdminHandbookPage(nid, langcode);
  const deletePage = useDeleteAdminHandbookPage();

  const title = page?.title ?? `page #${nid}`;

  const handleDelete = async () => {
    try {
      await deletePage.mutateAsync(nid);
      toast.success(t('handbook.edit.deleted', 'Page deleted'));
      navigate(adminRoutes.handbook);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('handbook.edit.deleteFailed', 'Failed to delete page'));
    }
  };

  const handleCancel = () => {
    navigate(adminRoutes.handbookPageTab.replace(':nid', String(nid)).replace(':tab', 'edit'));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[#0d0e0e]">
        {t('handbook.delete.heading', 'Are you sure you want to delete the content element {{title}}?', { title })}
      </h2>

      <div className="rounded-xl border border-gray-200 bg-[#fbfaee] p-5 sm:p-6">
        <p className="text-sm text-gray-700 mb-4">
          {t('handbook.delete.cannotUndo', 'This action cannot be undone.')}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={handleDelete}
            disabled={deletePage.isPending}
          >
            {deletePage.isPending ? t('handbook.common.deleting', 'Deleting…') : t('handbook.common.delete', 'Delete')}
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={deletePage.isPending}>
            {t('handbook.common.cancel', 'Cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
};
