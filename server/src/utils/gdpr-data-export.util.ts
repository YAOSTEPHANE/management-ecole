import prisma from './prisma';
import { decryptStudentRecord } from './student-sensitive-crypto.util';

function stripPassword<T extends { password?: string }>(row: T): Omit<T, 'password'> {
  const { password: _p, ...rest } = row;
  return rest;
}

/**
 * Assemble un export structuré des données personnelles liées au compte (RGPD — portabilité).
 * Les mots de passe et secrets techniques ne sont jamais inclus.
 */
export async function buildGdprDataExport(userId: string): Promise<Record<string, unknown>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new Error('Utilisateur introuvable');
  }

  const account = stripPassword(user);

  const [notifications, loginLogs, pushSubscriptions, auditLogs, sentMessages, receivedMessages] =
    await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      prisma.loginLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.pushSubscription.findMany({
        where: { userId },
      }),
      prisma.auditLog.findMany({
        where: { actorUserId: userId },
        orderBy: { createdAt: 'desc' },
        take: 400,
      }),
      prisma.message.findMany({
        where: { senderId: userId },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.message.findMany({
        where: { receiverId: userId },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    ]);

  const base: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    legalNotice:
      'Export généré pour exercer votre droit d’accès / à la portabilité (RGPD). ' +
      'Certaines données peuvent devoir être conservées par l’établissement pour obligations légales ou pédagogiques ; ' +
      'l’effacement complet peut être refusé ou différé dans ces cas.',
    account,
    notifications,
    loginLogs,
    pushSubscriptions,
    auditLogsActions: auditLogs,
    messages: { sent: sentMessages, received: receivedMessages },
  };

  if (user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        class: true,
        parents: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (student) {
      const sid = student.id;
      const [
        grades,
        absences,
        studentAssignments,
        conducts,
        payments,
        tuitionFees,
        reportCards,
        identityDocuments,
      ] = await Promise.all([
        prisma.grade.findMany({
          where: { studentId: sid },
          take: 600,
          orderBy: { date: 'desc' },
          include: { course: { select: { id: true, name: true, code: true } } },
        }),
        prisma.absence.findMany({
          where: { studentId: sid },
          take: 400,
          orderBy: { date: 'desc' },
          include: { course: { select: { id: true, name: true, code: true } } },
        }),
        prisma.studentAssignment.findMany({
          where: { studentId: sid },
          take: 250,
          orderBy: { updatedAt: 'desc' },
          include: {
            assignment: { select: { id: true, title: true, description: true, dueDate: true } },
          },
        }),
        prisma.conduct.findMany({
          where: { studentId: sid },
          take: 80,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.payment.findMany({
          where: { studentId: sid },
          take: 150,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.tuitionFee.findMany({
          where: { studentId: sid },
          take: 100,
          orderBy: { dueDate: 'desc' },
        }),
        prisma.reportCard.findMany({
          where: { studentId: sid },
          take: 50,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.identityDocument.findMany({
          where: { studentId: sid },
          take: 50,
          orderBy: { createdAt: 'desc' },
        }),
      ]);
      base.studentProfile = decryptStudentRecord(student as Record<string, unknown>);
      base.studentAcademicData = {
        grades,
        absences,
        studentAssignments,
        conducts,
        payments,
        tuitionFees,
        reportCards,
        identityDocuments,
      };
    }
  }

  if (user.role === 'PARENT') {
    const parent = await prisma.parent.findUnique({
      where: { userId },
      include: {
        contacts: true,
        consents: { take: 100 },
        interactionLogs: { take: 200, orderBy: { createdAt: 'desc' } },
        students: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                  },
                },
                class: { select: { id: true, name: true, level: true } },
                pickupAuthorizations: { take: 50 },
              },
            },
          },
        },
        appointments: {
          take: 100,
          orderBy: { scheduledStart: 'desc' },
        },
      },
    });
    if (parent) {
      const { students: childLinks, ...parentMeta } = parent;
      base.parentProfile = {
        ...parentMeta,
        students: childLinks.map((sp) => ({
          relation: sp.relation,
          student: sp.student
            ? decryptStudentRecord(sp.student as Record<string, unknown>)
            : null,
        })),
      };
    }
  }

  if (user.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      include: {
        classes: { take: 50 },
        courses: { take: 80 },
        leaves: { take: 50, orderBy: { createdAt: 'desc' } },
        performanceReviews: { take: 50, orderBy: { createdAt: 'desc' } },
      },
    });
    if (teacher) {
      base.teacherProfile = teacher;
    }
  }

  if (user.role === 'EDUCATOR') {
    const educator = await prisma.educator.findUnique({
      where: { userId },
    });
    if (educator) {
      base.educatorProfile = educator;
    }
  }

  if (user.role === 'STAFF') {
    const staff = await prisma.staffMember.findUnique({
      where: { userId },
      include: {
        jobDescription: true,
        attendances: { take: 200, orderBy: { attendanceDate: 'desc' } },
      },
    });
    if (staff) {
      base.staffProfile = staff;
    }
  }

  return base;
}
