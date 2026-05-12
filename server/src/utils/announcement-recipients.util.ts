import prisma from './prisma';
import type { Role } from '@prisma/client';

type AnnouncementTargets = {
  targetRole: Role | null;
  targetClassId: string | null;
};

/**
 * Utilisateurs actifs concernés par une annonce (classe ciblée et/ou rôle).
 */
export async function getAnnouncementRecipientUserIds(a: AnnouncementTargets): Promise<string[]> {
  const ids = new Set<string>();

  if (a.targetClassId) {
    const students = await prisma.student.findMany({
      where: { classId: a.targetClassId },
      select: { id: true, userId: true },
    });
    students.forEach((s) => ids.add(s.userId));

    const sidList = students.map((s) => s.id);
    if (sidList.length > 0) {
      const links = await prisma.studentParent.findMany({
        where: { studentId: { in: sidList } },
        include: { parent: { select: { userId: true } } },
      });
      links.forEach((l) => ids.add(l.parent.userId));
    }

    const cls = await prisma.class.findUnique({
      where: { id: a.targetClassId },
      select: { teacherId: true },
    });
    if (cls?.teacherId) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: cls.teacherId },
        select: { userId: true },
      });
      if (teacher) ids.add(teacher.userId);
    }

    if (a.targetRole) {
      const filtered = await prisma.user.findMany({
        where: {
          id: { in: [...ids] },
          isActive: true,
          role: a.targetRole,
        },
        select: { id: true },
      });
      return filtered.map((u) => u.id);
    }

    const active = await prisma.user.findMany({
      where: { id: { in: [...ids] }, isActive: true },
      select: { id: true },
    });
    return active.map((u) => u.id);
  }

  if (a.targetRole) {
    const users = await prisma.user.findMany({
      where: { isActive: true, role: a.targetRole },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true },
  });
  return users.map((u) => u.id);
}
