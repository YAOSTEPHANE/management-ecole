export function getGoogleMapsSearchUrl(query: string): string {
  if (!query.trim()) return 'https://www.google.com/maps';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
}

export function getSchoolMapsQuery(
  address?: string | null,
  schoolName?: string | null,
): string {
  const custom = address?.trim();
  if (custom) return custom;
  return schoolName?.trim() ?? '';
}
