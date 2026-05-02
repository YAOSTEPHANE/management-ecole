import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { generateToken } from '../utils/jwt.util';
import { hashPassword, comparePassword } from '../utils/password.util';
import { authenticate } from '../middleware/auth.middleware';
import {
  createPasswordResetToken,
  sendPasswordResetEmail,
  verifyResetToken,
  markTokenAsUsed,
} from '../utils/email.util';

const router = express.Router();

// Inscription
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe trop court'),
    body('firstName').notEmpty().withMessage('Prénom requis'),
    body('lastName').notEmpty().withMessage('Nom requis'),
    body('role').isIn(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'EDUCATOR']).withMessage('Rôle invalide'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, firstName, lastName, role, phone } = req.body;

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }

      // Hasher le mot de passe
      const hashedPassword = await hashPassword(password);

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      // Générer le token
      const token = generateToken(user.id, user.email, user.role);

      res.status(201).json({
        message: 'Inscription réussie',
        user,
        token,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Connexion
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Trouver l'utilisateur (tous les profils pour le même schéma que /auth/me)
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          teacherProfile: true,
          studentProfile: true,
          parentProfile: true,
          educatorProfile: true,
        },
      });

      // Logs de débogage en mode développement
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Tentative de connexion:', {
          email,
          userExists: !!user,
          isActive: user?.isActive,
        });
      }

      if (!user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Utilisateur non trouvé:', email);
        }
        return res.status(401).json({ error: 'Identifiants invalides' });
      }

      if (!user.isActive) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Utilisateur inactif:', email);
        }
        return res.status(401).json({ error: 'Votre compte a été désactivé. Contactez l\'administrateur.' });
      }

      if (
        user.role === 'STUDENT' &&
        user.studentProfile &&
        user.studentProfile.enrollmentStatus === 'SUSPENDED'
      ) {
        return res.status(403).json({
          error:
            'Votre inscription est suspendue. Vous ne pouvez pas accéder à l’espace élève. Contactez l’administration.',
          code: 'ENROLLMENT_SUSPENDED',
        });
      }

      // Vérifier le mot de passe (bcrypt peut lever si le hash stocké est invalide)
      let isValidPassword = false;
      try {
        isValidPassword = await comparePassword(password, user.password);
      } catch (compareErr: any) {
        console.error('Erreur bcrypt.compare (hash invalide en base ?):', compareErr);
        return res.status(500).json({
          error:
            'Erreur de vérification du mot de passe. Réinitialisez le mot de passe ou contactez un administrateur.',
        });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Vérification du mot de passe:', {
          email,
          isValid: isValidPassword,
        });
      }

      if (!isValidPassword) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Mot de passe incorrect pour:', email);
        }
        return res.status(401).json({ error: 'Identifiants invalides' });
      }

      // Générer le token
      let token: string;
      try {
        token = generateToken(user.id, user.email, user.role);
      } catch (jwtErr: any) {
        console.error('Erreur JWT generateToken:', jwtErr);
        return res.status(500).json({
          error:
            jwtErr?.message ||
            'Impossible de générer la session. Vérifiez JWT_SECRET et JWT_EXPIRES_IN sur le serveur.',
        });
      }

      // Retourner les données utilisateur (sans le mot de passe)
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: 'Connexion réussie',
        user: userWithoutPassword,
        token,
      });
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);
      res.status(500).json({ 
        error: error.message || 'Erreur serveur lors de la connexion',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// Mettre à jour le profil de l'utilisateur
router.put('/me', authenticate, async (req: any, res) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        teacherProfile: true,
        studentProfile: {
          include: {
            class: true,
          },
        },
        parentProfile: true,
      },
    });

    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer le profil de l'utilisateur connecté
router.get('/me', authenticate, async (req: any, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        teacherProfile: {
          select: {
            id: true,
            employeeId: true,
            specialization: true,
            hireDate: true,
            contractType: true,
            salary: true,
          },
        },
        studentProfile: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
            parents: {
              include: {
                parent: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        parentProfile: {
          include: {
            students: {
              include: {
                student: {
                  include: {
                    class: {
                      select: {
                        id: true,
                        name: true,
                        level: true,
                      },
                    },
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Erreur dans /auth/me:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Demande de réinitialisation de mot de passe
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Email invalide')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Pour la sécurité, ne pas révéler si l'email existe
      // On retourne toujours le même message
      if (!user || !user.isActive) {
        return res.json({
          message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
        });
      }

      // Créer un token de réinitialisation
      const token = await createPasswordResetToken(user.id);

      // Envoyer l'email de réinitialisation
      await sendPasswordResetEmail(email, token, user.firstName);

      res.json({
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
      });
    } catch (error: any) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

// Réinitialisation de mot de passe avec token
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token requis'),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password } = req.body;

      // Vérifier le token
      const tokenVerification = await verifyResetToken(token);
      if (!tokenVerification.valid || !tokenVerification.userId) {
        return res.status(400).json({ error: 'Token invalide ou expiré' });
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await hashPassword(password);

      // Mettre à jour le mot de passe de l'utilisateur
      await prisma.user.update({
        where: { id: tokenVerification.userId },
        data: { password: hashedPassword },
      });

      // Marquer le token comme utilisé
      await markTokenAsUsed(token);

      // Enregistrer l'événement de sécurité
      await prisma.securityEvent.create({
        data: {
          userId: tokenVerification.userId,
          type: 'password_reset',
          description: 'Mot de passe réinitialisé via le lien de réinitialisation',
          severity: 'info',
        },
      });

      res.json({
        message: 'Mot de passe réinitialisé avec succès',
      });
    } catch (error: any) {
      console.error('Erreur lors de la réinitialisation:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

export default router;

