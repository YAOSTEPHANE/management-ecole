export function normalizePortalCategory(input: unknown): string | null {
  if (input == null || input === '') return null;
  const v = String(input).trim().toLowerCase();
  if (v === 'auto' || v === 'automatic') return null;
  if (v === 'circular' || v === 'news' || v === 'gallery') return v;
  return null;
}

export function normalizeCoverImageUrl(input: unknown): string | null {
  if (typeof input !== 'string' || !input.trim()) return null;
  return input.trim();
}

/** Jusqu’à 40 URLs (lignes ou séparées par virgule / point-virgule). */
export function parseImageUrlsField(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 40);
  }
  if (typeof input === 'string') {
    return input
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 40);
  }
  return [];
}
