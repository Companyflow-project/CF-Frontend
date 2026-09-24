/**
 * Word-level diff for showing how a handbook page changed between versions.
 *
 * Deliberately tiny and dependency-free: pages are a few hundred words, so a
 * plain longest-common-subsequence over word tokens is plenty. HTML is reduced
 * to text first — the reader wants "this sentence changed", not tag noise.
 */
export type DiffSegment = { type: 'same' | 'add' | 'del'; text: string };

export function htmlToText(html: string): string {
  const el = document.createElement('div');
  el.innerHTML = html;
  // Keep block boundaries readable as line breaks.
  el.querySelectorAll('p, div, li, br, h1, h2, h3, h4, h5, h6, tr').forEach((n) => {
    n.appendChild(document.createTextNode('\n'));
  });
  return (el.textContent ?? '').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
}

/** Tokens are words and the whitespace between them, so joining segments restores the text. */
function tokenize(s: string): string[] {
  return s.split(/(\s+)/).filter((t) => t.length > 0);
}

export function diffWords(before: string, after: string): DiffSegment[] {
  const a = tokenize(before);
  const b = tokenize(after);
  const n = a.length;
  const m = b.length;
  if (n === 0 && m === 0) return [];
  // Guard against pathological sizes; a whole-text swap is still readable.
  if (n * m > 1_500_000) {
    return [{ type: 'del', text: before }, { type: 'add', text: after }];
  }
  const w = m + 1;
  const dp = new Uint16Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * w + j] = a[i] === b[j]
        ? dp[(i + 1) * w + j + 1] + 1
        : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
    }
  }
  const out: DiffSegment[] = [];
  const push = (type: DiffSegment['type'], text: string) => {
    const last = out[out.length - 1];
    if (last && last.type === type) last.text += text;
    else out.push({ type, text });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { push('same', a[i]); i++; j++; }
    else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) { push('del', a[i]); i++; }
    else { push('add', b[j]); j++; }
  }
  while (i < n) push('del', a[i++]);
  while (j < m) push('add', b[j++]);
  return out;
}
