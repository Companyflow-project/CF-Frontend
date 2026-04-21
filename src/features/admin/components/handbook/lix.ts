export interface LixStats {
  lix: number;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'difficult' | 'very_difficult';
  words: number;
  sentences: number;
  longSentences: number;
  longWords: number;
  veryLongWords: number;
  frequentWords: number;
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ');
}

export function calculateLix(html: string): LixStats {
  const text = stripHtml(html).trim();
  if (!text) {
    return { lix: 0, difficulty: 'very_easy', words: 0, sentences: 0, longSentences: 0, longWords: 0, veryLongWords: 0, frequentWords: 0 };
  }

  const sentenceSegments = text
    .split(/[.!?]+(?=\s|$)/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  const sentences = Math.max(1, sentenceSegments.length);

  const wordRegex = /[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'-]*/g;
  const allWords = text.match(wordRegex) ?? [];
  const words = allWords.length;
  if (words === 0) {
    return { lix: 0, difficulty: 'very_easy', words: 0, sentences: 0, longSentences: 0, longWords: 0, veryLongWords: 0, frequentWords: 0 };
  }

  const longWords = allWords.filter(w => w.length > 7).length;
  const veryLongWords = allWords.filter(w => w.length > 10).length;
  const longSentences = sentenceSegments.filter(s => s.length > 120).length;

  const counts = new Map<string, number>();
  for (const w of allWords) {
    const key = w.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let frequentWords = 0;
  for (const [key, c] of counts) {
    if (c > 3 && key.length > 7) frequentWords++;
  }

  const lix = Math.round((words / sentences) + (longWords * 100) / words);

  let difficulty: LixStats['difficulty'] = 'very_easy';
  if (lix >= 55) difficulty = 'very_difficult';
  else if (lix >= 45) difficulty = 'difficult';
  else if (lix >= 35) difficulty = 'medium';
  else if (lix >= 25) difficulty = 'easy';

  return { lix, difficulty, words, sentences, longSentences, longWords, veryLongWords, frequentWords };
}
