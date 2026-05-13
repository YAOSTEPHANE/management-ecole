import type { Prisma } from '@prisma/client';

/** Correspondance lecture carte NFC ou empreinte digitale (identifiants distincts en base). */
export function matchStudentScanId(scanId: string): Prisma.StudentWhereInput {
  return {
    OR: [{ nfcId: scanId }, { biometricId: scanId }],
  };
}

export function matchTeacherScanId(scanId: string): Prisma.TeacherWhereInput {
  return {
    OR: [{ nfcId: scanId }, { biometricId: scanId }],
  };
}

export function matchStaffScanId(scanId: string): Prisma.StaffMemberWhereInput {
  return {
    OR: [{ nfcId: scanId }, { biometricId: scanId }],
  };
}
