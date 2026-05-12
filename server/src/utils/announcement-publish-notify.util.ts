import type { Role } from '@prisma/client';
import prisma from './prisma';
import { notifyUsersImportant } from './notify-important.util';
import { sendSMS, formatPhoneNumber, isValidPhoneNumber } from './sms.util';

const PORTAL_ROLES: Role[] = ['STUDENT', 'PARENT', 'TEACHER', 'EDUCATOR', 'STAFF'];

/**
 * Utilisateurs à notifier lors de la publication d’une annonce (cible rôle et/ou classe).
 */
export async function resolveAnnouncementRecipientUserIds(ann: {
  targetRole: Role | null;
  targetClassId: string | null;
}): Promise<string[]> {
  const ids = new Set<string>();

  if (ann.targetClassId) {
    const classId = ann.targetClassId;
    const roleFilter = ann.targetRole;

    const students = await prisma.student.findMany({
      where: { classId, isActive: true },
      select: {
        userId: true,
        parents: { select: { parent: { select: { userId: true } } } },
      },
    });

    const teacherRows = await prisma.course.findMany({
      where: { classId },
      select: { teacher: { select: { userId: true } } },
    });

    if (!roleFilter) {
      for (const s of students) {
        ids.add(s.userId);
        for (const p of s.parents) ids.add(p.parent.userId);
      }
      for (const t of teacherRows) ids.add(t.teacher.userId);
      return [...ids];
    }

    if (roleFilter === 'STUDENT') {
      students.forEach((s) => ids.add(s.userId));
    } else if (roleFilter === 'PARENT') {
      for (const s of students) {
        for (const p of s.parents) ids.add(p.parent.userId);
      }
    } else if (roleFilter === 'TEACHER') {
      for (const t of teacherRows) ids.add(t.teacher.userId);
    } else {
      const users = await prisma.user.findMany({
        where: { role: roleFilter, isActive: true },
        select: { id: true },
      });
      users.forEach((u) => ids.add(u.id));
    }
    return [...ids];
  }

  if (ann.targetRole) {
    const users = await prisma.user.findMany({
      where: { role: ann.targetRole, isActive: true },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  const users = await prisma.user.findMany({
    where: { role: { in: PORTAL_ROLES }, isActive: true },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

/**
 * Après publication : notification in-app + e-mail + push web ; SMS optionnels si priorité urgente
 * et `ANNOUNCEMENT_URGENT_SMS=true`.
 */
export async function notifyUsersAboutPublishedAnnouncement(announcementId: string): Promise<{ count: number }> {
  const a = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: {
      id: true,
      title: true,
      content: true,
      priority: true,
      targetRole: true,
      targetClassId: true,
    },
  });
  if (!a) return { count: 0 };

  const userIds = await resolveAnnouncementRecipientUserIds({
    targetRole: a.targetRole,
    targetClassId: a.targetClassId,
  });
  if (userIds.length === 0) return { count: 0 };

  const urgent = a.priority === 'urgent';
  const title = urgent ? `URGENT — ${a.title}` : a.title;
  const preview = a.content.length > 800 ? `${a.content.slice(0, 797)}…` : a.content;

  await notifyUsersImportant(userIds, {
    type: urgent ? 'announcement_urgent' : 'announcement',
    title,
    content: preview,
    email: undefined,
  });

  if (urgent && process.env.ANNOUNCEMENT_URGENT_SMS?.trim() === 'true') {
    const parents = await prisma.user.findMany({
      where: { id: { in: userIds }, role: 'PARENT', isActive: true },
      select: { phone: true },
    });
    const line = `${title} — Ouvrez l’application pour le détail.`.slice(0, 300);
    await Promise.allSettled(
      parents
        .filter((u) => u.phone && isValidPhoneNumber(u.phone.replace(/\s/g, '')))
        .map((u) => sendSMS(formatPhoneNumber(u.phone!.replace(/\s/g, '')), line))
    );
  }

  return { count: userIds.length };
}
