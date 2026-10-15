import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { handbookRoutes } from '../routes';
import { handbookApi } from '../api';

export const AddThemePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('handbook');
  const [chapterName, setChapterName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterName.trim()) {
      setError(t('addTheme.errorNoName'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const name = chapterName.trim();
      const response = await handbookApi.createPage({
        title: name,
        newChapterName: name,
      });
      navigate(handbookRoutes.editPage(response.id));
    } catch (err: any) {
      console.error('Failed to create theme:', err);
      setError(t('addTheme.errorFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title={t('addTheme.title')}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(handbookRoutes.pages)}
            className="gap-2 rounded-[8px]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common:back')}
          </Button>
        }
      />

      <div className="max-w-md mt-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="theme-name" className="text-sm font-medium text-[#0d0e0e]">
              {t('addTheme.nameLabel')}
            </Label>
            <Input
              id="theme-name"
              type="text"
              value={chapterName}
              onChange={(e) => {
                setChapterName(e.target.value);
                setError(null);
              }}
              placeholder={t('addTheme.namePlaceholder')}
              className="h-10 rounded-[8px] border-[#e5e7eb]"
              disabled={isSubmitting}
              autoFocus
            />
            <p className="text-xs text-[#7b8a85]">
              {t('addTheme.description')}
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-[8px] p-3">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(handbookRoutes.pages)}
              disabled={isSubmitting}
              className="rounded-[8px]"
            >
              {t('common:cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[8px]"
              style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
            >
              {isSubmitting ? t('addTheme.creating') : t('addTheme.create')}
            </Button>
          </div>
        </form>
      </div>
    </PageShell>
  );
};
