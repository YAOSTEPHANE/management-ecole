import type { PrismaClient } from '@prisma/client';
import { SchoolFeeType } from '@prisma/client';
import { schoolYearEndDateFromLabel } from './academicYear.util';

/** Frais pris en compte pour le blocage « scolarité / inscription » côté portail parent. */
const SCOLARITY_FEE_TYPES: SchoolFeeType[] = ['ENROLLMENT', 'TUITION'];

export type ParentTuitionBlockInfo = {
  active: boolean;
  /** Années scolaires concernées (frais inscription/scolarité encore impayés après la fin d'année). */
  hiddenAcademicYears: string[];
};

export function emptyParentTuitionBlock(): ParentTuitionBlockInfo {
  return { active: false, hiddenAcademicYears: [] };
}

/**
 * Années scolaires pour lesquelles l'impayé inscription/scolarité dépasse la fin d'année (+ délai de grâce éventuel).
 */
export async function getAcademicYearsWithTuitionBlockForParent(
  db: PrismaClient,
  studentId: string,
  now = new Date(),
): Promise<Set<string>> {
  const feeRows = await db.tuitionFee.findMany({
    where: {
      studentId,
      feeType: { in: SCOLARITY_FEE_TYPES },
    },
    select: {
      academicYear: true,
      amount: true,
      isPaid: true,
      payments: {
        where: { status: 'COMPLETED' },
        select: { amount: true },
      },
    },
  });

  const distinctYears = new Set<string>();
  for (const row of feeRows) {
    const ay = row.academicYear?.trim();
    if (!ay) continue;
    const paid = row.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = row.amount - paid;
    const unpaid = !row.isPaid || remaining > 0.5;
    if (unpaid) {
      distinctYears.add(ay);
    }
  }

  let graceDays = parseInt(process.env.TUITION_BLOCK_GRACE_DAYS || '0', 10);
  if (!Number.isFinite(graceDays)) {
    graceDays = 0;
  }
  const graceMs = graceDays * 86_400_000;

  const blocked = new Set<string>();
  for (const ay of distinctYears) {
    const end = schoolYearEndDateFromLabel(ay);
    if (!end) continue;
    if (now.getTime() > end.getTime() + graceMs) {
      blocked.add(ay);
    }
  }
  return blocked;
}

export function parentTuitionBlockFromYears(years: Set<string>): ParentTuitionBlockInfo {
  const hiddenAcademicYears = [...years].sort();
  return {
    active: hiddenAcademicYears.length > 0,
    hiddenAcademicYears,
  };
}
