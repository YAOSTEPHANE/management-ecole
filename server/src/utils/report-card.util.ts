import prisma from './prisma';

export function getPeriodDates(period: string, academicYear: string): { start: Date; end: Date } {
  const parts = academicYear.split('-').map(Number);
  const yearStart = parts[0];
  const yearEnd = parts[1] ?? yearStart + 1;
  let start: Date;
  let end: Date;

  switch (period) {
    case 'trim1':
      start = new Date(yearStart, 8, 1);
      end = new Date(yearStart, 10, 30);
      break;
    case 'trim2':
      start = new Date(yearStart, 11, 1);
      end = new Date(yearEnd, 1, 28);
      break;
    case 'trim3':
      start = new Date(yearEnd, 2, 1);
      end = new Date(yearEnd, 6, 30);
      break;
    case 'sem1':
      start = new Date(yearStart, 8, 1);
      end = new Date(yearEnd, 1, 28);
      break;
    case 'sem2':
      start = new Date(yearEnd, 2, 1);
      end = new Date(yearEnd, 6, 30);
      break;
    default:
      start = new Date(yearStart, 8, 1);
      end = new Date(yearEnd, 6, 30);
  }

  return { start, end };
}

export function getPeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    trim1: 'Trimestre 1',
    trim2: 'Trimestre 2',
    trim3: 'Trimestre 3',
    sem1: 'Semestre 1',
    sem2: 'Semestre 2',
  };
  return labels[period] || period;
}

/**
 * Moyenne générale période (même logique que la génération PDF / preview).
 */
export async function computeStudentBulletinAverage(
  studentId: string,
  classId: string,
  periodDates: { start: Date; end: Date }
): Promise<number> {
  const [grades, classCourses] = await Promise.all([
    prisma.grade.findMany({
      where: {
        studentId,
        date: {
          gte: periodDates.start,
          lte: periodDates.end,
        },
      },
    }),
    prisma.course.findMany({
      where: { classId },
      select: { id: true },
    }),
  ]);

  const courseAverages: Record<string, { total: number; count: number; average: number }> = {};

  grades.forEach((grade) => {
    const courseId = grade.courseId;
    if (!courseAverages[courseId]) {
      courseAverages[courseId] = { total: 0, count: 0, average: 0 };
    }
    const gradeOn20 = (grade.score / grade.maxScore) * 20;
    courseAverages[courseId].total += gradeOn20 * grade.coefficient;
    courseAverages[courseId].count += grade.coefficient;
  });

  Object.keys(courseAverages).forEach((courseId) => {
    const c = courseAverages[courseId];
    c.average = c.count > 0 ? c.total / c.count : 0;
  });

  classCourses.forEach((course) => {
    if (!courseAverages[course.id]) {
      courseAverages[course.id] = { total: 0, count: 0, average: 0 };
    }
  });

  let totalWeightedAverage = 0;
  let totalCoefficient = 0;
  Object.entries(courseAverages).forEach(([courseId, course]) => {
    const hasGrades = grades.some((g) => g.courseId === courseId);
    if (hasGrades && course.count > 0) {
      totalWeightedAverage += course.average * course.count;
      totalCoefficient += course.count;
    }
  });

  return totalCoefficient > 0 ? totalWeightedAverage / totalCoefficient : 0;
}

export type ClassRankRow = { studentId: string; average: number; rank: number };

export async function computeClassBulletinRanks(
  classId: string,
  periodKey: string,
  academicYear: string
): Promise<{ periodLabel: string; periodDates: { start: Date; end: Date }; rows: ClassRankRow[] }> {
  const periodDates = getPeriodDates(periodKey, academicYear);
  const periodLabel = getPeriodLabel(periodKey);

  const students = await prisma.student.findMany({
    where: { classId },
    select: { id: true },
  });

  const withAvg = await Promise.all(
    students.map(async (s) => ({
      studentId: s.id,
      average: await computeStudentBulletinAverage(s.id, classId, periodDates),
    }))
  );

  withAvg.sort((a, b) => b.average - a.average);
  const rows: ClassRankRow[] = withAvg.map((r, i) => ({
    studentId: r.studentId,
    average: r.average,
    rank: i + 1,
  }));

  return { periodLabel, periodDates, rows };
}
