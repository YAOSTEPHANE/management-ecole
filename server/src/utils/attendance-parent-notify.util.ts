import type { AbsenceStatus } from '@prisma/client';
import prisma from './prisma';
import { sendAttendanceNotificationEmail } from './email.util';
import { sendSMS, formatPhoneNumber, isValidPhoneNumber } from './sms.util';
import { notifyUsersImportant } from './notify-important.util';

function formatAttendanceStatusLabel(status: AbsenceStatus): string {
  switch (status) {
    case 'PRESENT':
      return 'présent(e)';
    case 'ABSENT':
      return 'absent(e)';
    case 'LATE':
      return 'en retard';
    case 'EXCUSED':
      return 'absent(e) justifié(e)';
    default:
      return String(status);
  }
}

export type NotifyParentsAttendanceParams = {
  studentId: string;
  status: AbsenceStatus;
  date: Date;
  courseName: string;
  courseCode?: string | null;
  minutesLate?: number | null;
};

/** Absence non justifiée ou retard : alerte famille pertinente. */
export function shouldNotifyParentsOnAttendanceChange(
  status: AbsenceStatus,
  excused: boolean
): boolean {
  if (status === 'LATE') return true;
  if (status === 'ABSENT') return !excused;
  return false;
}

/**
 * Envoie un e-mail et un SMS à chaque parent lié à l’élève (non bloquant pour l’API).
 * Désactiver avec NOTIFY_PARENTS_ON_ATTENDANCE=false.
 */
export async function notifyParentsOfAttendanceChange(
  params: NotifyParentsAttendanceParams
): Promise<void> {
  if (process.env.NOTIFY_PARENTS_ON_ATTENDANCE?.trim() === 'false') {
    return;
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id: params.studentId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        parents: {
          include: {
            parent: {
              select: {
                userId: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student?.parents?.length) {
      return;
    }

    const studentName = `${student.user.firstName} ${student.user.lastName}`;
    const dateStr = params.date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = params.date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const statusLabel = formatAttendanceStatusLabel(params.status);
    const courseLine = params.courseCode
      ? `${params.courseName} (${params.courseCode})`
      : params.courseName;

    const senderName = process.env.SCHOOL_NAME?.trim() || 'School Manager';
    const latePart =
      params.status === 'LATE' && params.minutesLate != null && params.minutesLate > 0
        ? ` (retard ~${params.minutesLate} min)`
        : '';
    const detailLine =
      params.status === 'LATE' && params.minutesLate != null && params.minutesLate > 0
        ? `Durée du retard estimée : ${params.minutesLate} minute(s).`
        : undefined;
    const smsBody = `${senderName}: ${studentName} est enregistré(e) comme « ${statusLabel} »${latePart} pour « ${courseLine} » le ${dateStr}.`;

    const parentUserIds = student.parents.map((sp) => sp.parent.userId).filter(Boolean);
    if (parentUserIds.length > 0) {
      await notifyUsersImportant(parentUserIds, {
        type: 'attendance_alert',
        title: `Présence — ${studentName}`,
        content: `Statut : ${statusLabel}${latePart}. Cours : ${courseLine}. ${dateStr} à ${timeStr}.`,
        email: null,
        link: '/parent',
      });
    }

    await Promise.allSettled(
      student.parents.map(async (sp) => {
        const u = sp.parent.user;
        const tasks: Promise<unknown>[] = [];

        if (u.email?.trim()) {
          tasks.push(
            sendAttendanceNotificationEmail({
              to: u.email.trim(),
              parentFirstName: u.firstName,
              studentFullName: studentName,
              statusLabel,
              courseLine,
              dateStr,
              timeStr,
              senderName,
              detailLine,
            })
          );
        }

        const rawPhone = u.phone?.trim();
        if (rawPhone) {
          const normalized = formatPhoneNumber(rawPhone.replace(/\s/g, ''));
          if (isValidPhoneNumber(rawPhone.replace(/\s/g, ''))) {
            tasks.push(sendSMS(normalized, smsBody));
          }
        }

        await Promise.all(tasks);
      })
    );
  } catch (error) {
    console.error('notifyParentsOfAttendanceChange:', error);
  }
}

/**
 * Charge l’absence, envoie e-mail/SMS aux parents et met à jour `parentNotifiedAt`.
 */
export async function notifyParentsForAbsenceById(absenceId: string): Promise<{ notified: boolean }> {
  const row = await prisma.absence.findUnique({
    where: { id: absenceId },
    include: { course: { select: { name: true, code: true } } },
  });
  if (!row?.course) {
    return { notified: false };
  }
  await notifyParentsOfAttendanceChange({
    studentId: row.studentId,
    status: row.status,
    date: row.date,
    courseName: row.course.name,
    courseCode: row.course.code,
    minutesLate: row.minutesLate,
  });
  await prisma.absence.update({
    where: { id: absenceId },
    data: { parentNotifiedAt: new Date() },
  });
  return { notified: true };
}
