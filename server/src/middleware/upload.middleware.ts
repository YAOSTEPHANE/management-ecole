import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getPublicUploadsUrlPrefix, getUploadsRootDir } from '../utils/uploads-path';

const uploadsDir = getUploadsRootDir();
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.error('uploads: impossible de créer le répertoire racine', err);
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'general';
    
    if (file.fieldname === 'avatar') {
      folder = 'avatars';
    } else if (file.fieldname === 'assignment') {
      folder = 'assignments';
    } else if (file.fieldname === 'course') {
      folder = 'courses';
    } else if (file.fieldname === 'identityDocument') {
      folder = 'identity-documents';
    } else if (file.fieldname === 'teacherAdminDocument') {
      folder = 'teacher-admin-documents';
    } else if (file.fieldname === 'branding') {
      folder = 'branding';
    }
    
    const dir = path.join(uploadsDir, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// Filtre des types de fichiers
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Utilisez jpeg, jpg, png, gif, pdf, doc ou docx.'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

const BRANDING_ALLOWED_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/heic',
  'image/heif',
]);

const brandingExtOk = (name: string) =>
  /\.(jpeg|jpg|png|gif|webp|svg|ico|heic|heif)$/i.test(path.extname(name));

const brandingFileFilter = (_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.fieldname !== 'branding') {
    return fileFilter(_req as any, file, cb);
  }
  if (!brandingExtOk(file.originalname)) {
    return cb(
      new Error('Format non autorisé pour le logo. Utilisez une image (PNG, JPG, WEBP, SVG, ICO, HEIC…).')
    );
  }
  const mime = (file.mimetype || '').toLowerCase().split(';')[0].trim();
  if (BRANDING_ALLOWED_MIMES.has(mime)) {
    return cb(null, true);
  }
  return cb(
    new Error('Format non autorisé pour le logo. Utilisez une image (PNG, JPG, WEBP, SVG, ICO, HEIC…).')
  );
};

/** Logos / favicon établissement (champ fichier `branding`, max 5 Mo). */
export const brandingUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: brandingFileFilter,
});

/** Pièces d’identité : fichiers un peu plus volumineux (PDF scannés) */
export const identityUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter,
});

// Middleware pour servir les fichiers statiques
export const getFileUrl = (filename: string, folder: string = 'general'): string => {
  const prefix = getPublicUploadsUrlPrefix();
  return `${prefix}/${folder}/${filename}`;
};






