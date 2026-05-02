/**
 * Année scolaire au format "YYYY-YYYY" (sept. → août) à partir d'une date (UTC).
 */
export function academicYearFromDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  if (m >= 9) {
    return `${y}-${y + 1}`;
  }
  return `${y - 1}-${y}`;
}
