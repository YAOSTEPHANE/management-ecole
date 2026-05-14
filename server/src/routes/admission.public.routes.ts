import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { notifyAdminsOfNewAdmission } from '../utils/admission-notify.util';

const router = express.Router();

async function generateUniqueReference(): Promise<string> {
  const year = new Date().getFullYear();
  for (let i = 0; i < 12; i++) {
    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const reference = `ADM-${year}-${suffix}`;
    const exists = await prisma.admission.findUnique({ where: { reference } });
    if (!exists) return reference;
  }
  const fallback = `ADM-${year}-${Date.now().toString(36).toUpperCase()}`;
  return fallback;
}

/**
 * Soumission publique d'une demande d'inscription
 */
router.post(
  '/',
  [
    body('firstName').trim().notEmpty().withMessage('Prénom requis'),
    body('lastName').trim().notEmpty().withMessage('Nom requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('dateOfBirth').isISO8601().withMessage('Date de naissance invalide'),
    body('gender').isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Genre invalide'),
    body('desiredLevel').trim().notEmpty().withMessage('Niveau souhaité requis'),
    body('academicYear').trim().notEmpty().withMessage('Année scolaire requise'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        gender,
        desiredLevel,
        academicYear,
        previousSchool,
        parentName,
        parentPhone,
        parentEmail,
        address,
        motivation,
      } = req.body;

      const emailNorm = String(email).trim().toLowerCase();

      const openDuplicate = await prisma.admission.findFirst({
        where: {
          email: emailNorm,
          academicYear: String(academicYear).trim(),
          status: { in: ['PENDING', 'UNDER_REVIEW', 'WAITLIST', 'ACCEPTED'] },
        },
      });

      if (openDuplicate) {
        return res.status(409).json({
          error:
            'Une demande est déjà en cours pour cet email sur cette année scolaire. Utilisez le suivi avec votre numéro de dossier.',
          reference: openDuplicate.reference,
        });
      }

      const reference = await generateUniqueReference();

      const admission = await prisma.admission.create({
        data: {
          reference,
          firstName: String(firstName).trim(),
          lastName: String(lastName).trim(),
          email: emailNorm,
          phone: phone ? String(phone).trim() : undefined,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          desiredLevel: String(desiredLevel).trim(),
          academicYear: String(academicYear).trim(),
          previousSchool: previousSchool ? String(previousSchool).trim() : undefined,
          parentName: parentName ? String(parentName).trim() : undefined,
          parentPhone: parentPhone ? String(parentPhone).trim() : undefined,
          parentEmail: parentEmail ? String(parentEmail).trim().toLowerCase() : undefined,
          address: address ? String(address).trim() : undefined,
          motivation: motivation ? String(motivation).trim() : undefined,
        },
        select: {
          id: true,
          reference: true,
          status: true,
          firstName: true,
          lastName: true,
          academicYear: true,
          desiredLevel: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        message: 'Demande enregistrée. Conservez votre numéro de dossier pour le suivi.',
        admission,
      });

      void notifyAdminsOfNewAdmission({
        reference: admission.reference,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        email: emailNorm,
        phone: phone ? String(phone).trim() : null,
        desiredLevel: String(desiredLevel).trim(),
        academicYear: String(academicYear).trim(),
        parentName: parentName ? String(parentName).trim() : null,
        parentPhone: parentPhone ? String(parentPhone).trim() : null,
        parentEmail: parentEmail ? String(parentEmail).trim().toLowerCase() : null,
      }).catch((notifyError: unknown) => {
        console.error('notifyAdminsOfNewAdmission:', notifyError);
      });
    } catch (error: any) {
      console.error('admission.public POST:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

/**
 * Suivi public d'un dossier par numéro de référence
 */
router.get('/track/:reference', async (req, res) => {
  try {
    const reference = String(req.params.reference).trim().toUpperCase();
    const row = await prisma.admission.findUnique({
      where: { reference },
      select: {
        reference: true,
        status: true,
        firstName: true,
        lastName: true,
        desiredLevel: true,
        academicYear: true,
        createdAt: true,
        updatedAt: true,
        enrolledStudentId: true,
        proposedClass: {
          select: { id: true, name: true, level: true, academicYear: true },
        },
      },
    });

    if (!row) {
      return res.status(404).json({ error: 'Dossier introuvable' });
    }

    const { enrolledStudentId, ...rest } = row;
    const enrolledStudent = enrolledStudentId
      ? await prisma.student.findUnique({
          where: { id: enrolledStudentId },
          select: {
            studentId: true,
            user: { select: { email: true } },
          },
        })
      : null;

    res.json({ ...rest, enrolledStudent });
  } catch (error: any) {
    console.error('admission.public track:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

export default router;
