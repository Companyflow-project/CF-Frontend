import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/page-shell';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { quizzesApi } from '../api';

interface EditQuestion { question: string; options: string[]; correctIndex: number; }

export const QuizBuilderPage: React.FC = () => {
  const { nid } = useParams<{ nid: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('handbook');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const isOwner = user?.role === 'account_owner' || user?.role === 'administrator';

  const [title, setTitle] = useState('');
  const [passMark, setPassMark] = useState(70);
  const [questions, setQuestions] = useState<EditQuestion[]>([{ question: '', options: ['', ''], correctIndex: 0 }]);
  const [existing, setExisting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!nid) return;
    quizzesApi
      .getForManage(Number(nid))
      .then((quiz) => {
        if (quiz) {
          setExisting(true);
          setTitle(quiz.title ?? '');
          setPassMark(quiz.passMark);
          setQuestions(quiz.questions.map((q) => ({ question: q.question, options: q.options.length ? q.options : ['', ''], correctIndex: q.correctIndex ?? 0 })));
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [nid]);

  const updateQuestion = (qi: number, patch: Partial<EditQuestion>) =>
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, ...patch } : q)));

  const updateOption = (qi: number, oi: number, value: string) =>
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? value : o)) } : q)));

  const addQuestion = () => setQuestions((qs) => [...qs, { question: '', options: ['', ''], correctIndex: 0 }]);
  const removeQuestion = (qi: number) => setQuestions((qs) => qs.filter((_, i) => i !== qi));
  const addOption = (qi: number) => setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, options: [...q.options, ''] } : q)));

  const handleSave = async () => {
    if (!nid) return;
    // Basic client validation mirrors the server rules.
    const clean = questions.map((q) => ({
      question: q.question.trim(),
      options: q.options.map((o) => o.trim()).filter((o) => o !== ''),
      correctIndex: q.correctIndex,
    }));
    for (const q of clean) {
      if (!q.question || q.options.length < 2 || q.correctIndex >= q.options.length) {
        toast.error(t('quiz.saveError'));
        return;
      }
    }
    setSaving(true);
    try {
      await quizzesApi.save({ nid: Number(nid), title: title.trim() || undefined, passMark, questions: clean });
      toast.success(t('quiz.saved'));
      setExisting(true);
    } catch {
      toast.error(t('quiz.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!nid || !existing) return;
    if (!window.confirm(t('quiz.deleteConfirm'))) return;
    try {
      const quiz = await quizzesApi.getForManage(Number(nid));
      if (quiz) {
        await quizzesApi.remove(quiz.id);
        toast.success(t('quiz.deleted'));
        navigate(-1);
      }
    } catch {
      toast.error(t('quiz.saveError'));
    }
  };

  const inputCls = 'bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-sm';

  return (
    <PageShell>
      <PageHeader
        title={t('quiz.builderTitle')}
        description={t('quiz.builderSubtitle')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>{tCommon('back')}</Button>
            {existing && isOwner && (
              <Button variant="outline" onClick={() => navigate(`/handbook/pages/${nid}/quiz/results`)}>
                <BarChart3 className="h-4 w-4 mr-2" />{t('quiz.viewResults')}
              </Button>
            )}
          </div>
        }
      />
      {loading ? (
        <p className="text-sm text-[#6b7280]">…</p>
      ) : (
        <div className="max-w-[720px] flex flex-col gap-5">
          <Card>
            <CardContent className="pt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>{t('quiz.quizTitle')}</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
              </div>
              <div className="flex flex-col gap-2 max-w-[200px]">
                <Label>{t('quiz.passMark')}</Label>
                <Input type="number" min={0} max={100} value={passMark} onChange={(e) => setPassMark(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))} className={inputCls} />
              </div>
            </CardContent>
          </Card>

          {questions.map((q, qi) => (
            <Card key={qi}>
              <CardContent className="pt-6 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <Label className="mt-2">{t('quiz.question')} {qi + 1}</Label>
                  {questions.length > 1 && (
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => removeQuestion(qi)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Input value={q.question} onChange={(e) => updateQuestion(qi, { question: e.target.value })} className={inputCls} />
                <div className="flex flex-col gap-2 mt-1">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={q.correctIndex === oi}
                        onChange={() => updateQuestion(qi, { correctIndex: oi })}
                        title={t('quiz.correct')}
                      />
                      <Input value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} placeholder={`${t('quiz.option')} ${oi + 1}`} className={`${inputCls} flex-1`} />
                    </label>
                  ))}
                  <div>
                    <Button variant="ghost" size="sm" onClick={() => addOption(qi)}>
                      <Plus className="h-4 w-4 mr-1" />{t('quiz.addOption')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-1" />{t('quiz.addQuestion')}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#1a5948] hover:bg-[#143e33] text-white">
              {saving ? t('quiz.saving') : t('quiz.save')}
            </Button>
            {existing && (
              <Button variant="outline" onClick={handleDelete} className="border-red-200 text-red-600 hover:bg-red-50">
                {t('quiz.delete')}
              </Button>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
};
