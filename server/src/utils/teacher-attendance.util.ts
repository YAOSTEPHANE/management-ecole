import type { AbsenceStatus } from '@prisma/client';
import { punchTeacherCourseAttendance } from './attendance-punch.util';
import { toAttendanceDateKey } from './schedule-slot.util';

const STATUSES: AbsenceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

export { toAttendanceDateKey };

export function parseAttendanceStatus(raw: unknown, fallback: AbsenceStatus = 'PRESENT'): AbsenceStatus {
  if (typeof raw === 'string' && STATUSES.includes(raw as AbsenceStatus)) {
    return raw as AbsenceStatus;
  }
  return fallback;
}

/** Pointage enseignant : 1er pointage = arrivée ; fin = heure de fin du créneau EDT ; heures = intervalle entre les deux. */
export async function upsertTeacherAttendance(params: {
  teacherId: string;
  date: Date;
  status?: AbsenceStatus;
  source: 'NFC' | 'ADMIN' | 'SELF' | 'BIOMETRIC';
  recordedByUserId?: string | null;
  courseId?: string;
}) {
  const result = await punchTeacherCourseAttendance({
    teacherId: params.teacherId,
    at: params.date,
    source: params.source,
    courseId: params.courseId,
    recordedByUserId: params.recordedByUserId,
  });
  return result.attendance;
}
