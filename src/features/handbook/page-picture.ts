import type { HandbookPageDetail } from '@/types/models';

/**
 * The picture a page shows readers: its own picture, else CompanyFlow's standard picture for the
 * text. Whether it is shown at all depends on the page's imagePlacement ('none' = hidden).
 */
export function pagePicture(
  detail: Pick<HandbookPageDetail, 'pictures' | 'standardPicture'> | null | undefined,
): { url: string; name: string } | undefined {
  const own = detail?.pictures?.[0];
  if (own?.url) return { url: own.url, name: own.name };
  const standard = detail?.standardPicture;
  if (standard?.url) return { url: standard.url, name: standard.name };
  return undefined;
}
