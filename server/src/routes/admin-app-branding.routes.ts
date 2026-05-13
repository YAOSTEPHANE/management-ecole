import express from 'express';
import type { Prisma } from '@prisma/client';
import { brandingUpload, getFileUrl } from '../middleware/upload.middleware';
import { deleteUploadedFileByPublicUrl } from '../utils/deleteUpload.util';
import {
  getAppBrandingDelegate,
  APP_BRANDING_ID,
  APP_BRANDING_PRISMA_HINT,
} from '../utils/app-branding-prisma.util';

const router = express.Router();

const ALLOWED_SLOTS = new Set(['navigation', 'login', 'favicon']);

function trimText(v: unknown, max: number): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t.length === 0 ? null : t.slice(0, max);
}

function toPublicShape(row: {
  navigationLogoUrl: string | null;
  loginLogoUrl: string | null;
  faviconUrl: string | null;
  appTitle: string | null;
  appTagline: string | null;
  schoolDisplayName: string | null;
  schoolAddress: string | null;
  schoolPhone: string | null;
  schoolEmail: string | null;
  schoolWebsite: string | null;
  schoolPrincipal: string | null;
}) {
  return {
    navigationLogoUrl: row.navigationLogoUrl,
    loginLogoUrl: row.loginLogoUrl,
    faviconUrl: row.faviconUrl,
    appTitle: row.appTitle,
    appTagline: row.appTagline,
    schoolDisplayName: row.schoolDisplayName,
    schoolAddress: row.schoolAddress,
    schoolPhone: row.schoolPhone,
    schoolEmail: row.schoolEmail,
    schoolWebsite: row.schoolWebsite,
    schoolPrincipal: row.schoolPrincipal,
  };
}

function delegateOr503(res: express.Response) {
  const appBranding = getAppBrandingDelegate();
  if (!appBranding) {
    console.error(
      '[app-branding] Client Prisma sans modèle AppBranding — cd server && npx prisma generate && npx prisma db push'
    );
    res.status(503).json({ error: APP_BRANDING_PRISMA_HINT });
    return null;
  }
  return appBranding;
}

/** Lecture (admin) — même contenu que l’endpoint public. */
router.get('/app-branding', async (_req, res) => {
  try {
    const appBranding = delegateOr503(res);
    if (!appBranding) return;

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
    res.json(toPublicShape(row));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    console.error('GET /admin/app-branding:', error);
    res.status(500).json({ error: message });
  }
});

router.put('/app-branding', async (req, res) => {
  try {
    const appBranding = delegateOr503(res);
    if (!appBranding) return;

    const body = req.body as Record<string, unknown>;
    const data: Prisma.AppBrandingUncheckedUpdateInput = {};

    const title = trimText(body.appTitle, 120);
    const tagline = trimText(body.appTagline, 160);
    if (title !== undefined) data.appTitle = title;
    if (tagline !== undefined) data.appTagline = tagline;

    const schoolName = trimText(body.schoolDisplayName, 200);
    const schoolAddr = trimText(body.schoolAddress, 500);
    const schoolPh = trimText(body.schoolPhone, 80);
    const schoolEm = trimText(body.schoolEmail, 120);
    const schoolWeb = trimText(body.schoolWebsite, 200);
    const schoolPr = trimText(body.schoolPrincipal, 120);
    if (schoolName !== undefined) data.schoolDisplayName = schoolName;
    if (schoolAddr !== undefined) data.schoolAddress = schoolAddr;
    if (schoolPh !== undefined) data.schoolPhone = schoolPh;
    if (schoolEm !== undefined) data.schoolEmail = schoolEm;
    if (schoolWeb !== undefined) data.schoolWebsite = schoolWeb;
    if (schoolPr !== undefined) data.schoolPrincipal = schoolPr;

    const prev = await appBranding.findUnique({ where: { id: APP_BRANDING_ID } });

    const applyUrlClear = (
      key: 'navigationLogoUrl' | 'loginLogoUrl' | 'faviconUrl',
      bodyKey: string
    ) => {
      if (!(bodyKey in body)) return;
      const v = body[bodyKey];
      if (v === null) {
        const old = prev?.[key];
        if (old) deleteUploadedFileByPublicUrl(old);
        data[key] = null;
      }
    };

    applyUrlClear('navigationLogoUrl', 'navigationLogoUrl');
    applyUrlClear('loginLogoUrl', 'loginLogoUrl');
    applyUrlClear('faviconUrl', 'faviconUrl');

    if (Object.keys(data).length === 0) {
      const row =
        prev ??
        (await appBranding.create({
          data: { id: APP_BRANDING_ID },
        }));
      return res.json(toPublicShape(row));
    }

    const row = await appBranding.upsert({
      where: { id: APP_BRANDING_ID },
      create: {
        id: APP_BRANDING_ID,
        ...(data as Omit<Prisma.AppBrandingUncheckedCreateInput, 'id'>),
      },
      update: data,
    });

    res.json(toPublicShape(row));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    console.error('PUT /admin/app-branding:', error);
    res.status(500).json({ error: message });
  }
});

router.post('/app-branding/upload', (req, res, next) => {
  brandingUpload.single('branding')(req, res, (err) => {
    if (err) {
      const message = err instanceof Error ? err.message : 'Upload invalide';
      return res.status(400).json({ error: message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const appBranding = delegateOr503(res);
    if (!appBranding) return;

    const slot = String(req.query.slot || '').trim();
    if (!ALLOWED_SLOTS.has(slot)) {
      return res.status(400).json({ error: 'Paramètre slot requis : navigation, login ou favicon' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Fichier manquant (champ branding)' });
    }

    const fileUrl = getFileUrl(req.file.filename, 'branding');
    const prev = await appBranding.findUnique({ where: { id: APP_BRANDING_ID } });

    let oldUrl: string | null | undefined;
    if (slot === 'navigation') oldUrl = prev?.navigationLogoUrl ?? undefined;
    else if (slot === 'login') oldUrl = prev?.loginLogoUrl ?? undefined;
    else oldUrl = prev?.faviconUrl ?? undefined;

    const update: Prisma.AppBrandingUpdateInput =
      slot === 'navigation'
        ? { navigationLogoUrl: fileUrl }
        : slot === 'login'
          ? { loginLogoUrl: fileUrl }
          : { faviconUrl: fileUrl };

    const row = await appBranding.upsert({
      where: { id: APP_BRANDING_ID },
      create: {
        id: APP_BRANDING_ID,
        navigationLogoUrl: slot === 'navigation' ? fileUrl : null,
        loginLogoUrl: slot === 'login' ? fileUrl : null,
        faviconUrl: slot === 'favicon' ? fileUrl : null,
      },
      update,
    });

    if (oldUrl && oldUrl !== fileUrl) {
      deleteUploadedFileByPublicUrl(oldUrl);
    }

    res.json(toPublicShape(row));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    console.error('POST /admin/app-branding/upload:', error);
    res.status(500).json({ error: message });
  }
});

export default router;
