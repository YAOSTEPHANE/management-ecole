import express from 'express';
import fs from 'fs';
import { authenticate } from '../middleware/auth.middleware';
import { upload, identityUpload, getFileUrl } from '../middleware/upload.middleware';
import prisma from '../utils/prisma';

const IDENTITY_TYPES = [
  'NATIONAL_ID',
  'BIRTH_CERTIFICATE',
  'PASSPORT',
  'RESIDENCE_PERMIT',
  'PHOTO_ID',
  'OTHER',
] as const;

const router = express.Router();

router.use(authenticate);

// Upload d'avatar
router.post('/avatar', upload.single('avatar'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const fileUrl = getFileUrl(req.file.filename, 'avatars');
    const fullUrl = `${req.protocol}://${req.get('host')}${fileUrl}`;

    // Mettre à jour l'avatar de l'utilisateur
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatar: fullUrl },
    });

    res.json({
      message: 'Avatar uploadé avec succès',
      url: fullUrl,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload de fichier pour devoir
router.post('/assignment', upload.single('assignment'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const fileUrl = getFileUrl(req.file.filename, 'assignments');
    const fullUrl = `${req.protocol}://${req.get('host')}${fileUrl}`;

    res.json({
      message: 'Fichier uploadé avec succès',
      url: fullUrl,
      filename: req.file.originalname,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload d'image pour cours
router.post('/course', upload.single('course'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const fileUrl = getFileUrl(req.file.filename, 'courses');
    const fullUrl = `${req.protocol}://${req.get('host')}${fileUrl}`;

    res.json({
      message: 'Image uploadée avec succès',
      url: fullUrl,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Pièce d'identité (élève : son dossier ; admin : studentId requis en champ formulaire)
router.post(
  '/identity-document',
  identityUpload.single('identityDocument'),
  async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      const role = req.user?.role;
      const { type, label, notes, studentId: bodyStudentId } = req.body;

      if (!type || !IDENTITY_TYPES.includes(type as (typeof IDENTITY_TYPES)[number])) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Type de document invalide' });
      }

      let targetStudentId: string;

      if (role === 'ADMIN') {
        if (!bodyStudentId) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: 'studentId requis pour déposer le document sur un dossier élève' });
        }
        const st = await prisma.student.findUnique({ where: { id: String(bodyStudentId) } });
        if (!st) {
          fs.unlinkSync(req.file.path);
          return res.status(404).json({ error: 'Élève introuvable' });
        }
        targetStudentId = st.id;
      } else if (role === 'STUDENT') {
        const st = await prisma.student.findFirst({ where: { userId: req.user.id } });
        if (!st) {
          fs.unlinkSync(req.file.path);
          return res.status(404).json({ error: 'Profil élève introuvable' });
        }
        targetStudentId = st.id;
      } else {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'Seuls les élèves et administrateurs peuvent déposer des pièces' });
      }

      const fileUrl = `${req.protocol}://${req.get('host')}${getFileUrl(req.file.filename, 'identity-documents')}`;

      const doc = await prisma.identityDocument.create({
        data: {
          studentId: targetStudentId,
          type: type as (typeof IDENTITY_TYPES)[number],
          label:
            type === 'OTHER' && label && String(label).trim()
              ? String(label).trim().slice(0, 120)
              : null,
          fileUrl,
          originalName: req.file.originalname.slice(0, 255),
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          notes: notes && String(notes).trim() ? String(notes).trim().slice(0, 500) : null,
          uploadedById: req.user.id,
        },
        include: {
          uploadedBy: { select: { firstName: true, lastName: true, role: true } },
        },
      });

      res.status(201).json({
        message: 'Document enregistré',
        document: doc,
      });
    } catch (error: any) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {
          /* ignore */
        }
      }
      console.error('POST /upload/identity-document:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

export default router;




