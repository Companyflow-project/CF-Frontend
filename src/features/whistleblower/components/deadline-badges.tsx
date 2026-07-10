import React from 'react';
import { useTranslation } from 'react-i18next';
import { WbDeadlines } from '../api';

/** Renders acknowledgment / feedback deadline badges (amber when due, red when overdue). */
export const DeadlineBadges: React.FC<{ d: WbDeadlines; status: string }> = ({ d, status }) => {
  const { t } = useTranslation('whistleblower');
  if (status === 'closed') return null;

  const now = Date.now();
  const badges: { text: string; overdue: boolean }[] = [];

  if (!d.ackMet) {
    const due = d.acknowledgmentDueAt ? new Date(d.acknowledgmentDueAt).getTime() : 0;
    const overdue = due > 0 && now > due;
    badges.push({
      text: overdue ? t('deadline.ackOverdue') : t('deadline.ackDue', { date: d.acknowledgmentDueAt ? new Date(d.acknowledgmentDueAt).toLocaleDateString() : '' }),
      overdue,
    });
  }
  if (!d.feedbackMet) {
    const due = d.feedbackDueAt ? new Date(d.feedbackDueAt).getTime() : 0;
    const overdue = due > 0 && now > due;
    badges.push({
      text: overdue ? t('deadline.feedbackOverdue') : t('deadline.feedbackDue', { date: d.feedbackDueAt ? new Date(d.feedbackDueAt).toLocaleDateString() : '' }),
      overdue,
    });
  }
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b, i) => (
        <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${b.overdue ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{b.text}</span>
      ))}
    </div>
  );
};
