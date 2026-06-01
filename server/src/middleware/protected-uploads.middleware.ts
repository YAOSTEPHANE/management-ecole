import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import {
  isSensitiveUploadPath,
  normalizeUploadRequestPath,
} from '../utils/sensitive-upload-path.util';
import { userCanAccessSensitiveUpload } from '../utils/upload-access-authorization.util';
import type { AuthRequest } from './auth.middleware';
import prisma from '../utils/prisma';
import { isVercelBlobUrl } from '../utils/blob-storage.util';

function requestUploadPath(req: Request): string {
  const base = (req.baseUrl || '').replace(/\/api\/uploads$/, '/uploads');
  const segment = req.path || req.url.split('?')[0] || '';
  const combined = `${base}${segment}`.replace(/\\/g, '/');
  if (combined.includes('/uploads/')) {
    const idx = combined.indexOf('/uploads/');
    return normalizeUploadRequestPath(combined.slice(idx));
  }
  return normalizeUploadRequestPath(`/uploads${combined.startsWith('/') ? combined : `/${combined}`}`);
}

async function resolveUserFromBearer(req: Request): Promise<AuthRequest['user'] | null> {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (!user?.isActive) return null;
    return { id: user.id, email: user.email, role: user.role };
  } catch {
    return null;
  }
}

async function findSensitiveBlobUrlByPath(uploadPath: string): Promise<string | null> {
  const path = normalizeUploadRequestPath(uploadPath);
  const fileName = path.split('/').pop() || '';
  if (!fileName) return null;
  const escaped = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const endsWithName = new RegExp(`/${escaped}(\\?|$)`, 'i');
  const pathLower = path.toLowerCase();

  if (pathLower.includes('/identity-documents/')) {
    const doc = await prisma.identityDocument.findFirst({
      where: { fileUrl: { contains: fileName } },
      select: { fileUrl: true },
    });
    return doc?.fileUrl && isVercelBlobUrl(doc.fileUrl) && endsWithName.test(doc.fileUrl) ? doc.fileUrl : null;
  }

  if (pathLower.includes('/teacher-admin-documents/')) {
    const doc = await prisma.teacherAdministrativeDocument.findFirst({
      where: { fileUrl: { contains: fileName } },
      select: { fileUrl: true },
    });
    return doc?.fileUrl && isVercelBlobUrl(doc.fileUrl) && endsWithName.test(doc.fileUrl) ? doc.fileUrl : null;
  }

  if (pathLower.includes('/admission-documents/')) {
    const admission = await prisma.admission.findFirst({
      where: { term3ReportCardUrl: { contains: fileName } },
      select: { term3ReportCardUrl: true },
    });
    const url = admission?.term3ReportCardUrl;
    return url && isVercelBlobUrl(url) && endsWithName.test(url) ? url : null;
  }

  return null;
}

/**
 * Bloque l’accès aux pièces sensibles.
 * Autorise uniquement une session Bearer + contrôle métier backend.
 */
export async function protectSensitiveUploads(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const uploadPath = requestUploadPath(req);
  if (!isSensitiveUploadPath(uploadPath)) {
    next();
    return;
  }

  const user = await resolveUserFromBearer(req);
  if (user && (await userCanAccessSensitiveUpload(user, uploadPath))) {
    const blobUrl = await findSensitiveBlobUrlByPath(uploadPath);
    if (blobUrl) {
      res.locals.sensitiveBlobUrl = blobUrl;
    }
    next();
    return;
  }

  res.status(401).json({ error: 'Accès au fichier refusé. Authentification requise.' });
}
