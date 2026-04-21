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

  const handleDelete = async () => {
    if (!confirm(t('handbook.delete.confirm', 'Are you sure you want to delete this page? This cannot be undone.'))) return;
    try {
      await deletePage.mutateAsync(nid);
      toast.success(t('handbook.edit.deleted', 'Page deleted'));
      navigate(adminRoutes.handbook);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('handbook.edit.deleteFailed', 'Failed to delete page'));
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-red-600">{t('handbook.delete.title', 'Delete page')}</h2>
      <p className="text-sm text-gray-700">
        {t('handbook.delete.warning', 'You are about to delete {{title}}. This action removes the page from its book and unpublishes the node.', { title: page?.title ?? `page #${nid}` })}
      </p>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={() => navigate(adminRoutes.handbookPageTab.replace(':nid', String(nid)).replace(':tab', 'edit'))}>
          {t('handbook.common.cancel', 'Cancel')}
        </Button>
        <Button
          className="bg-red-600 text-white hover:bg-red-700"
          onClick={handleDelete}
          disabled={deletePage.isPending}
        >
          {deletePage.isPending ? t('handbook.common.deleting', 'Deleting…') : t('handbook.delete.button', 'Delete page')}
        </Button>
      </div>
    </div>
  );
};
