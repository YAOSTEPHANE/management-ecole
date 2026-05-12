/** Aligné sur `server/src/utils/portal-feed.util.ts` (titres Circulaire… ou catégorie explicite). */
export function inferPortalCategory(
  title: string,
  portalCategory: string | null | undefined
): 'circular' | 'news' | 'gallery' {
  const pc = portalCategory?.trim().toLowerCase();
  if (pc === 'circular' || pc === 'news' || pc === 'gallery') {
    return pc;
  }
  const t = (title || '').trim();
  if (/^\[?\s*Circulaire/i.test(t) || /^Circulaire\b/i.test(t)) {
    return 'circular';
  }
  return 'news';
}

export function isCircularAnnouncement(a: { title?: string; portalCategory?: string | null }) {
  return inferPortalCategory(a.title ?? '', a.portalCategory) === 'circular';
}
