import express from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import type { AuthRequest } from '../middleware/auth.middleware';
import { registerStudentForExtracurricular } from '../utils/extracurricular.util';

const offeringInclude = {
  class: { select: { id: true, name: true, level: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  _count: { select: { registrations: true } },
} satisfies Prisma.ExtracurricularOfferingInclude;

const router = express.Router();

router.get('/extracurricular/offerings', async (req, res) => {
  try {
    const { academicYear, kind, category, classId, publishedOnly } = req.query;
    const where: Prisma.ExtracurricularOfferingWhereInput = {};
    if (typeof academicYear === 'string' && academicYear.trim()) where.academicYear = academicYear.trim();
    if (typeof kind === 'string' && (kind === 'CLUB' || kind === 'EVENT')) where.kind = kind;
    if (typeof category === 'string' && category.trim()) {
      where.category = category as Prisma.ExtracurricularOfferingWhereInput['category'];
    }
    if (typeof classId === 'string' && classId) where.classId = classId;
    if (publishedOnly === 'true') where.isPublished = true;

    const rows = await prisma.extracurricularOffering.findMany({
      where,
      orderBy: [{ academicYear: 'desc' }, { kind: 'asc' }, { startAt: 'desc' }, { title: 'asc' }],
      include: offeringInclude,
    });
    res.json(rows);
  } catch (e) {
    console.error('GET /admin/extracurricular/offerings:', e);
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erreur serveur' });
  }
});

router.post('/extracurricular/offerings', async (req: AuthRequest, res) => {
  try {
    const b = req.body as Record<string, unknown>;
    const kind = b.kind === 'CLUB' || b.kind === 'EVENT' ? b.kind : null;
    const category = typeof b.category === 'string' ? b.category : '';
    const allowedCat = [
      'CLUB_ASSOCIATION',
      'SPORT_COMPETITION',
      'ARTS_CULTURE',
      'EDUCATIONAL_OUTING',
      'SCHOOL_TRIP',
      'OTHER',
    ];
    const title = typeof b.title === 'string' ? b.title.trim() : '';
    const academicYear = typeof b.academicYear === 'string' ? b.academicYear.trim() : '';
    if (!kind || !title || !academicYear || !allowedCat.includes(category)) {
      return res.status(400).json({ error: 'kind, title, academicYear et category valides sont requis.' });
    }

    const row = await prisma.extracurricularOffering.create({
      data: {
        kind,
        category: category as Prisma.ExtracurricularOfferingCreateInput['category'],
        title,
        description: typeof b.description === 'string' && b.description.trim() ? b.description.trim() : null,
        academicYear,
        classId: typeof b.classId === 'string' && b.classId.trim() ? b.classId.trim() : null,
        supervisorName:
          typeof b.supervisorName === 'string' && b.supervisorName.trim() ? b.supervisorName.trim() : null,
        meetSchedule:
          typeof b.meetSchedule === 'string' && b.meetSchedule.trim() ? b.meetSchedule.trim() : null,
        startAt: b.startAt ? new Date(String(b.startAt)) : null,
        endAt: b.endAt ? new Date(String(b.endAt)) : null,
        location: typeof b.location === 'string' && b.location.trim() ? b.location.trim() : null,
        registrationDeadline: b.registrationDeadline ? new Date(String(b.registrationDeadline)) : null,
        maxParticipants:
          b.maxParticipants != null && String(b.maxParticipants).trim() !== ''
            ? Math.max(0, parseInt(String(b.maxParticipants), 10) || 0) || null
            : null,
        isPublished: Boolean(b.isPublished),
        isActive: b.isActive === undefined ? true : Boolean(b.isActive),
        createdById: req.user!.id,
      },
      include: offeringInclude,
    });
    res.status(201).json(row);
  } catch (e) {
    console.error('POST /admin/extracurricular/offerings:', e);
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erreur serveur' });
  }
});

router.put('/extracurricular/offerings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const b = req.body as Record<string, unknown>;
    const existing = await prisma.extracurricularOffering.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Activité introuvable.' });

    const data: Prisma.ExtracurricularOfferingUpdateInput = {};
    if (b.kind === 'CLUB' || b.kind === 'EVENT') data.kind = b.kind;
    if (typeof b.title === 'string') data.title = b.title.trim();
    if (typeof b.description === 'string')
      data.description = b.description.trim() === '' ? null : b.description.trim();
    if (typeof b.academicYear === 'string') data.academicYear = b.academicYear.trim();
    if (b.classId !== undefined) {
      if (b.classId === null || b.classId === '') {
        data.class = { disconnect: true };
      } else {
        data.class = { connect: { id: String(b.classId) } };
      }
    }
    if (b.supervisorName !== undefined)
      data.supervisorName =
        b.supervisorName === null || b.supervisorName === '' ? null : String(b.supervisorName).trim();
    if (b.meetSchedule !== undefined)
      data.meetSchedule =
        b.meetSchedule === null || b.meetSchedule === '' ? null : String(b.meetSchedule).trim();
    if (b.startAt !== undefined) data.startAt = b.startAt ? new Date(String(b.startAt)) : null;
    if (b.endAt !== undefined) data.endAt = b.endAt ? new Date(String(b.endAt)) : null;
    if (b.location !== undefined)
      data.location = b.location === null || b.location === '' ? null : String(b.location).trim();
    if (b.registrationDeadline !== undefined)
      data.registrationDeadline = b.registrationDeadline
        ? new Date(String(b.registrationDeadline))
        : null;
    if (b.maxParticipants !== undefined) {
      data.maxParticipants =
        b.maxParticipants === null || b.maxParticipants === ''
          ? null
          : Math.max(0, parseInt(String(b.maxParticipants), 10) || 0) || null;
    }
    if (b.isPublished !== undefined) data.isPublished = Boolean(b.isPublished);
    if (b.isActive !== undefined) data.isActive = Boolean(b.isActive);
    const allowedCat = [
      'CLUB_ASSOCIATION',
      'SPORT_COMPETITION',
      'ARTS_CULTURE',
      'EDUCATIONAL_OUTING',
      'SCHOOL_TRIP',
      'OTHER',
    ];
    if (typeof b.category === 'string' && allowedCat.includes(b.category)) {
      data.category = b.category as Prisma.ExtracurricularOfferingUpdateInput['category'];
    }

    const row = await prisma.extracurricularOffering.update({
      where: { id },
      data,
      include: offeringInclude,
    });
    res.json(row);
  } catch (e) {
    console.error('PUT /admin/extracurricular/offerings/:id:', e);
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erreur serveur' });
  }
});

