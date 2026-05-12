import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { decryptStudentRecord } from '../utils/student-sensitive-crypto.util';

const router = express.Router();

router.use(authenticate);
router.use(authorize('EDUCATOR'));

// Helper pour obtenir le educatorId depuis userId
const getEducatorId = async (userId: string) => {
  const educator = await prisma.educator.findUnique({
    where: { userId },
    select: { id: true },
  });
  return educator?.id;
};

router.get('/notifications', async (req: AuthRequest, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(notifications);
  } catch (error: unknown) {
    console.error('GET /educator/notifications:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur serveur' });
  }
});

router.put('/notifications/read-all', async (req: AuthRequest, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true, readAt: new Date() },
    });
    res.json({ ok: true });
  } catch (error: unknown) {
    console.error('PUT /educator/notifications/read-all:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur serveur' });
  }
});

router.put('/notifications/:id/read', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.notification.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }
    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });
    res.json(notification);
  } catch (error: unknown) {
    console.error('PUT /educator/notifications/:id/read:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur serveur' });
  }
});

// ========== PROFIL ÉDUCATEUR ==========

// Obtenir le profil de l'éducateur
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const educator = await prisma.educator.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!educator) {
      return res.status(404).json({ error: 'Profil éducateur non trouvé' });
    }

    res.json(educator);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour le profil de l'éducateur
router.put(
  '/profile',
  [
    body('phone').optional().isString(),
    body('avatar').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { phone, avatar } = req.body;

      // Mettre à jour l'utilisateur
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          ...(phone !== undefined && { phone }),
          ...(avatar !== undefined && { avatar }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
        },
      });

      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ========== GESTION DES ÉLÈVES ==========

