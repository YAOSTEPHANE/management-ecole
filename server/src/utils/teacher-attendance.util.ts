import type { AbsenceStatus } from '@prisma/client';
import prisma from './prisma';

const STATUSES: AbsenceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

/** Clé locale YYYY-MM-DD (jour civil selon le fuseau du serveur). */
export function toAttendanceDateKey(input: Date): string {
  const d = new Date(input);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseAttendanceStatus(raw: unknown, fallback: AbsenceStatus = 'PRESENT'): AbsenceStatus {
  if (typeof raw === 'string' && STATUSES.includes(raw as AbsenceStatus)) {
    return raw as AbsenceStatus;
  }
  return fallback;
}

export async function upsertTeacherAttendance(params: {
  teacherId: string;
  date: Date;
  status: AbsenceStatus;
  source: 'NFC' | 'ADMIN' | 'SELF';
  recordedByUserId?: string | null;
}) {
  const attendanceDate = toAttendanceDateKey(params.date);
  return prisma.teacherAttendance.upsert({
    where: {
      teacherId_attendanceDate: {
        teacherId: params.teacherId,
        attendanceDate,
      },
    },
    create: {
      teacherId: params.teacherId,
      attendanceDate,
      status: params.status,
      source: params.source,
      recordedByUserId: params.recordedByUserId ?? undefined,
    },
    update: {
      status: params.status,
      source: params.source,
      ...(params.recordedByUserId != null ? { recordedByUserId: params.recordedByUserId } : {}),
    },
    include: {
      teacher: {
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
  });
}
