import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { handbookRoutes } from '../routes';
import { handbookApi, type HandbookChapterInfo } from '../api';

type Lang = 'da' | 'en';

/** Rename a theme (chapter) of the company's own handbook, in Danish and English. */
export const EditThemePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('handbook');
  const chapterId = Number(id);
  const validId = Number.isInteger(chapterId) && chapterId > 0;

  const [chapter, setChapter] = useState<HandbookChapterInfo | null>(null);
  const [names, setNames] = useState<Record<Lang, string>>({ da: '', en: '' });
  const [loading, setLoading] = useState(validId);
  const [loadError, setLoadError] = useState<string | null>(validId ? null : t('editTheme.invalidId'));
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!validId) return;
    let cancelled = false;
    setLoading(true);
    handbookApi
      .getChapter(chapterId)
      .then((info) => {
        if (cancelled) return;
        setChapter(info);
        setNames({ da: info.titles.da ?? '', en: info.titles.en ?? '' });
      })
      .catch((err: any) => {
        if (cancelled) return;
        console.error('Failed to load theme:', err);
        setLoadError(t('editTheme.notFound'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [chapterId, validId, t]);

  // Back to "Vis alle sider" with this theme open.
  const backToPages = () => navigate(validId ? `${handbookRoutes.pages}?theme=${chapterId}` : handbookRoutes.pages);

  // Only languages the theme has a name in (without an English name the handbook shows the Danish one),
  // the current UI language first.
  const currentLang: Lang = i18n.language?.startsWith('en') ? 'en' : 'da';
  const langs = (['da', 'en'] as const)
    .filter((lang) => chapter?.titles[lang] != null)
    .sort((a, b) => (a === currentLang ? -1 : b === currentLang ? 1 : 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapter || !chapter.renamable) return;
    if (langs.some((lang) => !names[lang].trim())) {
      setFormError(t('editTheme.errorNoName'));
      return;
    }
    const titles: Partial<Record<Lang, string>> = {};
    langs.forEach((lang) => {
      const name = names[lang].trim();
      if (name !== chapter.titles[lang]) titles[lang] = name;
    });
    if (Object.keys(titles).length === 0) {
      backToPages();
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      await handbookApi.renameChapter(chapter.id, titles);
      toast.success(t('editTheme.saved'));
      backToPages();
    } catch (err: any) {
      console.error('Failed to rename theme:', err);
      const status = err?.response?.status;
      setFormError(
        status === 403 ? t('editTheme.notRenamable') : status === 404 ? t('editTheme.notFound') : t('editTheme.errorFailed')
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title={t('editTheme.title')}
        actions={
          <Button variant="outline" size="sm" onClick={backToPages} className="gap-2 rounded-[8px]">
            <ArrowLeft className="h-4 w-4" />
            {t('editTheme.backToPages')}
          </Button>
        }
      />

      <div className="max-w-md mt-8">
        {loading ? (
          <p className="text-sm text-[#7b8a85]">{t('editTheme.loading')}</p>
        ) : loadError || !chapter ? (
          <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-[8px] p-3">
            {loadError || t('editTheme.notFound')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {!chapter.renamable && (
              <div className="text-sm text-[#92400e] bg-[#fffbf0] border-l-4 border-[#f59e0b] rounded-[8px] p-3">
                {t('editTheme.notRenamable')}
              </div>
            )}

            {langs.map((lang, index) => (
              <div className="space-y-2" key={lang}>
                <Label htmlFor={`theme-name-${lang}`} className="text-sm font-medium text-[#0d0e0e]">
                  {lang === 'da' ? t('editTheme.nameDa') : t('editTheme.nameEn')}
                </Label>
                <Input
                  id={`theme-name-${lang}`}
                  type="text"
                  value={names[lang]}
                  maxLength={255}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNames((prev) => ({ ...prev, [lang]: value }));
                    setFormError(null);
                  }}
                  className="h-10 rounded-[8px] border-[#e5e7eb]"
                  disabled={isSaving || !chapter.renamable}
                  autoFocus={index === 0}
                />
              </div>
            ))}
            <p className="text-xs text-[#7b8a85]">{t('editTheme.description')}</p>

            {formError && (
              <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-[8px] p-3">
                {formError}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={backToPages}
                disabled={isSaving}
                className="rounded-[8px]"
              >
                {t('common:cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !chapter.renamable}
                className="rounded-[8px]"
                style={{ backgroundColor: 'var(--cf-primary-btn, #3d997d)', color: 'var(--cf-primary-btn-text, #ffffff)' }}
              >
                {isSaving ? t('editTheme.saving') : t('editTheme.save')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </PageShell>
  );
};
