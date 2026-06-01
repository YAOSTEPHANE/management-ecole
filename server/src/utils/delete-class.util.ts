import type { Prisma } from '@prisma/client';
import prisma from './prisma';

export class ClassDeleteBlockedError extends Error {
  statusCode = 409;
  studentCount: number;

  constructor(studentCount: number) {
    super(
      `Cette classe compte ${studentCount} élève(s). Détachez-les ou confirmez la suppression avec l’option « détacher les élèves ».`,
    );
    this.name = 'ClassDeleteBlockedError';
    this.studentCount = studentCount;
  }
}

async function deleteCourseInTransaction(tx: Prisma.TransactionClient, courseId: string) {
  await tx.schedule.deleteMany({ where: { courseId } });
  const assignments = await tx.assignment.findMany({
    where: { courseId },
    select: { id: true },
  });
  const assignmentIds = assignments.map((a) => a.id);
  if (assignmentIds.length > 0) {
    await tx.studentAssignment.deleteMany({
      where: { assignmentId: { in: assignmentIds } },
    });
  }
  await tx.assignment.deleteMany({ where: { courseId } });
  await tx.absence.deleteMany({ where: { courseId } });
  await tx.grade.deleteMany({ where: { courseId } });
  await tx.virtualClassSession.updateMany({
    where: { courseId },
    data: { courseId: null },
  });
  await tx.elearningCourse.updateMany({
    where: { courseId },
    data: { courseId: null },
  });
  await tx.course.delete({ where: { id: courseId } });
}

export async function deleteClassById(params: {
  classId: string;
  unlinkStudents?: boolean;
}): Promise<{ ok: true; unlinkedStudents: number; deletedCourses: number }> {
  const { classId, unlinkStudents = false } = params;

  const existing = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      name: true,
      _count: { select: { students: true, courses: true } },
    },
  });

  if (!existing) {
    throw Object.assign(new Error('Classe introuvable.'), { statusCode: 404 });
  }

  const studentCount = existing._count.students;
  if (studentCount > 0 && !unlinkStudents) {
    throw new ClassDeleteBlockedError(studentCount);
  }

  let unlinkedStudents = 0;
  const deletedCourses = existing._count.courses;

  await prisma.$transaction(async (tx) => {
    if (unlinkStudents && studentCount > 0) {
      const result = await tx.student.updateMany({
        where: { classId },
        data: { classId: null, classGroupId: null },
      });
      unlinkedStudents = result.count;
    }

    const courses = await tx.course.findMany({
      where: { classId },
      select: { id: true },
    });
    for (const course of courses) {
      await deleteCourseInTransaction(tx, course.id);
    }

    await tx.schedule.deleteMany({ where: { classId } });
    await tx.classCouncilSession.deleteMany({ where: { classId } });

    await tx.announcement.updateMany({
      where: { targetClassId: classId },
      data: { targetClassId: null },
    });
    await tx.admission.updateMany({
      where: { proposedClassId: classId },
      data: { proposedClassId: null },
    });
    await tx.tuitionFeeCatalog.updateMany({
      where: { classId },
      data: { classId: null },
    });
    await tx.extracurricularOffering.updateMany({
      where: { classId },
      data: { classId: null },
    });
    await tx.elearningCourse.updateMany({
      where: { classId },
      data: { classId: null },
    });
    await tx.virtualClassSession.updateMany({
      where: { classId },
      data: { classId: null },
    });
    await tx.academicChangeRequest.updateMany({
      where: { classId },
      data: { classId: null },
    });

    await tx.class.delete({ where: { id: classId } });
  });

  return { ok: true, unlinkedStudents, deletedCourses };
}
