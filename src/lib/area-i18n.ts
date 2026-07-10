import i18n from '@/i18n';

/**
 * "Areas of responsibility" are data rows (contact_areas_of_responsibility) with a
 * single English `name`, so they render in English regardless of UI language. This
 * translates the BUILT-IN set for Danish users; custom areas a company creates fall
 * through to their typed name unchanged. Matching is on the (normalized) English name.
 *
 * To adjust a Danish word, edit the map below — it's the single source of truth.
 */
const DA_AREA_NAMES: Record<string, string> = {
  'administration': 'Administration',
  'working environment': 'Arbejdsmiljø',
  'worksheets': 'Arbejdssedler',
  'cars': 'Biler',
  'holiday': 'Ferie',
  'holidays': 'Ferie',
  'gdpr': 'GDPR',
  'it': 'IT',
  'purchase': 'Indkøb',
  'contact information': 'Kontaktoplysninger',
  'driving': 'Kørsel',
  'pay': 'Løn',
  'pension': 'Pension',
  'damage/insurance': 'Skade/forsikring',
  'grief and loss': 'Sorg og tab',
  'support on the handbook': 'Support til håndbogen',
  'sick leave': 'Sygefravær',
  'telephones': 'Telefoner',
  'clothing': 'Beklædning',
  'protective equipment': 'Værnemidler',
  'other features': 'Andet',
};

/** Localize an area-of-responsibility display name (Danish only; other languages/custom areas pass through). */
export function localizeAreaName(name: string | null | undefined): string {
  if (!name) return '';
  const lang = (i18n.language || 'da').toLowerCase();
  if (!lang.startsWith('da')) return name;
  return DA_AREA_NAMES[name.trim().toLowerCase()] ?? name;
}