// Lister tous les élèves
router.get('/students', async (req: AuthRequest, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            isActive: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
      orderBy: {
        user: {
          lastName: 'asc',
        },
      },
    });

    res.json(
      students.map((s) => decryptStudentRecord(s as Record<string, unknown>))
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les détails d'un élève
router.get('/students/:studentId', async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.params;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            isActive: true,
          },
        },
        class: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        absences: {
          include: {
            course: true,
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
          take: 10,
        },
        conducts: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        grades: {
          include: {
            course: true,
          },
          orderBy: {
            date: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    res.json(decryptStudentRecord(student as Record<string, unknown>));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== GESTION DE LA CONDUITE ==========

// Lister les évaluations de conduite
router.get('/conducts', async (req: AuthRequest, res) => {
  try {
    const educatorId = await getEducatorId(req.user!.id);

    if (!educatorId) {
      return res.status(404).json({ error: 'Profil éducateur non trouvé' });
    }

    const { studentId, period, academicYear } = req.query;

    const conducts = await prisma.conduct.findMany({
      where: {
        ...(studentId && { studentId: studentId as string }),
        ...(period && { period: period as string }),
        ...(academicYear && { academicYear: academicYear as string }),
        evaluatedByRole: 'EDUCATOR',
        evaluatedById: req.user!.id,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            class: {
              select: {
                name: true,
                level: true,
              },
            },
          },
        },
        evaluatedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(conducts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Créer ou mettre à jour une évaluation de conduite
router.post(
  '/conducts',
  [
    body('studentId').notEmpty().withMessage('ID élève requis'),
    body('period').notEmpty().withMessage('Période requise'),
    body('academicYear').notEmpty().withMessage('Année scolaire requise'),
    body('punctuality').isFloat({ min: 0, max: 20 }).withMessage('Ponctualité entre 0 et 20'),
    body('respect').isFloat({ min: 0, max: 20 }).withMessage('Respect entre 0 et 20'),
    body('participation').isFloat({ min: 0, max: 20 }).withMessage('Participation entre 0 et 20'),
    body('behavior').isFloat({ min: 0, max: 20 }).withMessage('Comportement entre 0 et 20'),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const educatorId = await getEducatorId(req.user!.id);

      if (!educatorId) {
        return res.status(404).json({ error: 'Profil éducateur non trouvé' });
      }

      const {
        studentId,
        period,
        academicYear,
        punctuality,
        respect,
        participation,
        behavior,
        comments,
      } = req.body;

      // Calculer la moyenne
      const average = (punctuality + respect + participation + behavior) / 4;

      // Vérifier si une évaluation existe déjà
      const existingConduct = await prisma.conduct.findUnique({
        where: {
          studentId_period_academicYear: {
            studentId,
            period,
            academicYear,
          },
        },
      });

      let conduct;

      if (existingConduct) {
        // Mettre à jour l'évaluation existante
        conduct = await prisma.conduct.update({
          where: { id: existingConduct.id },
          data: {
            punctuality,
            respect,
            participation,
            behavior,
            average,
            comments,
            evaluatedById: req.user!.id,
            evaluatedByRole: 'EDUCATOR',
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        });
      } else {
        // Créer une nouvelle évaluation
        conduct = await prisma.conduct.create({
          data: {
            studentId,
            period,
            academicYear,
            punctuality,
            respect,
            participation,
            behavior,
            average,
            comments,
            evaluatedById: req.user!.id,
            evaluatedByRole: 'EDUCATOR',
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        });
      }

      res.status(201).json(conduct);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Une évaluation existe déjà pour cette période' });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// Obtenir une évaluation de conduite spécifique
router.get('/conducts/:conductId', async (req: AuthRequest, res) => {
  try {
    const { conductId } = req.params;

    const conduct = await prisma.conduct.findUnique({
      where: { id: conductId },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            class: {
              select: {
                name: true,
                level: true,
              },
            },
          },
        },
        evaluatedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!conduct) {
      return res.status(404).json({ error: 'Évaluation de conduite non trouvée' });
    }

    // Vérifier que l'éducateur a le droit de voir cette évaluation
    if (conduct.evaluatedByRole !== 'EDUCATOR' || conduct.evaluatedById !== req.user!.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    res.json(conduct);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour une évaluation de conduite
router.put(
  '/conducts/:conductId',
  [
    body('punctuality').optional().isFloat({ min: 0, max: 20 }),
    body('respect').optional().isFloat({ min: 0, max: 20 }),
    body('participation').optional().isFloat({ min: 0, max: 20 }),
    body('behavior').optional().isFloat({ min: 0, max: 20 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { conductId } = req.params;
      const { punctuality, respect, participation, behavior, comments } = req.body;

      // Vérifier que l'évaluation existe et appartient à cet éducateur
      const existingConduct = await prisma.conduct.findUnique({
        where: { id: conductId },
      });

      if (!existingConduct) {
        return res.status(404).json({ error: 'Évaluation de conduite non trouvée' });
      }

      if (existingConduct.evaluatedByRole !== 'EDUCATOR' || existingConduct.evaluatedById !== req.user!.id) {
        return res.status(403).json({ error: 'Accès refusé' });
      }

      // Calculer la nouvelle moyenne si les notes changent
      const newPunctuality = punctuality !== undefined ? punctuality : existingConduct.punctuality;
      const newRespect = respect !== undefined ? respect : existingConduct.respect;
      const newParticipation = participation !== undefined ? participation : existingConduct.participation;
      const newBehavior = behavior !== undefined ? behavior : existingConduct.behavior;
      const average = (newPunctuality + newRespect + newParticipation + newBehavior) / 4;

      const updatedConduct = await prisma.conduct.update({
        where: { id: conductId },
        data: {
          ...(punctuality !== undefined && { punctuality }),
          ...(respect !== undefined && { respect }),
          ...(participation !== undefined && { participation }),
          ...(behavior !== undefined && { behavior }),
          average,
          ...(comments !== undefined && { comments }),
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      res.json(updatedConduct);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.delete('/conducts/:conductId', async (req: AuthRequest, res) => {
  try {
    const { conductId } = req.params;

    const existingConduct = await prisma.conduct.findUnique({
      where: { id: conductId },
      select: {
        id: true,
        evaluatedByRole: true,
        evaluatedById: true,
      },
    });

    if (!existingConduct) {
      return res.status(404).json({ error: 'Évaluation de conduite non trouvée' });
    }

    if (
      existingConduct.evaluatedByRole !== 'EDUCATOR' ||
      existingConduct.evaluatedById !== req.user!.id
    ) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    await prisma.conduct.delete({
      where: { id: conductId },
    });

    res.json({ message: 'Évaluation supprimée avec succès' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== STATISTIQUES ==========

// Obtenir les statistiques de l'éducateur
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const educatorId = await getEducatorId(req.user!.id);

    if (!educatorId) {
      return res.status(404).json({ error: 'Profil éducateur non trouvé' });
    }

    const totalStudents = await prisma.student.count({
      where: { isActive: true },
    });

    const totalConducts = await prisma.conduct.count({
      where: {
        evaluatedByRole: 'EDUCATOR',
        evaluatedById: req.user!.id,
      },
    });

    const recentConducts = await prisma.conduct.count({
      where: {
        evaluatedByRole: 'EDUCATOR',
        evaluatedById: req.user!.id,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 derniers jours
        },
      },
    });

    res.json({
      totalStudents,
      totalConducts,
      recentConducts,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
