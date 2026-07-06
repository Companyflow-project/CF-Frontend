import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { isAdminRole } from '@/lib/utils';
import { quizzesApi, Quiz, QuizStatus, QuizAttemptResult } from '../api';

/**
 * CF-21: renders on a handbook page in the viewer. Admins see a "Manage quiz"
 * button; employees see the quiz to take (or their passed state). Grading is
 * server-side.
 */
export const PageQuiz: React.FC<{ nid: number }> = ({ nid }) => {
  const { t } = useTranslation('handbook');
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [status, setStatus] = useState<QuizStatus | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizAttemptResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    setQuiz(null);
    setStatus(null);
    setAnswers({});
    setResult(null);
    // Admins manage rather than take; skip the take-fetch for them.
    if (isAdmin) return;
    quizzesApi
      .getForPage(nid)
      .then((d) => { if (!cancelled) { setQuiz(d.quiz); setStatus(d.status); } })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [nid, isAdmin]);

  if (isAdmin) {
    return (
      <div className="mt-8 pt-4 border-t border-[#f0f0f0]">
        <Button variant="outline" size="sm" onClick={() => navigate(`/handbook/pages/${nid}/quiz`)}>
          {t('quiz.manageCta')}
        </Button>
      </div>
    );
  }

  if (!quiz) return null;

  const submit = async () => {
    if (Object.keys(answers).length < quiz.questions.length) {
      toast.error(t('quiz.answerAll'));
      return;
    }
    const ordered = quiz.questions.map((q, i) => answers[q.id ?? i]);
    setSubmitting(true);
    try {
      const r = await quizzesApi.attempt(quiz.id, ordered);
      setResult(r);
      setStatus({ attempted: true, passed: r.passed, bestScore: r.score });
    } catch {
      toast.error(t('quiz.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const alreadyPassed = status?.passed && !result;

  return (
    <div className="mt-8 pt-4 border-t border-[#f0f0f0]">
      <h3 className="text-lg font-semibold mb-1">{quiz.title || t('quiz.takeTitle')}</h3>
      {alreadyPassed ? (
        <p className="text-sm text-[#1a5948]">{t('quiz.alreadyPassed', { score: status?.bestScore ?? 0 })}</p>
      ) : result ? (
        <div className="flex flex-col gap-3">
          <p className={`text-sm font-medium ${result.passed ? 'text-[#1a5948]' : 'text-red-600'}`}>
            {result.passed
              ? t('quiz.passed', { score: result.score })
              : t('quiz.failed', { score: result.score, passMark: result.passMark })}
          </p>
          {!result.passed && (
            <div>
              <Button size="sm" variant="outline" onClick={() => { setResult(null); setAnswers({}); }}>
                {t('quiz.retry')}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">{t('quiz.takePrompt')}</p>
          {quiz.questions.map((q, qi) => {
            const key = q.id ?? qi;
            return (
              <div key={key} className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-[#0d0e0e]">{qi + 1}. {q.question}</p>
                {q.options.map((opt, oi) => (
                  <label key={oi} className="flex items-center gap-2 text-sm">
                    <input type="radio" name={`q-${key}`} checked={answers[key] === oi} onChange={() => setAnswers((a) => ({ ...a, [key]: oi }))} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            );
          })}
          <div>
            <Button onClick={submit} disabled={submitting} className="bg-[#1a5948] hover:bg-[#143e33] text-white">
              {submitting ? t('quiz.submitting') : t('quiz.submit')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
