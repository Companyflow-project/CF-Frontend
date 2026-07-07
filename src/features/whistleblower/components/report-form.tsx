import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SubmitPayload } from '../api';

interface Props {
  categories: string[];
  onSubmit: (payload: SubmitPayload, file: File | null) => Promise<void>;
  submitting: boolean;
  disabled?: boolean;
}

/** Shared report form used by the public page and the in-app "report a concern" page. */
export const ReportForm: React.FC<Props> = ({ categories, onSubmit, submitting, disabled }) => {
  const { t } = useTranslation('whistleblower');
  const [category, setCategory] = useState(categories[0] ?? 'other');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    await onSubmit(
      {
        category,
        message: message.trim(),
        isAnonymous: anonymous,
        reporterName: anonymous ? undefined : name.trim() || undefined,
        reporterEmail: anonymous ? undefined : email.trim() || undefined,
      },
      file,
    );
  };

  const inputCls = 'bg-[#f2f2f2] rounded-[7px] p-3 text-[15px] text-[#373b3b] border-0 focus-visible:ring-0 h-auto w-full';

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>{t('report.category')}</Label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-[#f2f2f2] rounded-[7px] p-3 text-[15px] text-[#373b3b] border-0">
          {categories.map((c) => (
            <option key={c} value={c}>{t(`cat.${c}`, c)}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label>{t('report.message')}</Label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className={inputCls} />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="w-4 h-4" />
        <span className="text-sm text-[#0d0e0e]">{t('report.anonymous')}</span>
      </label>
      <p className="text-xs text-[#6b7280] -mt-2">{t('report.anonymousHelp')}</p>
      {!anonymous && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2"><Label>{t('report.name')}</Label><Input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></div>
          <div className="flex flex-col gap-2"><Label>{t('report.email')}</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></div>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label>{t('report.attach')}</Label>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
      </div>
      <div>
        <Button type="submit" disabled={submitting || disabled || !message.trim()} className="bg-[#1a5948] hover:bg-[#143e33] text-white font-medium rounded-[12px] px-6 py-2.5 h-auto disabled:opacity-40">
          {submitting ? t('report.submitting') : t('report.submit')}
        </Button>
      </div>
    </form>
  );
};
