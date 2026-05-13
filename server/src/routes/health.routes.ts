import express from 'express';
import type { InfirmaryVisitOutcome, HealthCampaignKind, HealthEmergencySeverity, Role } from '@prisma/client';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { assertHealthModuleAccess } from '../utils/health-access.util';

const router = express.Router();

router.use(authenticate);

async function healthGuard(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  try {
    await assertHealthModuleAccess(req.user!.id, req.user!.role as Role);
    next();
  } catch {
    return res.status(403).json({ error: 'Accès infirmerie / santé non autorisé' });
  }
}

router.use(healthGuard);

async function getStaffMemberId(userId: string): Promise<string | null> {
  const s = await prisma.staffMember.findUnique({ where: { userId }, select: { id: true } });
  return s?.id ?? null;
}

const studentInclude = {
  user: { select: { firstName: true, lastName: true } },
  class: { select: { name: true, level: true } },
} as const;

router.get('/students/search', async (req: AuthRequest, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json([]);
    const students = await prisma.student.findMany({
      where: {
        isActive: true,
        OR: [
          { studentId: { contains: q } },
          { user: { firstName: { contains: q } } },
          { user: { lastName: { contains: q } } },
        ],
      },
      take: 30,
      orderBy: { user: { lastName: 'asc' } },
      include: studentInclude,
    });
    res.json(students);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur serveur' });
  }
});

router.get('/students/:studentId/dossier', async (req, res) => {
  try {
    const student = await prisma.student.findFirst({
      where: { id: req.params.studentId, isActive: true },
      include: {
        ...studentInclude,
        healthDossier: true,
        vaccinations: { orderBy: { administeredAt: 'desc' }, take: 50 },
        allergyRecords: { orderBy: { allergen: 'asc' } },
        treatments: { orderBy: { updatedAt: 'desc' } },
        infirmaryVisits: { orderBy: { visitedAt: 'desc' }, take: 20, include: { staffMember: { include: { user: { select: { firstName: true, lastName: true } } } } } },
      },
    });
    if (!student) return res.status(404).json({ error: 'Élève introuvable' });
    res.json(student);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur serveur' });
  }
});

router.put('/students/:studentId/dossier', async (req: AuthRequest, res) => {
  try {
    const student = await prisma.student.findFirst({ where: { id: req.params.studentId, isActive: true } });
    if (!student) return res.status(404).json({ error: 'Élève introuvable' });

    const {
      medicalHistory,
      familyDoctorName,
      familyDoctorPhone,
      preferredHospital,
      insuranceInfo,
      additionalNotes,
      medicalInfo,
      allergies,
      emergencyContact,
      emergencyPhone,
      emergencyContact2,
      emergencyPhone2,
    } = req.body ?? {};

    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: student.id },
        data: {
          ...(medicalInfo !== undefined && { medicalInfo: medicalInfo ? String(medicalInfo).trim() : null }),
          ...(allergies !== undefined && { allergies: allergies ? String(allergies).trim() : null }),
          ...(emergencyContact !== undefined && { emergencyContact: emergencyContact || null }),
          ...(emergencyPhone !== undefined && { emergencyPhone: emergencyPhone || null }),
          ...(emergencyContact2 !== undefined && { emergencyContact2: emergencyContact2 || null }),
          ...(emergencyPhone2 !== undefined && { emergencyPhone2: emergencyPhone2 || null }),
        },
      });
      await tx.studentHealthDossier.upsert({
        where: { studentId: student.id },
        create: {
          studentId: student.id,
          medicalHistory: medicalHistory?.trim() || null,
          familyDoctorName: familyDoctorName?.trim() || null,
          familyDoctorPhone: familyDoctorPhone?.trim() || null,
          preferredHospital: preferredHospital?.trim() || null,
          insuranceInfo: insuranceInfo?.trim() || null,
          additionalNotes: additionalNotes?.trim() || null,
          lastUpdatedByUserId: req.user!.id,
        },
        update: {
          ...(medicalHistory !== undefined && { medicalHistory: medicalHistory?.trim() || null }),
          ...(familyDoctorName !== undefined && { familyDoctorName: familyDoctorName?.trim() || null }),
          ...(familyDoctorPhone !== undefined && { familyDoctorPhone: familyDoctorPhone?.trim() || null }),
          ...(preferredHospital !== undefined && { preferredHospital: preferredHospital?.trim() || null }),
          ...(insuranceInfo !== undefined && { insuranceInfo: insuranceInfo?.trim() || null }),
          ...(additionalNotes !== undefined && { additionalNotes: additionalNotes?.trim() || null }),
          lastUpdatedByUserId: req.user!.id,
        },
      });
    });

    const updated = await prisma.student.findUnique({
      where: { id: student.id },
      include: { healthDossier: true, user: { select: { firstName: true, lastName: true } } },
    });
    res.json(updated);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur serveur' });
  }
});