router.delete('/extracurricular/offerings/:id', async (req, res) => {
  try {
    await prisma.extracurricularOffering.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE /admin/extracurricular/offerings/:id:', e);
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erreur serveur' });
  }
});

router.get('/extracurricular/offerings/:id/registrations', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await prisma.extracurricularRegistration.findMany({
      where: { offeringId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            class: { select: { name: true, level: true } },
          },
        },
      },
    });
    res.json(rows);
  } catch (e) {
    console.error('GET /admin/extracurricular/offerings/:id/registrations:', e);
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erreur serveur' });
  }
});

router.post('/extracurricular/registrations', async (req: AuthRequest, res) => {
  try {
    const { studentId, offeringId } = req.body as { studentId?: string; offeringId?: string };
    if (!studentId || !offeringId) {
      return res.status(400).json({ error: 'studentId et offeringId sont requis.' });
    }
    const { registration, status } = await registerStudentForExtracurricular(studentId, offeringId);
    res.status(201).json({ ...(registration as object), _placement: status });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return res.status(409).json({ error: 'Cet élève est déjà inscrit à cette activité.' });
    }
    const msg = e instanceof Error ? e.message : 'Erreur serveur';
    console.error('POST /admin/extracurricular/registrations:', e);
    res.status(400).json({ error: msg });
  }
});

router.delete('/extracurricular/registrations/:id', async (req, res) => {
  try {
    await prisma.extracurricularRegistration.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE /admin/extracurricular/registrations/:id:', e);
    res.status(500).json({ error: e instanceof Error ? e.message : 'Erreur serveur' });
  }
});

export default router;
