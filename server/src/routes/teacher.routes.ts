import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate);
router.use(authorize('TEACHER'));

// Helper pour obtenir le teacherId depuis userId
const getTeacherId = async (userId: string) => {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: { id: true },
  });
  return teacher?.id;
};

// ========== GESTION DES NOTES ==========

// Lister les notes d'un cours
router.get('/courses/:courseId/grades', async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;
    const teacherId = await getTeacherId(req.user!.id);

    if (!teacherId) {
      return res.status(404).json({ error: 'Profil enseignant non trouvé' });
    }

    const grades = await prisma.grade.findMany({
      where: {
        courseId,
        teacherId, // Vérifier que c'est bien le professeur du cours
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
        course: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    res.json(grades);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une note
router.post(
  '/grades',
  [
    body('studentId').notEmpty(),
    body('courseId').notEmpty(),
    body('evaluationType').isIn(['EXAM', 'QUIZ', 'HOMEWORK', 'PROJECT', 'ORAL']),
    body('title').notEmpty(),
    body('score').isFloat({ min: 0 }),
    body('maxScore').isFloat({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        studentId,
        courseId,
        evaluationType,
        title,
        score,
        maxScore,
        coefficient,
        date,
        comments,
      } = req.body;

      const teacherId = await getTeacherId(req.user!.id);

      if (!teacherId) {
        return res.status(404).json({ error: 'Profil enseignant non trouvé' });
      }

      // Vérifier que le professeur enseigne ce cours
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          teacherId,
        },
      });

      if (!course) {
        return res.status(403).json({ error: 'Vous n\'enseignez pas ce cours' });
      }

      const grade = await prisma.grade.create({
        data: {
          studentId,
          courseId,
          teacherId,
          evaluationType,
          title,
          score: parseFloat(score),
          maxScore: parseFloat(maxScore) || 20,
          coefficient: parseFloat(coefficient) || 1,
          date: date ? new Date(date) : new Date(),
          comments,
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
          course: true,
        },
      });

      res.status(201).json(grade);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Mettre à jour une note
router.put('/grades/:id', async (req: AuthRequest, res) => {
  try {
    const { title, score, maxScore, coefficient, comments } = req.body;

    const teacherId = await getTeacherId(req.user!.id);

    if (!teacherId) {
      return res.status(404).json({ error: 'Profil enseignant non trouvé' });
    }

    const grade = await prisma.grade.findUnique({
      where: { id: req.params.id },
    });

    if (!grade || grade.teacherId !== teacherId) {
      return res.status(404).json({ error: 'Note non trouvée' });
    }

    const updatedGrade = await prisma.grade.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(score !== undefined && { score: parseFloat(score) }),
        ...(maxScore !== undefined && { maxScore: parseFloat(maxScore) }),
        ...(coefficient !== undefined && { coefficient: parseFloat(coefficient) }),
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
        course: true,
      },
    });

    res.json(updatedGrade);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer une note
router.delete('/grades/:id', async (req: AuthRequest, res) => {
  try {
      const teacherId = await getTeacherId(req.user!.id);

      if (!teacherId) {
        return res.status(404).json({ error: 'Profil enseignant non trouvé' });
      }

      const grade = await prisma.grade.findUnique({
        where: { id: req.params.id },
      });

      if (!grade || grade.teacherId !== teacherId) {
        return res.status(404).json({ error: 'Note non trouvée' });
      }

      await prisma.grade.delete({
        where: { id: req.params.id },
      });

    res.json({ message: 'Note supprimée' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== GESTION DES ABSENCES ==========

// Rechercher un élève par NFC ID (pour la prise de présence)
router.get('/students/nfc/:nfcId', async (req: AuthRequest, res) => {
  try {
    const { nfcId } = req.params;

    const student = await prisma.student.findFirst({
      where: { nfcId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
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

    if (!student) {
      return res.status(404).json({ error: 'Aucun élève trouvé avec cet ID NFC' });
    }

    res.json(student);
  } catch (error: any) {
    console.error('Error fetching student by NFC ID:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Enregistrer automatiquement la présence d'un étudiant via NFC
router.post(
  '/absences/nfc-attendance',
  [
    body('courseId').notEmpty(),
    body('studentId').notEmpty(),
    body('date').isISO8601(),
    body('status').isIn(['PRESENT', 'ABSENT', 'LATE']),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { courseId, studentId, date, status } = req.body;

      const teacherId = await getTeacherId(req.user!.id);

      if (!teacherId) {
        return res.status(404).json({ error: 'Profil enseignant non trouvé' });
      }

      // Vérifier que le professeur enseigne ce cours
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          teacherId,
        },
      });

      if (!course) {
        return res.status(403).json({ error: 'Vous n\'enseignez pas ce cours' });
      }

      // Vérifier si une absence existe déjà pour cette date
      const existingAbsence = await prisma.absence.findFirst({
        where: {
          studentId,
          courseId,
          date: new Date(date),
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
          },
        });
      } else {
        // Créer une nouvelle absence - le scan NFC marque toujours comme PRESENT
        absence = await prisma.absence.create({
          data: {
            studentId,
            courseId,
            teacherId,
            date: new Date(date),
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
          },
        });
      }

      res.status(201).json(absence);
    } catch (error: any) {
      console.error('Error recording NFC attendance:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

// Initialiser la prise d'appel (marquer tous les élèves comme ABSENT)
router.post(
  '/absences/init-attendance',
  [
    body('courseId').notEmpty(),
    body('date').isISO8601(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { courseId, date } = req.body;

      const teacherId = await getTeacherId(req.user!.id);

      if (!teacherId) {
        return res.status(404).json({ error: 'Profil enseignant non trouvé' });
      }

      // Vérifier que le professeur enseigne ce cours
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          teacherId,
        },
        include: {
          class: {
            include: {
              students: {
                where: {
                  isActive: true,
                },
              },
            },
          },
        },
      });

      if (!course) {
        return res.status(403).json({ error: 'Vous n\'enseignez pas ce cours' });
      }

      const students = course.class?.students || [];
      const attendanceDate = new Date(date);
      const startOfDay = new Date(attendanceDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

      // Supprimer les pointages existants pour ce cours et cette date
      await prisma.absence.deleteMany({
        where: {
          courseId,
          date: { gte: startOfDay, lt: endOfDay },
        },
      });

      // Créer une absence ABSENT pour tous les élèves
      const absences = await Promise.all(
        students.map((student: any) =>
          prisma.absence.create({
            data: {
              studentId: student.id,
              courseId,
              teacherId,
              date: attendanceDate,
              status: 'ABSENT',
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
            },
          })
        )
      );

      res.status(201).json({
        message: `Prise d'appel initialisée: ${absences.length} élèves marqués comme absents`,
        absences,
        total: absences.length,
      });
    } catch (error: any) {
      console.error('Error initializing attendance:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

// Prendre l'appel (créer plusieurs absences)
router.post(
  '/absences/take-attendance',
  [
    body('courseId').notEmpty(),
    body('date').isISO8601(),
    body('attendance').isArray(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { courseId, date, attendance } = req.body;

      const teacherId = await getTeacherId(req.user!.id);

      if (!teacherId) {
        return res.status(404).json({ error: 'Profil enseignant non trouvé' });
      }

      // Vérifier que le professeur enseigne ce cours
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          teacherId,
        },
      });

      if (!course) {
        return res.status(403).json({ error: 'Vous n\'enseignez pas ce cours' });
      }

      const attendanceDate = new Date(date);
      const startOfDay = new Date(attendanceDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

      // Supprimer les pointages existants pour ce cours et cette date (réécriture complète)
      await prisma.absence.deleteMany({
        where: {
          courseId,
          date: { gte: startOfDay, lt: endOfDay },
        },
      });

      // Créer les pointages (présent / absent / retard)
      const absences = await Promise.all(
        attendance.map((att: any) =>
          prisma.absence.create({
            data: {
              studentId: att.studentId,
              courseId,
              teacherId,
              date: attendanceDate,
              status: att.status || 'ABSENT',
              reason: att.reason ?? undefined,
              excused: att.excused || false,
            },
          })
        )
      );

      res.status(201).json(absences);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ========== GESTION DE LA CONDUITE (PROFESSEUR PRINCIPAL) ==========

// Obtenir les évaluations de conduite pour les élèves de mes classes
router.get('/conduct', async (req: AuthRequest, res) => {
  try {
    const { period, academicYear } = req.query;

    const teacherId = await getTeacherId(req.user!.id);

    if (!teacherId) {
      return res.status(404).json({ error: 'Profil enseignant non trouvé' });
    }

    // Récupérer les classes où je suis professeur principal
    const classes = await prisma.class.findMany({
      where: {
        teacherId,
      },
      include: {
        students: {
          include: {
            conducts: {
              where: {
                ...(period && { period: period as string }),
                ...(academicYear && { academicYear: academicYear as string }),
              },
              include: {
                evaluatedBy: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Extraire toutes les évaluations de conduite
    const conducts = classes.flatMap((cls) =>
      cls.students.flatMap((student) => student.conducts)
    );

    res.json(conducts);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des évaluations de conduite:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Créer ou mettre à jour une évaluation de conduite (Professeur principal)
router.post('/conduct', async (req: AuthRequest, res) => {
  try {
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

    if (!studentId || !period || !academicYear) {
      return res.status(400).json({ error: 'studentId, period et academicYear sont requis' });
    }

    const teacherId = await getTeacherId(req.user!.id);

    if (!teacherId) {
      return res.status(404).json({ error: 'Profil enseignant non trouvé' });
    }

    // Vérifier que l'étudiant existe et que je suis son professeur principal
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        class: {
          teacherId,
        },
      },
      include: {
        class: true,
      },
    });

    if (!student) {
      return res.status(403).json({ error: 'Vous n\'êtes pas le professeur principal de cet élève' });
    }

    // Calculer la moyenne
    const avg = (parseFloat(punctuality || 0) + parseFloat(respect || 0) + 
                 parseFloat(participation || 0) + parseFloat(behavior || 0)) / 4;

    // Créer ou mettre à jour l'évaluation de conduite
    const conduct = await prisma.conduct.upsert({
      where: {
        studentId_period_academicYear: {
          studentId,
          period,
          academicYear,
        },
      },
      update: {
        punctuality: parseFloat(punctuality || 0),
        respect: parseFloat(respect || 0),
        participation: parseFloat(participation || 0),
        behavior: parseFloat(behavior || 0),
        average: avg,
        comments: comments || null,
        evaluatedById: req.user!.id,
        evaluatedByRole: 'TEACHER',
      },
      create: {
        studentId,
        period,
        academicYear,
        punctuality: parseFloat(punctuality || 0),
        respect: parseFloat(respect || 0),
        participation: parseFloat(participation || 0),
        behavior: parseFloat(behavior || 0),
        average: avg,
        comments: comments || null,
        evaluatedById: req.user!.id,
        evaluatedByRole: 'TEACHER',
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
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json(conduct);
  } catch (error: any) {
    console.error('Erreur lors de la création/mise à jour de l\'évaluation de conduite:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Mettre à jour une évaluation de conduite (Professeur principal)
router.put('/conduct/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      punctuality,
      respect,
      participation,
      behavior,
      comments,
    } = req.body;

    const teacherId = await getTeacherId(req.user!.id);

    if (!teacherId) {
      return res.status(404).json({ error: 'Profil enseignant non trouvé' });
    }

    const conduct = await prisma.conduct.findFirst({
      where: {
        id,
        student: {
          class: {
            teacherId,
          },
        },
      },
    });

    if (!conduct) {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à modifier cette évaluation' });
    }

    // Calculer la nouvelle moyenne
    const avg = (parseFloat(punctuality || conduct.punctuality) + 
                 parseFloat(respect || conduct.respect) + 
                 parseFloat(participation || conduct.participation) + 
                 parseFloat(behavior || conduct.behavior)) / 4;

    const updatedConduct = await prisma.conduct.update({
      where: { id },
      data: {
        ...(punctuality !== undefined && { punctuality: parseFloat(punctuality) }),
        ...(respect !== undefined && { respect: parseFloat(respect) }),
        ...(participation !== undefined && { participation: parseFloat(participation) }),
        ...(behavior !== undefined && { behavior: parseFloat(behavior) }),
        average: avg,
        ...(comments !== undefined && { comments }),
        evaluatedById: req.user!.id,
        evaluatedByRole: 'TEACHER',
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
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    res.json(updatedConduct);
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de l\'évaluation de conduite:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Lister les absences d'un cours
router.get('/courses/:courseId/absences', async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;
    const { date } = req.query;

    const teacherId = await getTeacherId(req.user!.id);

    if (!teacherId) {
      return res.status(404).json({ error: 'Profil enseignant non trouvé' });
    }

    const absences = await prisma.absence.findMany({
      where: {
        courseId,
        teacherId,
        ...(date && {
          date: {
            gte: new Date(date as string),
            lt: new Date(new Date(date as string).getTime() + 24 * 60 * 60 * 1000),
          },
        }),
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
        course: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    res.json(absences);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== CAHIER DE TEXTE (DEVOIRS) ==========

// Créer un devoir
router.post(
  '/assignments',
  [
    body('courseId').notEmpty(),
    body('title').notEmpty(),
    body('dueDate').isISO8601(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { courseId, title, description, dueDate, attachments } = req.body;

      const teacherId = await getTeacherId(req.user!.id);

      if (!teacherId) {
        return res.status(404).json({ error: 'Profil enseignant non trouvé' });
      }

      // Vérifier que le professeur enseigne ce cours
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          teacherId,
        },
        include: {
          class: {
            include: {
              students: true,
            },
          },
        },
      });

      if (!course) {
        return res.status(403).json({ error: 'Vous n\'enseignez pas ce cours' });
      }

      const assignment = await prisma.assignment.create({
        data: {
          courseId,
          teacherId,
          title,
          description,
          dueDate: new Date(dueDate),
          attachments: attachments || [],
        },
        include: {
          course: true,
        },
      });

      // Créer les entrées pour chaque élève de la classe
      if (course.class?.students) {
        await Promise.all(
          course.class.students.map((student) =>
            prisma.studentAssignment.create({
              data: {
                studentId: student.id,
                assignmentId: assignment.id,
              },
            })
          )
        );
      }

      res.status(201).json(assignment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Lister les devoirs d'un cours
router.get('/courses/:courseId/assignments', async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;

    const teacherId = await getTeacherId(req.user!.id);

    if (!teacherId) {
      return res.status(404).json({ error: 'Profil enseignant non trouvé' });
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        courseId,
        teacherId,
      },
      include: {
        students: {
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
        },
      },
      orderBy: {
        dueDate: 'desc',
      },
    });

    res.json(assignments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== MES COURS ==========

// Lister les cours de l'enseignant
router.get('/courses', async (req: AuthRequest, res) => {
  try {
    const teacherId = await getTeacherId(req.user!.id);

    if (!teacherId) {
      return res.status(404).json({ error: 'Profil enseignant non trouvé' });
    }

    const courses = await prisma.course.findMany({
      where: {
        teacherId,
      },
      include: {
        class: {
          include: {
            students: {
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
        _count: {
          select: {
            grades: true,
            absences: true,
          },
        },
      },
    });

    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ESPACE PERSONNEL ENSEIGNANT ==========

const DAY_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DAY_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const teacherId = await getTeacherId(req.user!.id);
    if (!teacherId) {
      return res.status(404).json({ error: 'Profil enseignant non trouvé' });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
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
          },
        },
        classes: {
          select: {
            id: true,
            name: true,
            level: true,
            academicYear: true,
            room: true,
          },
        },
        courses: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            class: { select: { id: true, name: true, level: true } },
          },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Profil enseignant non trouvé' });
    }

    res.json(teacher);
  } catch (error: any) {
    console.error('GET /teacher/profile:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.get('/schedule', async (req: AuthRequest, res) => {
  try {
    const teacherId = await getTeacherId(req.user!.id);
    if (!teacherId) {
      return res.status(404).json({ error: 'Profil enseignant non trouvé' });
    }

    const courses = await prisma.course.findMany({
      where: { teacherId },
      include: {
        class: { select: { id: true, name: true, level: true } },
        schedule: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
      },
    });

    const slots = courses.flatMap((c) =>
      c.schedule.map((s) => ({
        courseId: c.id,
        courseName: c.name,
        courseCode: c.code,
        classId: c.class.id,
        className: c.class.name,
        classLevel: c.class.level,
        dayOfWeek: s.dayOfWeek,
        dayLabel: DAY_LABELS[s.dayOfWeek] ?? `J${s.dayOfWeek}`,
        dayShort: DAY_SHORT[s.dayOfWeek] ?? String(s.dayOfWeek),
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room,
      }))
    );

    slots.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.startTime.localeCompare(b.startTime);
    });

    res.json({ courses, slots });
  } catch (error: any) {
    console.error('GET /teacher/schedule:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.get('/performance-reviews', async (req: AuthRequest, res) => {
  try {
    const teacherId = await getTeacherId(req.user!.id);
    if (!teacherId) {
      return res.status(404).json({ error: 'Profil enseignant non trouvé' });
    }

    const reviews = await prisma.teacherPerformanceReview.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reviews);
  } catch (error: any) {
    console.error('GET /teacher/performance-reviews:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.get('/leaves', async (req: AuthRequest, res) => {
  try {
    const teacherId = await getTeacherId(req.user!.id);
    if (!teacherId) {
      return res.status(404).json({ error: 'Profil enseignant non trouvé' });
    }

    const leaves = await prisma.teacherLeave.findMany({
      where: { teacherId },
      orderBy: { startDate: 'desc' },
    });

    res.json(leaves);
  } catch (error: any) {
    console.error('GET /teacher/leaves:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.post(
  '/leaves',
  [
    body('type').isIn(['ANNUAL', 'SICK', 'PERSONAL', 'TRAINING', 'OTHER']),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('reason').optional().isString().isLength({ max: 2000 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const teacherId = await getTeacherId(req.user!.id);
      if (!teacherId) {
        return res.status(404).json({ error: 'Profil enseignant non trouvé' });
      }

      const { type, startDate, endDate, reason } = req.body;
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        return res.status(400).json({ error: 'La date de fin doit être après la date de début' });
      }

      const leave = await prisma.teacherLeave.create({
        data: {
          teacherId,
          type,
          startDate: start,
          endDate: end,
          reason: reason?.trim() || null,
        },
      });

      res.status(201).json(leave);
    } catch (error: any) {
      console.error('POST /teacher/leaves:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

export default router;