router.post('/students/:studentId/vaccinations', async (req, res) => {
  try {
    const { vaccineName, administeredAt, doseLabel, batchNumber, campaignId, notes } = req.body ?? {};
    if (!vaccineName || !administeredAt) {
      return res.status(400).json({ error: 'vaccineName et administeredAt requis' });
    }
    const row = await prisma.studentVaccination.create({
      data: {
        studentId: req.params.studentId,
        vaccineName: String(vaccineName).trim(),
        administeredAt: new Date(administeredAt),
        doseLabel: doseLabel?.trim() || null,
        batchNumber: batchNumber?.trim() || null,
        campaignId: campaignId || null,
        notes: notes?.trim() || null,
      },
    });
    res.status(201).json(row);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur serveur' });
  }
});

router.delete('/vaccinations/:id', async (req, res) => {
  try {
    await prisma.studentVaccination.delete({ where: { id: req.params.id } });
    res.json({ message: 'Supprimé' });
  } catch {
    res.status(404).json({ error: 'Introuvable' });
  }
});

router.post('/students/:studentId/allergies', async (req, res) => {
  try {
    const { allergen, severity, reaction, notes } = req.body ?? {};
    if (!allergen) return res.status(400).json({ error: 'allergen requis' });
    const row = await prisma.studentAllergyRecord.create({
      data: {
        studentId: req.params.studentId,
        allergen: String(allergen).trim(),
        severity: severity?.trim() || null,
        reaction: reaction?.trim() || null,
        notes: notes?.trim() || null,
      },
    });
    res.status(201).json(row);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur serveur' });
  }
});

router.delete('/allergies/:id', async (req, res) => {
  try {
    await prisma.studentAllergyRecord.delete({ where: { id: req.params.id } });
    res.json({ message: 'Supprimé' });
  } catch {
    res.status(404).json({ error: 'Introuvable' });
  }
});

router.post('/students/:studentId/treatments', async (req, res) => {
  try {
    const { medication, dosage, schedule, startDate, endDate, isActive, notes } = req.body ?? {};
    if (!medication) return res.status(400).json({ error: 'medication requis' });
    const row = await prisma.studentTreatment.create({
      data: {
        studentId: req.params.studentId,
        medication: String(medication).trim(),
        dosage: dosage?.trim() || null,
        schedule: schedule?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== false,
        notes: notes?.trim() || null,
      },
    });
    res.status(201).json(row);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur serveur' });
  }
});

router.patch('/treatments/:id', async (req, res) => {
  try {
    const b = req.body ?? {};
    const row = await prisma.studentTreatment.update({
      where: { id: req.params.id },
      data: {
        ...(b.isActive !== undefined && { isActive: Boolean(b.isActive) }),
        ...(b.endDate !== undefined && { endDate: b.endDate ? new Date(b.endDate) : null }),
        ...(b.notes !== undefined && { notes: b.notes?.trim() || null }),
      },
    });
    res.json(row);
  } catch {
    res.status(404).json({ error: 'Introuvable' });
  }
});

