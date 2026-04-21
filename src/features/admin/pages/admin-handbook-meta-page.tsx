import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { adminRoutes } from '../routes';
import {
  useAdminHandbookPage,
  useAdminHandbookMetaTags,
  useUpdateAdminHandbookMetaTags,
} from '../handbook-hooks';
import type { AdminHandbookMetaTags } from '../handbook-types';
import { META_SECTIONS, type MetaField } from '../components/handbook/meta-field-config';

export const AdminHandbookMetaPage: React.FC = () => {
  const { nid: nidParam } = useParams<{ nid: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('admin');
  const nid = Number(nidParam);

  const { data: page } = useAdminHandbookPage(Number.isFinite(nid) ? nid : null);
  const { data: remote, isLoading } = useAdminHandbookMetaTags(Number.isFinite(nid) ? nid : null);
  const updateMeta = useUpdateAdminHandbookMetaTags();

  const [form, setForm] = useState<AdminHandbookMetaTags>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ 'Basic tags': true, 'Open Graph': true });

  useEffect(() => {
    if (remote) setForm(remote);
  }, [remote]);

  const knownKeys = useMemo(() => new Set<string>(META_SECTIONS.flatMap(s => s.fields.map(f => f.key))), []);
  const extraKeys = useMemo(
    () => Object.keys(form).filter(k => !knownKeys.has(k)).sort(),
    [form, knownKeys]
  );

  if (!Number.isFinite(nid) || nid <= 0) {
    return <div className="p-6 text-sm text-gray-500">Invalid page id</div>;
  }

  const set = (key: string, v: string) =>
    setForm(prev => ({ ...prev, [key]: v }));

  const handleSave = async () => {
    try {
      await updateMeta.mutateAsync({ nid, payload: form });
      toast.success(t('handbook.meta.saved', 'Meta tags saved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('handbook.meta.saveFailed', 'Failed to save meta tags'));
    }
  };

  const renderField = (field: MetaField) => {
    const value = form[field.key] ?? '';
    return (
      <div key={field.key} className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-4 py-3 border-b border-gray-100 last:border-0">
        <label className="text-sm font-medium text-[#0d0e0e] pt-2" htmlFor={`meta-${field.key}`}>
          {field.label}
        </label>
        <div>
          {field.widget === 'textarea' ? (
            <Textarea
              id={`meta-${field.key}`}
              value={value}
              placeholder={field.placeholder}
              onChange={(e) => set(field.key, e.target.value)}
              rows={2}
            />
          ) : (
            <Input
              id={`meta-${field.key}`}
              value={value}
              placeholder={field.placeholder}
              onChange={(e) => set(field.key, e.target.value)}
            />
          )}
          {field.hint && <div className="text-xs text-gray-500 mt-1">{field.hint}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div>
        <div className="text-sm text-gray-500">
          <Link to={adminRoutes.dashboard} className="hover:underline">{t('nav.console', 'Console')}</Link>
          {' › '}
          <Link to={adminRoutes.handbook} className="hover:underline">{t('handbook.title', 'Management Handbook')}</Link>
          {' › '}
          <Link to={adminRoutes.handbookPageTab.replace(':nid', String(nid)).replace(':tab', 'edit')} className="hover:underline">{t('handbook.meta.breadcrumbHelpEdit', 'Help Edit')}</Link>
          {' › '}
          <span className="text-gray-700">{t('handbook.meta.title', 'Meta Tags')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0d0e0e] mt-1">{t('handbook.meta.title', 'Meta Tags')}</h1>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500">{t('handbook.common.loading', 'Loading…')}</div>
      ) : (
        <div className="border border-gray-200 rounded-xl bg-white p-4 sm:p-6 space-y-4">
          <p className="text-sm text-gray-600">
            {t('handbook.meta.intro', 'Configure the meta tags below. Use tokens to avoid redundant meta data and search engine penalization.')}
          </p>

          {META_SECTIONS.map(section => {
            const open = openSections[section.title] ?? true;
            return (
              <section key={section.title} className="border border-gray-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => setOpenSections(prev => ({ ...prev, [section.title]: !open }))}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-[#0d0e0e]"
                >
                  <span className={`inline-block transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
                  {section.title}
                </button>
                {open && (
                  <div className="px-4 pb-4 space-y-1">
                    {section.description && <p className="text-xs text-gray-500 mb-2">{section.description}</p>}
                    {section.fields.map(renderField)}
                  </div>
                )}
              </section>
            );
          })}

          {extraKeys.length > 0 && (
            <section className="border border-gray-200 rounded-lg">
              <div className="px-4 py-3 text-sm font-semibold text-[#0d0e0e] border-b border-gray-100">
                {t('handbook.meta.otherKeys', 'Other stored keys')}
              </div>
              <div className="px-4 pb-4 pt-2 space-y-1">
                {extraKeys.map(key => renderField({ key, label: key }))}
              </div>
            </section>
          )}

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button variant="outline" onClick={() => navigate(adminRoutes.handbookPageTab.replace(':nid', String(nid)).replace(':tab', 'edit'))}>
              {t('handbook.common.cancel', 'Cancel')}
            </Button>
            <Button
              className="bg-[#0d0e0e] text-white hover:bg-[#0d0e0e]/90"
              onClick={handleSave}
              disabled={updateMeta.isPending}
            >
              {updateMeta.isPending ? t('handbook.common.saving', 'Saving…') : t('handbook.common.save', 'Save')}
            </Button>
          </div>
        </div>
      )}

      {page && (
        <div className="text-xs text-gray-500 text-right">Editing: {page.title}</div>
      )}
    </div>
  );
};
