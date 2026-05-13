import express from 'express';
import prisma from '../utils/prisma';
import { getAppBrandingDelegate, APP_BRANDING_ID } from '../utils/app-branding-prisma.util';

const router = express.Router();

router.get('/app-branding', async (_req, res) => {
  try {
    const appBranding = getAppBrandingDelegate();
    if (!appBranding) {
      console.error(
        '[app-branding] Client Prisma sans modèle AppBranding — cd server && npx prisma generate && npx prisma db push'
      );
      return res.json({
        navigationLogoUrl: null,
        loginLogoUrl: null,
        faviconUrl: null,
        appTitle: null,
        appTagline: null,
        schoolDisplayName: null,
        schoolAddress: null,
        schoolPhone: null,
        schoolEmail: null,
        schoolWebsite: null,
        schoolPrincipal: null,
      });
    }

    const row = await appBranding.findUnique({ where: { id: APP_BRANDING_ID } });
    if (!row) {
      return res.json({
        navigationLogoUrl: null,
        loginLogoUrl: null,
        faviconUrl: null,
        appTitle: null,
        appTagline: null,
        schoolDisplayName: null,
        schoolAddress: null,
        schoolPhone: null,
        schoolEmail: null,
        schoolWebsite: null,
        schoolPrincipal: null,
      });
    }
    res.json({
      navigationLogoUrl: row.navigationLogoUrl,
      loginLogoUrl: row.loginLogoUrl,
      faviconUrl: row.faviconUrl,
      appTitle: row.appTitle,
      appTagline: row.appTagline,
      schoolDisplayName: row.schoolDisplayName ?? null,
      schoolAddress: row.schoolAddress ?? null,
      schoolPhone: row.schoolPhone ?? null,
      schoolEmail: row.schoolEmail ?? null,
      schoolWebsite: row.schoolWebsite ?? null,
      schoolPrincipal: row.schoolPrincipal ?? null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    console.error('GET /public/app-branding:', error);
    res.status(500).json({ error: message });
  }
});

/**
 * Données minimales pour affichage de la carte étudiant (lien / QR public).
 * L’identifiant `publicId` est un secret de possession (comme un jeton).
 */
router.get('/student-card/:publicId', async (req, res) => {
  try {
    const publicId = String(req.params.publicId || '').trim();
    if (!publicId || publicId.length > 128) {
      return res.status(400).json({ error: 'Identifiant invalide' });
    }

    const student = await prisma.student.findFirst({
      where: { digitalCardPublicId: publicId },
      select: {
        studentId: true,
        isActive: true,
        enrollmentStatus: true,
        user: {
          select: { firstName: true, lastName: true, avatar: true },
        },
        class: { select: { name: true, level: true, academicYear: true } },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Carte introuvable' });
    }

    res.json({
      studentId: student.studentId,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      avatar: student.user.avatar,
      className: student.class?.name ?? null,
      classLevel: student.class?.level ?? null,
      academicYear: student.class?.academicYear ?? null,
      enrollmentStatus: student.enrollmentStatus,
      isActive: student.isActive,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    console.error('GET /public/student-card:', error);
    res.status(500).json({ error: message });
  }
});

export default router;
