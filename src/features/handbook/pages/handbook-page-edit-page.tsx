import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { HandbookPageEditor } from '../components/handbook-page-editor';
import { useHandbookLang } from '../components/language-toggle';
import { useTranslation } from 'react-i18next';
import { handbookRoutes } from '../routes';
import { handbookApi } from '../api';

export const HandbookPageEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('handbook');
  const { id } = useParams<{ id: string }>();
  const [pageTitle, setPageTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [lang] = useHandbookLang();

  const pageId = id ? Number.parseInt(id, 10) : NaN;

  useEffect(() => {
    const fetchPageTitle = async () => {
      if (!pageId || Number.isNaN(pageId)) return;

      try {
        setLoading(true);
        const pageDetail = await handbookApi.getPageDetail(pageId, lang);
        if (pageDetail) {
          setPageTitle(pageDetail.title);
        }
      } catch (err) {
        console.error('Failed to fetch page title:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPageTitle();
  }, [pageId, lang]);

  if (!id || Number.isNaN(pageId)) {
    return (
      <PageShell>
        <div className="py-8">
          <p className="text-sm text-red-500">{t('editPage.invalidId')}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate(handbookRoutes.pages)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('editPage.backToPages')}
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(handbookRoutes.pages)}
            className="border-[#e5e7eb] text-[#0d0e0e] rounded-[8px] px-3 py-2 h-auto gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common:back')}
          </Button>
          <h1 className="text-2xl font-bold text-[#0d0e0e]">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('editPage.loading')}
              </span>
            ) : (
              pageTitle ? t('editPage.title', { title: pageTitle }) : t('editPage.titleFallback')
            )}
          </h1>
        </div>
      </div>

      <HandbookPageEditor
        pageId={pageId}
        lang={lang}
        onSave={() => navigate(handbookRoutes.pages)}
        onCancel={() => navigate(handbookRoutes.pages)}
      />
    </PageShell>
  );
};

