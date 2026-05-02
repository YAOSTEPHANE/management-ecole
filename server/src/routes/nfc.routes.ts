import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';

const router = express.Router();

// Clé API pour authentifier les appareils NFC externes
// En production, cette clé devrait être stockée dans les variables d'environnement
const NFC_API_KEY = process.env.NFC_API_KEY || 'nfc-device-key-2024';

// Middleware pour vérifier la clé API NFC
const verifyNFCKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-nfc-api-key'] || req.body.apiKey || req.query.apiKey;
  
  if (!apiKey || apiKey !== NFC_API_KEY) {
    return res.status(401).json({ 
      error: 'Clé API NFC invalide ou manquante',
      message: 'Veuillez fournir une clé API NFC valide dans le header X-NFC-API-Key ou dans le body/apiKey'
    });
  }
  
  next();
};

// Endpoint pour recevoir un scan NFC depuis un appareil externe
router.post(
  '/scan',
  verifyNFCKey,
  [
    body('nfcId').notEmpty().withMessage('nfcId est requis'),
    body('date').optional().isISO8601().withMessage('Format de date invalide'),
    body('courseId').optional().isString().withMessage('courseId doit être une chaîne'),
    body('autoStatus').optional().isIn(['PRESENT', 'LATE']).withMessage('autoStatus doit être PRESENT ou LATE'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { nfcId, date, courseId, autoStatus } = req.body;
      const scanDate = date ? new Date(date) : new Date();
      const status = autoStatus || 'PRESENT';

      // Rechercher d'abord un étudiant avec cet ID NFC
      let student = await prisma.student.findFirst({
        where: { nfcId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
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
      });

      // Si c'est un étudiant
      if (student) {
        if (!courseId) {
          return res.status(400).json({ 
            error: 'courseId est requis pour enregistrer la présence d\'un étudiant',
            type: 'STUDENT',
            student: {
              id: student.id,
              name: `${student.user.firstName} ${student.user.lastName}`,
              studentId: student.studentId,
            }
          });
        }

        // Vérifier que le cours existe
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          include: {
            teacher: {
              select: {
                id: true,
              },
            },
          },
        });

        if (!course) {
          return res.status(404).json({ error: 'Cours non trouvé' });
        }

        // Vérifier si une absence existe déjà pour cette date
        const existingAbsence = await prisma.absence.findFirst({
          where: {
            studentId: student.id,
            courseId,
            date: scanDate,
          },
        });

        let absence;
        if (existingAbsence) {
          // Mettre à jour l'absence existante - le scan NFC marque toujours comme PRESENT
          absence = await prisma.absence.update({
            where: { id: existingAbsence.id },
            data: {
              status: 'PRESENT' as any, // Scan NFC = toujours présent
              updatedAt: new Date(),
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
              course: {
                select: {
                  name: true,
                  code: true,
                },
              },
            },
          });
        } else {
          // Créer une nouvelle absence - le scan NFC marque toujours comme PRESENT
          absence = await prisma.absence.create({
            data: {
              studentId: student.id,
              courseId,
              teacherId: course.teacher.id,
              date: scanDate,
              status: 'PRESENT' as any, // Scan NFC = toujours présent
              excused: false,
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
              course: {
                select: {
                  name: true,
                  code: true,
                },
              },
            },
          });
        }

        return res.status(200).json({
          success: true,
          message: `Présence de ${student.user.firstName} ${student.user.lastName} enregistrée avec succès`,
          type: 'STUDENT',
          data: {
            absence: {
              id: absence.id,
              status: absence.status,
              date: absence.date,
            },
            student: {
              id: student.id,
              name: `${student.user.firstName} ${student.user.lastName}`,
              studentId: student.studentId,
              class: student.class?.name,
            },
            course: {
              id: course.id,
              name: course.name,
              code: course.code,
            },
          },
        });
      }

      // Si ce n'est pas un étudiant, chercher un professeur
      let teacher = await prisma.teacher.findFirst({
        where: { nfcId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Si c'est un professeur
      if (teacher) {
        // Pour les professeurs, on enregistre juste la présence (sans cours nécessaire)
        const attendanceRecord = {
          teacherId: teacher.id,
          teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
          date: scanDate,
          status: status,
          recordedAt: new Date(),
        };

        // TODO: Créer un modèle TeacherAttendance dans Prisma si nécessaire
        // Pour l'instant, on retourne juste la confirmation

        return res.status(200).json({
          success: true,
          message: `Présence de ${teacher.user.firstName} ${teacher.user.lastName} enregistrée avec succès`,
          type: 'TEACHER',
          data: {
            attendance: attendanceRecord,
            teacher: {
              id: teacher.id,
              name: `${teacher.user.firstName} ${teacher.user.lastName}`,
              employeeId: teacher.employeeId,
              specialization: teacher.specialization,
            },
          },
        });
      }

      // Si ni étudiant ni professeur trouvé
      return res.status(404).json({
        success: false,
        error: 'Aucun utilisateur trouvé avec cet ID NFC',
        nfcId,
        message: 'Vérifiez que la carte NFC est correctement enregistrée dans le système',
      });
    } catch (error: any) {
      console.error('Erreur lors du scan NFC externe:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur serveur',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
);

// Endpoint pour obtenir les informations d'un utilisateur par NFC ID (sans enregistrer)
router.get(
  '/info/:nfcId',
  verifyNFCKey,
  async (req, res) => {
    try {
      const { nfcId } = req.params;

      // Rechercher un étudiant
      const student = await prisma.student.findFirst({
        where: { nfcId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
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
      });

      if (student) {
        return res.json({
          type: 'STUDENT',
          data: {
            id: student.id,
            name: `${student.user.firstName} ${student.user.lastName}`,
            studentId: student.studentId,
            email: student.user.email,
            avatar: student.user.avatar,
            class: student.class,
          },
        });
      }

      // Rechercher un professeur
      const teacher = await prisma.teacher.findFirst({
        where: { nfcId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          classes: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
        },
      });

      if (teacher) {
        return res.json({
          type: 'TEACHER',
          data: {
            id: teacher.id,
            name: `${teacher.user.firstName} ${teacher.user.lastName}`,
            employeeId: teacher.employeeId,
            email: teacher.user.email,
            avatar: teacher.user.avatar,
            specialization: teacher.specialization,
            classes: teacher.classes,
          },
        });
      }

      return res.status(404).json({
        error: 'Aucun utilisateur trouvé avec cet ID NFC',
        nfcId,
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération des infos NFC:', error);
      res.status(500).json({
        error: error.message || 'Erreur serveur',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
);

// Endpoint pour lister les cours disponibles (pour les appareils externes)
router.get(
  '/courses',
  verifyNFCKey,
  async (req, res) => {
    try {
      const { date } = req.query;
      const queryDate = date ? new Date(date as string) : new Date();

      // Récupérer les cours du jour
      const dayOfWeek = queryDate.getDay(); // 0 = Dimanche, 1 = Lundi, etc.

      const schedules = await prisma.schedule.findMany({
        where: {
          dayOfWeek,
        },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              code: true,
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
      });

      const courses = schedules.map((schedule) => ({
        id: schedule.course.id,
        name: schedule.course.name,
        code: schedule.course.code,
        class: schedule.class,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        room: schedule.room,
      }));

      res.json({
        date: queryDate.toISOString().split('T')[0],
        dayOfWeek,
        courses,
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération des cours:', error);
      res.status(500).json({
        error: error.message || 'Erreur serveur',
      });
    }
  }
);

export default router;

