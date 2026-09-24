/**
 * SMS sender names (alphanumeric sender IDs) allow at most 11 characters:
 * letters A-Z, digits and spaces. Mirrors toSmsSender in the backend SMS
 * service, so the default shown in settings is exactly what recipients see.
 */
export const SMS_SENDER_MAX = 11;

export function toSmsSender(name: string | null | undefined): string {
  // Spell out Danish letters rather than dropping them: "Bøgh & Søn" -> "Boegh Soen", not "Bgh Sn".
  const spelled = String(name ?? '')
    .replace(/Æ/g, 'Ae').replace(/æ/g, 'ae').replace(/Ø/g, 'Oe').replace(/ø/g, 'oe').replace(/Å/g, 'Aa').replace(/å/g, 'aa');
  const clean = spelled.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length <= SMS_SENDER_MAX) return clean;
  const lastSpace = clean.slice(0, SMS_SENDER_MAX + 1).lastIndexOf(' ');
  return (lastSpace >= 3 ? clean.slice(0, lastSpace) : clean.slice(0, SMS_SENDER_MAX)).trim();
}

export function isValidSmsSender(value: string): boolean {
  return value.length <= SMS_SENDER_MAX && /^[A-Za-z0-9 ]+$/.test(value);
}
