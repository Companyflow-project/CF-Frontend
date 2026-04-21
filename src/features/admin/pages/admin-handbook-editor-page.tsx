import React from 'react';
import { useParams, Navigate, useSearchParams } from 'react-router-dom';
import { AdminHandbookPageEditorLayout, type HandbookTab } from '../components/handbook/page-editor-layout';
import { AdminHandbookPreviewTab } from '../components/handbook/preview-tab';
import { AdminHandbookEditTab } from '../components/handbook/edit-tab';
import { AdminHandbookLixTab } from '../components/handbook/lix-tab';
import { AdminHandbookTocTab } from '../components/handbook/toc-tab';
import { AdminHandbookVersionsTab } from '../components/handbook/versions-tab';
import { AdminHandbookTranslateTab } from '../components/handbook/translate-tab';
import { AdminHandbookDeleteTab } from '../components/handbook/delete-tab';
import { useAdminHandbookPage } from '../handbook-hooks';

const VALID_TABS: HandbookTab[] = ['preview', 'edit', 'lix', 'toc', 'delete', 'versions', 'translate'];
const SUPPORTED_LANGS = new Set(['da', 'en']);

export const AdminHandbookEditorPage: React.FC = () => {
  const params = useParams<{ nid: string; tab?: string }>();
  const [search] = useSearchParams();
  const nid = Number(params.nid);
  const tab = (params.tab ?? 'preview') as HandbookTab;

  const rawLang = search.get('lang') ?? 'da';
  const langcode = SUPPORTED_LANGS.has(rawLang) ? rawLang : 'da';

  const { data: page } = useAdminHandbookPage(Number.isFinite(nid) && nid > 0 ? nid : null, langcode);

  if (!Number.isFinite(nid) || nid <= 0) return <Navigate to="/admin/handbook" replace />;
  if (!VALID_TABS.includes(tab)) return <Navigate to={`/admin/handbook/pages/${nid}/preview`} replace />;

  const renderTab = () => {
    switch (tab) {
      case 'preview': return <AdminHandbookPreviewTab nid={nid} langcode={langcode} />;
      case 'edit': return <AdminHandbookEditTab nid={nid} langcode={langcode} />;
      case 'lix': return <AdminHandbookLixTab nid={nid} langcode={langcode} />;
      case 'toc': return <AdminHandbookTocTab nid={nid} langcode={langcode} />;
      case 'versions': return <AdminHandbookVersionsTab nid={nid} />;
      case 'translate': return <AdminHandbookTranslateTab nid={nid} langcode={langcode} />;
      case 'delete': return <AdminHandbookDeleteTab nid={nid} langcode={langcode} />;
    }
  };

  return (
    <AdminHandbookPageEditorLayout nid={nid} bookTitle={page?.title ?? ''} activeTab={tab} langcode={langcode}>
      {renderTab()}
    </AdminHandbookPageEditorLayout>
  );
};