router.get('/visits', async (req, res) => {
  try {
    const { studentId, from, to } = req.query;
    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = studentId;
    if (from || to) {
      where.visitedAt = {
        ...(from ? { gte: new Date(String(from)) } : {}),
        ...(to ? { lte: new Date(String(to)) } : {}),
      };
    }
    const rows = await prisma.infirmaryVisit.findMany({
      where,
      orderBy: { visitedAt: 'desc' },
      take: 200,
      include: {
        student: { include: studentInclude },
        staffMember: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
    res.json(rows);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur serveur' });
  }
});

router.post('/visits', async (req: AuthRequest, res) => {
  try {
    const staffId = await getStaffMemberId(req.user!.id);
    if (!staffId && req.user!.role === 'STAFF') {
      return res.status(403).json({ error: 'Profil personnel requis pour enregistrer une visite' });
    }
    const {
      studentId,
      visitedAt,
      motive,
      careAdministered,
      medicationsGiven,
      outcome,
      medicalCertificateUrl,
      parentNotified,
      notes,
    } = req.body ?? {};
    if (!studentId || !motive) return res.status(400).json({ error: 'studentId et motive requis' });

    const visit = await prisma.infirmaryVisit.create({
      data: {
        studentId,
        staffMemberId: staffId,
        visitedAt: visitedAt ? new Date(visitedAt) : new Date(),
        motive: String(motive).trim(),
        careAdministered: careAdministered?.trim() || null,
        medicationsGiven: medicationsGiven?.trim() || null,
        outcome: (outcome as InfirmaryVisitOutcome) || 'RETURN_TO_CLASS',
        medicalCertificateUrl: medicalCertificateUrl?.trim() || null,
        parentNotified: Boolean(parentNotified),
        notes: notes?.trim() || null,
      },
      include: { student: { include: studentInclude } },
    });
    res.status(201).json(visit);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur serveur' });
  }
});

router.get('/campaigns', async (_req, res) => {
  try {
    const rows = await prisma.healthCampaign.findMany({
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { participations: true } } },
    });
    res.json(rows);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur serveur' });
  }
});

router.post('/campaigns', async (req, res) => {
  try {
    const { kind, title, description, startDate, endDate, targetLevels, isActive } = req.body ?? {};
    if (!kind || !title || !startDate) {
      return res.status(400).json({ error: 'kind, title et startDate requis' });
    }
    const row = await prisma.healthCampaign.create({
      data: {
        kind: kind as HealthCampaignKind,
        title: String(title).trim(),
        description: description?.trim() || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        targetLevels: Array.isArray(targetLevels) ? targetLevels.map(String) : [],
        isActive: isActive !== false,
      },
    });
    res.status(201).json(row);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur serveur' });
  }
});

router.patch('/campaigns/:id', async (req, res) => {
  try {
    const b = req.body ?? {};
    const row = await prisma.healthCampaign.update({
      where: { id: req.params.id },
      data: {
        ...(b.title !== undefined && { title: String(b.title).trim() }),
        ...(b.description !== undefined && { description: b.description?.trim() || null }),
        ...(b.isActive !== undefined && { isActive: Boolean(b.isActive) }),
        ...(b.endDate !== undefined && { endDate: b.endDate ? new Date(b.endDate) : null }),
      },
    });
    res.json(row);
  } catch {
    res.status(404).json({ error: 'Campagne introuvable' });
  }
});

router.get('/emergencies', async (_req, res) => {
  try {
    const rows = await prisma.healthEmergencyLog.findMany({
      orderBy: { reportedAt: 'desc' },
      take: 100,
      include: {
        student: { include: studentInclude },
        reportedBy: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
    res.json(rows);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur serveur' });
  }
});

router.post('/emergencies', async (req: AuthRequest, res) => {
  try {
    const staffId = await getStaffMemberId(req.user!.id);
    const { studentId, severity, description, actionsTaken } = req.body ?? {};
    if (!description) return res.status(400).json({ error: 'description requise' });
    const row = await prisma.healthEmergencyLog.create({
      data: {
        studentId: studentId || null,
        reportedByStaffId: staffId,
        severity: (severity as HealthEmergencySeverity) || 'MEDIUM',
        description: String(description).trim(),
        actionsTaken: actionsTaken?.trim() || null,
      },
    });
    res.status(201).json(row);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur serveur' });
  }
});

router.patch('/emergencies/:id/resolve', async (req, res) => {
  try {
    const row = await prisma.healthEmergencyLog.update({
      where: { id: req.params.id },
      data: { resolvedAt: new Date(), actionsTaken: req.body?.actionsTaken?.trim() || undefined },
    });
    res.json(row);
  } catch {
    res.status(404).json({ error: 'Introuvable' });
  }
});

router.get('/statistics', async (_req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [visitsMonth, visitsTotal, activeTreatments, allergyCount, openEmergencies, campaignsActive] =
      await Promise.all([
        prisma.infirmaryVisit.count({ where: { visitedAt: { gte: monthStart } } }),
        prisma.infirmaryVisit.count(),
        prisma.studentTreatment.count({ where: { isActive: true } }),
        prisma.studentAllergyRecord.count(),
        prisma.healthEmergencyLog.count({ where: { resolvedAt: null } }),
        prisma.healthCampaign.count({ where: { isActive: true } }),
      ]);

    const byOutcome = await prisma.infirmaryVisit.groupBy({
      by: ['outcome'],
      _count: { _all: true },
      where: { visitedAt: { gte: monthStart } },
    });

    res.json({
      visitsMonth,
      visitsTotal,
      activeTreatments,
      allergyRecords: allergyCount,
      openEmergencies,
      activeCampaigns: campaignsActive,
      visitsByOutcomeMonth: byOutcome,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur serveur' });
  }
});

export default router;
