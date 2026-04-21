import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAdminHandbookPage, useAdminHandbookBookTree } from '../../handbook-hooks';
import { adminRoutes } from '../../routes';
import type { AdminHandbookTreeNode } from '../../handbook-types';

interface Props {
  nid: number;
  langcode?: string;
}

function TreeList({ nodes }: { nodes: AdminHandbookTreeNode[] }) {
  return (
    <ul className="text-sm">
      {nodes.map(n => (
        <li key={n.nid} className="py-0.5">
          <span className="text-gray-500 mr-1">·</span>
          <Link
            to={adminRoutes.handbookPage.replace(':nid', String(n.nid))}
            className="text-[#0d0e0e] hover:underline"
          >
            {n.title}
          </Link>
          {n.children.length > 0 && (
            <div className="pl-5 border-l border-gray-100 ml-1 mt-0.5">
              <TreeList nodes={n.children} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export const AdminHandbookPreviewTab: React.FC<Props> = ({ nid, langcode }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('admin');
  const { data: page, isLoading } = useAdminHandbookPage(nid, langcode);
  const { data: tree = [] } = useAdminHandbookBookTree(page?.bid ?? null, langcode);

  if (isLoading || !page) return <div className="text-sm text-gray-500">{t('handbook.common.loading', 'Loading…')}</div>;

  return (
    <div className="space-y-6">
      <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-[#0d0e0e] mb-3">{page.title}</h2>
        <div
          className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: page.body || `<p class="text-gray-400">${t('handbook.preview.noContent', 'No content yet.')}</p>` }}
        />
        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90"
            onClick={() => navigate(adminRoutes.handbookPageTab.replace(':nid', String(nid)).replace(':tab', 'edit'))}
          >
            {t('handbook.tabs.edit', 'Edit')}
          </Button>
        </div>
      </div>

      {tree.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-[#0d0e0e] mb-3">{t('handbook.preview.bookStructure', 'Book structure')}</h3>
          <TreeList nodes={tree} />
        </div>
      )}
    </div>
  );
};
