/** Coefficient de pondération d'une matière (moyenne générale, bulletins). */
export const GRADING_COEFFICIENT_MIN = 0.25;
export const GRADING_COEFFICIENT_MAX = 100;

export function parseGradingCoefficient(
  value: unknown,
  fallback = 1,
): number {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const n = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n < GRADING_COEFFICIENT_MIN || n > GRADING_COEFFICIENT_MAX) {
    throw new Error(
      `Coefficient invalide (entre ${GRADING_COEFFICIENT_MIN} et ${GRADING_COEFFICIENT_MAX}).`,
    );
  }
  return n;
}

export function courseGradingCoefficientMap(
  courses: Array<{ id: string; gradingCoefficient: number | null }>,
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const course of courses) {
    map[course.id] =
      course.gradingCoefficient != null && course.gradingCoefficient > 0
        ? course.gradingCoefficient
        : 1;
  }
  return map;
}

/** Moyenne générale : moyennes par matière pondérées par le coefficient de la matière. */
export function computeOverallAverageFromCourseAverages(
  courseAverages: Record<string, { average: number; count: number }>,
  grades: Array<{ courseId: string }>,
  courseCoeffs: Record<string, number>,
): number {
  let totalWeightedAverage = 0;
  let totalCoefficient = 0;
  Object.entries(courseAverages).forEach(([courseId, course]) => {
    const hasGrades = grades.some((g) => g.courseId === courseId);
    const coef = courseCoeffs[courseId] ?? 1;
    if (hasGrades && course.count > 0) {
      totalWeightedAverage += course.average * coef;
      totalCoefficient += coef;
    }
  });
  return totalCoefficient > 0 ? totalWeightedAverage / totalCoefficient : 0;
}
