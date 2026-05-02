/**
 * Calcule l'année scolaire actuelle
 * Format: "2024-2025" (de septembre à août)
 */
export const getCurrentAcademicYear = (): string => {
  const now = new Date();
  // UTC : même résultat en SSR et dans le navigateur (évite les écarts de fuseau)
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1; // 1-12
  
  // Si on est entre septembre (9) et décembre (12), l'année scolaire est année en cours - année suivante
  // Sinon (janvier à août), l'année scolaire est année précédente - année en cours
  if (currentMonth >= 9) {
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
};

/**
 * Formate l'année scolaire pour l'affichage
 */
export const formatAcademicYear = (academicYear?: string): string => {
  if (!academicYear) {
    return getCurrentAcademicYear();
  }
  return academicYear;
};



