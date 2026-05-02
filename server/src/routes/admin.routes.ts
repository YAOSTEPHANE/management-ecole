import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { hashPassword } from '../utils/password.util';
import prisma from '../utils/prisma';
import { deleteUploadedFileByPublicUrl } from '../utils/deleteUpload.util';

const router = express.Router();

// Toutes les routes nécessitent une authentification et le rôle ADMIN
router.use(authenticate);
router.use(authorize('ADMIN'));

// ========== GESTION DES ÉLÈVES ==========

// Rechercher un élève par NFC ID
router.get('/students/nfc/:nfcId', async (req, res) => {
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
        parents: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    phone: true,
                  },
                },
              },
            },
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

// Lister tous les élèves
router.get('/students', async (req, res) => {
  try {
    const { classId, isActive, enrollmentStatus } = req.query;

    const students = await prisma.student.findMany({
      where: {
        ...(classId && { classId: classId as string }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
        ...(enrollmentStatus &&
          typeof enrollmentStatus === 'string' && {
            enrollmentStatus: enrollmentStatus as 'ACTIVE' | 'SUSPENDED' | 'GRADUATED',
          }),
      },
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
    });

    res.json(students);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un élève
router.post(
  '/students',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('studentId').notEmpty(),
    body('dateOfBirth').isISO8601(),
    body('gender').isIn(['MALE', 'FEMALE', 'OTHER']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        studentId,
        dateOfBirth,
        gender,
        address,
        emergencyContact,
        emergencyPhone,
        medicalInfo,
        classId,
        enrollmentStatus,
      } = req.body;

      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }

      // Vérifier si le studentId existe déjà
      const existingStudent = await prisma.student.findUnique({
        where: { studentId },
      });

      if (existingStudent) {
        return res.status(400).json({ error: 'Ce numéro d\'élève existe déjà' });
      }

      const hashedPassword = await hashPassword(password);

      // Créer l'utilisateur et le profil élève
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: 'STUDENT',
          studentProfile: {
            create: {
              studentId,
              dateOfBirth: new Date(dateOfBirth),
              gender,
              address,
              emergencyContact,
              emergencyPhone,
              medicalInfo,
              classId,
              ...(enrollmentStatus &&
              ['ACTIVE', 'SUSPENDED', 'GRADUATED'].includes(enrollmentStatus) && {
                enrollmentStatus,
              }),
            },
          },
        },
        include: {
          studentProfile: {
            include: {
              class: true,
            },
          },
        },
      });

      // Enregistrer l'événement de sécurité pour l'activité
      try {
        await prisma.securityEvent.create({
          data: {
            userId: (req as any).user?.id,
            type: 'student_added',
            description: `Élève créé: ${firstName} ${lastName} (${studentId})${classId ? ' - Classe assignée' : ''}`,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.get('user-agent'),
            severity: 'info',
          },
        });
      } catch (eventError) {
        // Ne pas faire échouer la création de l'élève si l'événement échoue
        console.error('Erreur lors de la création de l\'événement de sécurité:', eventError);
      }

      res.status(201).json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Obtenir un élève par ID
router.get('/students/:id', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
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
        class: true,
        parents: {
          include: {
            parent: {
              include: {
                user: true,
              },
            },
          },
        },
        grades: {
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
        },
        absences: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    res.json(student);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Documents d'identité d'un élève (admin)
router.get('/students/:id/identity-documents', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!student) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    const documents = await prisma.identityDocument.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: { firstName: true, lastName: true, role: true, email: true },
        },
      },
    });

    res.json(documents);
  } catch (error: any) {
    console.error('GET /admin/students/:id/identity-documents:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.delete('/students/:studentId/identity-documents/:docId', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.studentId },
      select: { id: true },
    });
    if (!student) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    const doc = await prisma.identityDocument.findFirst({
      where: { id: req.params.docId, studentId: student.id },
    });
    if (!doc) {
      return res.status(404).json({ error: 'Document introuvable' });
    }

    await prisma.identityDocument.delete({ where: { id: doc.id } });
    deleteUploadedFileByPublicUrl(doc.fileUrl);

    res.json({ message: 'Document supprimé' });
  } catch (error: any) {
    console.error('DELETE admin identity-document:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Mettre à jour un élève
router.put('/students/:id', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      address,
      emergencyContact,
      emergencyPhone,
      medicalInfo,
      classId,
      isActive,
      nfcId,
      enrollmentStatus,
    } = req.body;

    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!student) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    if (
      enrollmentStatus !== undefined &&
      !['ACTIVE', 'SUSPENDED', 'GRADUATED'].includes(enrollmentStatus)
    ) {
      return res.status(400).json({ error: 'Statut d\'inscription invalide' });
    }

    // Mettre à jour l'utilisateur
    if (firstName || lastName || phone) {
      await prisma.user.update({
        where: { id: student.userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone && { phone }),
        },
      });
    }

    // Mettre à jour le profil élève
    const updatedStudent = await prisma.student.update({
      where: { id: req.params.id },
      data: {
        ...(address && { address }),
        ...(emergencyContact && { emergencyContact }),
        ...(emergencyPhone && { emergencyPhone }),
        ...(medicalInfo && { medicalInfo }),
        ...(classId && { classId }),
        ...(isActive !== undefined && { isActive }),
        ...(nfcId !== undefined && { nfcId: nfcId || null }),
        ...(enrollmentStatus !== undefined && {
          enrollmentStatus: enrollmentStatus as 'ACTIVE' | 'SUSPENDED' | 'GRADUATED',
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        class: true,
      },
    });

    res.json(updatedStudent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un élève
router.delete('/students/:id', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!student) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    // Utiliser une transaction pour supprimer toutes les relations dans le bon ordre
    await prisma.$transaction(async (tx) => {
      // 1. Supprimer les relations StudentParent
      await tx.studentParent.deleteMany({
        where: { studentId: req.params.id },
      });

      // 2. Supprimer les absences associées
      await tx.absence.deleteMany({
        where: { studentId: req.params.id },
      });

      // 3. Supprimer les notes associées
      await tx.grade.deleteMany({
        where: { studentId: req.params.id },
      });

      // 4. Supprimer les assignments associés
      await tx.studentAssignment.deleteMany({
        where: { studentId: req.params.id },
      });

      // 5. Supprimer le profil élève
      await tx.student.delete({
        where: { id: req.params.id },
      });

      // 6. Supprimer l'utilisateur associé
      await tx.user.delete({
        where: { id: student.userId },
      });
    });

    res.json({ message: 'Élève supprimé avec succès' });
  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'élève:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur lors de la suppression',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ========== GESTION DES CLASSES ==========

// Lister toutes les classes
router.get('/classes', async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
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
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    res.json(classes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une classe
router.post(
  '/classes',
  [
    body('name').notEmpty(),
    body('level').notEmpty(),
    body('academicYear').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, level, room, capacity, academicYear, teacherId } = req.body;

      const newClass = await prisma.class.create({
        data: {
          name,
          level,
          room,
          capacity: capacity || 30,
          academicYear,
          teacherId,
        },
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
      });

      res.status(201).json(newClass);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ========== GESTION DES ENSEIGNANTS ==========

// Rechercher un enseignant par NFC ID
router.get('/teachers/nfc/:nfcId', async (req, res) => {
  try {
    const { nfcId } = req.params;

    const teacher = await prisma.teacher.findFirst({
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
        classes: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        courses: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Aucun enseignant trouvé avec cet ID NFC' });
    }

    res.json(teacher);
  } catch (error: any) {
    console.error('Error fetching teacher by NFC ID:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Enregistrer la présence d'un enseignant via NFC
router.post('/teachers/nfc-attendance', async (req, res) => {
  try {
    const { teacherId, date, status } = req.body;

    if (!teacherId || !date) {
      return res.status(400).json({ error: 'teacherId et date sont requis' });
    }

    // Vérifier que l'enseignant existe
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Enseignant non trouvé' });
    }

    // Pour l'instant, on peut simplement logger la présence
    // Vous pouvez créer un modèle TeacherAttendance si nécessaire
    const attendanceRecord = {
      teacherId,
      teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
      date: new Date(date),
      status: status || 'PRESENT',
      recordedAt: new Date(),
    };

    // TODO: Créer un modèle TeacherAttendance dans Prisma si nécessaire
    // Pour l'instant, on retourne juste la confirmation
    res.status(201).json({
      message: 'Présence enregistrée avec succès',
      attendance: attendanceRecord,
    });
  } catch (error: any) {
    console.error('Error recording teacher NFC attendance:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Lister tous les enseignants
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany({
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
        classes: true,
        courses: true,
      },
    });

    res.json(teachers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un enseignant
router.post(
  '/teachers',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('employeeId').notEmpty(),
    body('specialization').notEmpty(),
    body('hireDate').isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        employeeId,
        specialization,
        hireDate,
        contractType,
        salary,
      } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }

      const existingEmployee = await prisma.teacher.findUnique({
        where: { employeeId },
      });

      if (existingEmployee) {
        return res.status(400).json({ error: 'Ce numéro d\'employé existe déjà' });
      }

      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: 'TEACHER',
          teacherProfile: {
            create: {
              employeeId,
              specialization,
              hireDate: new Date(hireDate),
              contractType: contractType || 'CDI',
              salary,
            },
          },
        },
        include: {
          teacherProfile: true,
        },
      });

      res.status(201).json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Obtenir un enseignant par ID
router.get('/teachers/:id', async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.params.id },
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
          },
        },
        courses: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Enseignant non trouvé' });
    }

    res.json(teacher);
  } catch (error: any) {
    console.error('Erreur dans /admin/teachers/:id:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Mettre à jour un enseignant
router.put('/teachers/:id', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      specialization,
      contractType,
      salary,
      isActive,
      nfcId,
    } = req.body;

    const teacher = await prisma.teacher.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Enseignant non trouvé' });
    }

    // Mettre à jour l'utilisateur
    if (firstName || lastName || phone) {
      await prisma.user.update({
        where: { id: teacher.userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone !== undefined && { phone }),
        },
      });
    }

    // Mettre à jour le profil enseignant
    const updatedTeacher = await prisma.teacher.update({
      where: { id: req.params.id },
      data: {
        ...(specialization && { specialization }),
        ...(contractType && { contractType }),
        ...(salary !== undefined && { salary: salary ? parseFloat(salary) : null }),
        ...(isActive !== undefined && { isActive }),
        ...(nfcId !== undefined && { nfcId: nfcId || null }),
      },
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
        classes: true,
        courses: true,
      },
    });

    res.json(updatedTeacher);
  } catch (error: any) {
    console.error('Erreur dans /admin/teachers/:id PUT:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Liste des évaluations RH d'un enseignant
router.get('/teachers/:id/performance-reviews', async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!teacher) {
      return res.status(404).json({ error: 'Enseignant non trouvé' });
    }
    const reviews = await prisma.teacherPerformanceReview.findMany({
      where: { teacherId: teacher.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
  } catch (error: any) {
    console.error('GET admin teacher reviews:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Liste des demandes de congé d'un enseignant
router.get('/teachers/:id/leaves', async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!teacher) {
      return res.status(404).json({ error: 'Enseignant non trouvé' });
    }
    const leaves = await prisma.teacherLeave.findMany({
      where: { teacherId: teacher.id },
      orderBy: { startDate: 'desc' },
    });
    res.json(leaves);
  } catch (error: any) {
    console.error('GET admin teacher leaves:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Évaluation du personnel — enregistrer une fiche pour un enseignant
router.post(
  '/teachers/:id/performance-reviews',
  [
    body('periodLabel').notEmpty().withMessage('Période requise'),
    body('academicYear').notEmpty().withMessage('Année scolaire requise'),
    body('overallScore').optional().isFloat({ min: 0, max: 20 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const teacher = await prisma.teacher.findUnique({
        where: { id: req.params.id },
        select: { id: true },
      });
      if (!teacher) {
        return res.status(404).json({ error: 'Enseignant non trouvé' });
      }

      const {
        periodLabel,
        academicYear,
        overallScore,
        objectives,
        achievements,
        improvements,
        reviewerName,
      } = req.body;

      const review = await prisma.teacherPerformanceReview.create({
        data: {
          teacherId: teacher.id,
          periodLabel: String(periodLabel).trim(),
          academicYear: String(academicYear).trim(),
          overallScore:
            overallScore !== undefined && overallScore !== null && overallScore !== ''
              ? parseFloat(String(overallScore))
              : null,
          objectives: objectives?.trim() || null,
          achievements: achievements?.trim() || null,
          improvements: improvements?.trim() || null,
          reviewerName: reviewerName?.trim() || null,
        },
      });

      res.status(201).json(review);
    } catch (error: any) {
      console.error('POST /admin/teachers/:id/performance-reviews:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

// Congés enseignant — statut (validation direction)
router.patch('/teachers/:teacherId/leaves/:leaveId', async (req, res) => {
  try {
    const { status, adminComment } = req.body;
    if (!['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const leave = await prisma.teacherLeave.findFirst({
      where: { id: req.params.leaveId, teacherId: req.params.teacherId },
    });
    if (!leave) {
      return res.status(404).json({ error: 'Demande introuvable' });
    }

    const updated = await prisma.teacherLeave.update({
      where: { id: leave.id },
      data: {
        status,
        ...(adminComment !== undefined && {
          adminComment: adminComment === null || adminComment === '' ? null : String(adminComment).trim(),
        }),
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('PATCH admin teacher leave:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// ——— Ressources humaines (vues agrégées direction) ———

/** Tous les congés enseignants (filtre optionnel ?status=PENDING|…) */
router.get('/hr/teacher-leaves', async (req, res) => {
  try {
    const { status } = req.query;
    const where: { status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' } = {};
    if (
      typeof status === 'string' &&
      ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(status)
    ) {
      where.status = status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    }

    const leaves = await prisma.teacherLeave.findMany({
      where,
      orderBy: { startDate: 'desc' },
      include: {
        teacher: {
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
        },
      },
    });

    res.json(leaves);
  } catch (error: any) {
    console.error('GET /admin/hr/teacher-leaves:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

/** Toutes les fiches d’évaluation du personnel enseignant */
router.get('/hr/teacher-performance-reviews', async (req, res) => {
  try {
    const reviews = await prisma.teacherPerformanceReview.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.json(reviews);
  } catch (error: any) {
    console.error('GET /admin/hr/teacher-performance-reviews:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Supprimer un enseignant
router.delete('/teachers/:id', async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Enseignant non trouvé' });
    }

    // Utiliser une transaction pour supprimer toutes les relations dans le bon ordre
    await prisma.$transaction(async (tx) => {
      // 1. Supprimer les StudentAssignments liés aux assignments de l'enseignant
      const assignments = await tx.assignment.findMany({
        where: { teacherId: req.params.id },
        select: { id: true },
      });
      if (assignments.length > 0) {
        await tx.studentAssignment.deleteMany({
          where: { assignmentId: { in: assignments.map((a) => a.id) } },
        });
      }

      // 2. Supprimer les assignments de l'enseignant
      await tx.assignment.deleteMany({
        where: { teacherId: req.params.id },
      });

      // 3. Supprimer les grades de l'enseignant
      await tx.grade.deleteMany({
        where: { teacherId: req.params.id },
      });

      // 4. Supprimer les absences de l'enseignant
      await tx.absence.deleteMany({
        where: { teacherId: req.params.id },
      });

      // 5. Supprimer les schedules liés aux courses de l'enseignant
      const courses = await tx.course.findMany({
        where: { teacherId: req.params.id },
        select: { id: true },
      });
      if (courses.length > 0) {
        await tx.schedule.deleteMany({
          where: { courseId: { in: courses.map((c) => c.id) } },
        });
      }

      // 6. Supprimer les courses de l'enseignant
      await tx.course.deleteMany({
        where: { teacherId: req.params.id },
      });

      // 7. Retirer l'enseignant des classes (mettre teacherId à null)
      await tx.class.updateMany({
        where: { teacherId: req.params.id },
        data: { teacherId: null },
      });

      await tx.teacherLeave.deleteMany({
        where: { teacherId: req.params.id },
      });
      await tx.teacherPerformanceReview.deleteMany({
        where: { teacherId: req.params.id },
      });

      // 8. Supprimer le profil enseignant
      await tx.teacher.delete({
        where: { id: req.params.id },
      });

      // 9. Supprimer l'utilisateur associé
      await tx.user.delete({
        where: { id: teacher.userId },
      });
    });

    res.json({ message: 'Enseignant supprimé avec succès' });
  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'enseignant:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur lors de la suppression',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ========== GESTION DES ÉDUCATEURS ==========

// Rechercher un éducateur par NFC ID
router.get('/educators/nfc/:nfcId', async (req, res) => {
  try {
    const { nfcId } = req.params;

    const educator = await prisma.educator.findFirst({
      where: { nfcId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!educator) {
      return res.status(404).json({ error: 'Éducateur non trouvé' });
    }

    res.json(educator);
  } catch (error: any) {
    console.error('Error finding educator by NFC:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Lister tous les éducateurs
router.get('/educators', async (req, res) => {
  try {
    const educators = await prisma.educator.findMany({
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
      },
    });

    res.json(educators);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un éducateur
router.post(
  '/educators',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('employeeId').notEmpty(),
    body('specialization').notEmpty(),
    body('hireDate').isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        employeeId,
        specialization,
        hireDate,
        contractType,
        salary,
      } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }

      const existingEmployee = await prisma.educator.findUnique({
        where: { employeeId },
      });

      if (existingEmployee) {
        return res.status(400).json({ error: 'Ce numéro d\'employé existe déjà' });
      }

      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: 'EDUCATOR',
          educatorProfile: {
            create: {
              employeeId,
              specialization,
              hireDate: new Date(hireDate),
              contractType: contractType || 'CDI',
              salary,
            },
          },
        },
        include: {
          educatorProfile: true,
        },
      });

      res.status(201).json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Obtenir un éducateur par ID
router.get('/educators/:id', async (req, res) => {
  try {
    const educator = await prisma.educator.findUnique({
      where: { id: req.params.id },
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
        // La relation est portée par User (evaluatedConducts), pas directement par Educator.
      },
    });

    if (!educator) {
      return res.status(404).json({ error: 'Éducateur non trouvé' });
    }

    res.json(educator);
  } catch (error: any) {
    console.error('Erreur dans /admin/educators/:id:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Mettre à jour un éducateur
router.put('/educators/:id', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      specialization,
      contractType,
      salary,
      isActive,
      nfcId,
    } = req.body;

    const educator = await prisma.educator.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!educator) {
      return res.status(404).json({ error: 'Éducateur non trouvé' });
    }

    // Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { id: educator.userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Mettre à jour le profil éducateur
    const updatedEducator = await prisma.educator.update({
      where: { id: req.params.id },
      data: {
        ...(specialization !== undefined && { specialization }),
        ...(contractType !== undefined && { contractType }),
        ...(salary !== undefined && { salary }),
        ...(nfcId !== undefined && { nfcId: nfcId || null }),
      },
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
        // La relation est portée par User (evaluatedConducts), pas directement par Educator.
      },
    });

    res.json(updatedEducator);
  } catch (error: any) {
    console.error('Erreur dans /admin/educators/:id PUT:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Supprimer un éducateur
router.delete('/educators/:id', async (req, res) => {
  try {
    const educator = await prisma.educator.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!educator) {
      return res.status(404).json({ error: 'Éducateur non trouvé' });
    }

    // Utiliser une transaction pour supprimer toutes les relations dans le bon ordre
    await prisma.$transaction(async (tx) => {
      // 1. Supprimer les évaluations de conduite créées par cet éducateur
      // Note: On ne supprime pas les évaluations, on les garde pour l'historique
      // Mais on pourrait mettre à jour evaluatedByRole si nécessaire

      // 2. Supprimer le profil éducateur
      await tx.educator.delete({
        where: { id: req.params.id },
      });

      // 3. Supprimer l'utilisateur associé
      await tx.user.delete({
        where: { id: educator.userId },
      });
    });

    res.json({ message: 'Éducateur supprimé avec succès' });
  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'éducateur:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur lors de la suppression',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ========== GESTION ACADÉMIQUE ==========

// Obtenir toutes les notes
router.get('/grades', async (req, res) => {
  try {
    const { studentId, courseId, classId } = req.query;

    const grades = await prisma.grade.findMany({
      where: {
        ...(studentId && { studentId: studentId as string }),
        ...(courseId && { courseId: courseId as string }),
        ...(classId && {
          student: {
            classId: classId as string,
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
        course: {
          select: {
            name: true,
            code: true,
          },
        },
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
    });

    res.json(grades);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir toutes les absences
router.get('/absences', async (req, res) => {
  try {
    const { studentId, courseId, classId, date } = req.query;

    const absences = await prisma.absence.findMany({
      where: {
        ...(studentId && { studentId: studentId as string }),
        ...(courseId && { courseId: courseId as string }),
        ...(classId && {
          student: {
            classId: classId as string,
          },
        }),
        ...(date && {
          date: {
            gte: new Date(date as string),
            lt: new Date(new Date(date as string).setDate(new Date(date as string).getDate() + 1)),
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
        course: {
          select: {
            name: true,
            code: true,
          },
        },
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
    });

    res.json(absences);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir tous les devoirs
router.get('/assignments', async (req, res) => {
  try {
    const { courseId, classId } = req.query;

    const assignments = await prisma.assignment.findMany({
      where: {
        ...(courseId && { courseId: courseId as string }),
        ...(classId && {
          course: {
            classId: classId as string,
          },
        }),
      },
      include: {
        course: {
          select: {
            name: true,
            code: true,
            class: {
              select: {
                name: true,
                level: true,
              },
            },
          },
        },
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

// Obtenir tous les cours (optionnel: ?classId=)
router.get('/courses', async (req, res) => {
  try {
    const { classId } = req.query;
    const courses = await prisma.course.findMany({
      where: {
        ...(classId ? { classId: classId as string } : {}),
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
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
    });

    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir un cours avec les élèves (pour le pointage admin)
router.get('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        class: {
          include: {
            students: {
              where: { isActive: true },
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });
    if (!course) return res.status(404).json({ error: 'Cours non trouvé' });
    res.json(course);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une matière / cours rattaché à une classe
router.post(
  '/courses',
  [
    body('name').notEmpty().withMessage('Nom requis'),
    body('code').notEmpty().withMessage('Code requis'),
    body('classId').notEmpty().withMessage('classId requis'),
    body('teacherId').notEmpty().withMessage('teacherId requis'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { name, code, description, classId, teacherId, weeklyHours } = req.body;

      const [cls, teacher, codeTaken] = await Promise.all([
        prisma.class.findUnique({ where: { id: classId } }),
        prisma.teacher.findUnique({ where: { id: teacherId } }),
        prisma.course.findUnique({ where: { code: String(code).trim() } }),
      ]);
      if (!cls) return res.status(400).json({ error: 'Classe introuvable' });
      if (!teacher) return res.status(400).json({ error: 'Enseignant introuvable' });
      if (codeTaken) return res.status(400).json({ error: 'Ce code matière existe déjà' });

      const course = await prisma.course.create({
        data: {
          name: String(name).trim(),
          code: String(code).trim(),
          description: description != null ? String(description) : undefined,
          weeklyHours:
            weeklyHours !== undefined && weeklyHours !== null && weeklyHours !== ''
              ? Number(weeklyHours)
              : undefined,
          classId,
          teacherId,
        },
        include: {
          class: { select: { id: true, name: true, level: true } },
          teacher: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });
      res.status(201).json(course);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Mettre à jour une matière / cours
router.put(
  '/courses/:courseId',
  [
    body('name').optional().notEmpty(),
    body('code').optional().notEmpty(),
    body('classId').optional().notEmpty(),
    body('teacherId').optional().notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { courseId } = req.params;
      const { name, code, description, classId, teacherId, weeklyHours } = req.body;

      const existing = await prisma.course.findUnique({ where: { id: courseId } });
      if (!existing) return res.status(404).json({ error: 'Cours non trouvé' });

      if (code && String(code).trim() !== existing.code) {
        const taken = await prisma.course.findUnique({ where: { code: String(code).trim() } });
        if (taken) return res.status(400).json({ error: 'Ce code matière existe déjà' });
      }
      if (classId) {
        const cls = await prisma.class.findUnique({ where: { id: classId } });
        if (!cls) return res.status(400).json({ error: 'Classe introuvable' });
      }
      if (teacherId) {
        const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
        if (!teacher) return res.status(400).json({ error: 'Enseignant introuvable' });
      }

      const course = await prisma.course.update({
        where: { id: courseId },
        data: {
          ...(name != null && { name: String(name).trim() }),
          ...(code != null && { code: String(code).trim() }),
          ...(description !== undefined && {
            description: description === null || description === '' ? null : String(description),
          }),
          ...(classId != null && { classId }),
          ...(teacherId != null && { teacherId }),
          ...(weeklyHours !== undefined && {
            weeklyHours:
              weeklyHours === null || weeklyHours === ''
                ? null
                : Number(weeklyHours),
          }),
        },
        include: {
          class: { select: { id: true, name: true, level: true } },
          teacher: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });
      res.json(course);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Supprimer une matière / cours (et données liées)
router.delete('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const existing = await prisma.course.findUnique({ where: { id: courseId } });
    if (!existing) return res.status(404).json({ error: 'Cours non trouvé' });

    await prisma.schedule.deleteMany({ where: { courseId } });
    const assignments = await prisma.assignment.findMany({
      where: { courseId },
      select: { id: true },
    });
    const assignmentIds = assignments.map((a) => a.id);
    if (assignmentIds.length > 0) {
      await prisma.studentAssignment.deleteMany({
        where: { assignmentId: { in: assignmentIds } },
      });
    }
    await prisma.assignment.deleteMany({ where: { courseId } });
    await prisma.absence.deleteMany({ where: { courseId } });
    await prisma.grade.deleteMany({ where: { courseId } });
    await prisma.course.delete({ where: { id: courseId } });

    res.json({ ok: true, message: 'Cours supprimé' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== CALENDRIER SCOLAIRE ==========

router.get('/school-calendar-events', async (req, res) => {
  try {
    const { academicYear } = req.query;
    const events = await prisma.schoolCalendarEvent.findMany({
      where: academicYear ? { academicYear: academicYear as string } : {},
      orderBy: { startDate: 'asc' },
    });
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/school-calendar-events',
  [
    body('title').notEmpty(),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('academicYear').notEmpty(),
    body('type').optional().isIn(['HOLIDAY', 'VACATION', 'EXAM_PERIOD', 'MEETING', 'OTHER']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { title, description, type, startDate, endDate, academicYear, allDay } = req.body;
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        return res.status(400).json({ error: 'La date de fin doit être après la date de début' });
      }
      const event = await prisma.schoolCalendarEvent.create({
        data: {
          title: String(title).trim(),
          description:
            description != null && description !== '' ? String(description) : undefined,
          type: type || 'OTHER',
          startDate: start,
          endDate: end,
          academicYear: String(academicYear).trim(),
          allDay: allDay !== false,
        },
      });
      res.status(201).json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.put(
  '/school-calendar-events/:id',
  [
    body('title').optional().notEmpty(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('type').optional().isIn(['HOLIDAY', 'VACATION', 'EXAM_PERIOD', 'MEETING', 'OTHER']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { id } = req.params;
      const { title, description, type, startDate, endDate, academicYear, allDay } = req.body;

      const existing = await prisma.schoolCalendarEvent.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Événement introuvable' });

      const nextStart = startDate ? new Date(startDate) : existing.startDate;
      const nextEnd = endDate ? new Date(endDate) : existing.endDate;
      if (nextEnd < nextStart) {
        return res.status(400).json({ error: 'La date de fin doit être après la date de début' });
      }

      const event = await prisma.schoolCalendarEvent.update({
        where: { id },
        data: {
          ...(title != null && { title: String(title).trim() }),
          ...(description !== undefined && {
            description: description === null || description === '' ? null : String(description),
          }),
          ...(type != null && { type }),
          ...(startDate != null && { startDate: nextStart }),
          ...(endDate != null && { endDate: nextEnd }),
          ...(academicYear != null && { academicYear: String(academicYear).trim() }),
          ...(allDay !== undefined && { allDay: Boolean(allDay) }),
        },
      });
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.delete('/school-calendar-events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.schoolCalendarEvent.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Événement introuvable' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Pointage des élèves (admin) : enregistrer les présences pour un cours/date
router.post(
  '/absences/take-attendance',
  [
    body('courseId').notEmpty(),
    body('date').isISO8601(),
    body('attendance').isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { courseId, date, attendance } = req.body;

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, teacherId: true },
      });
      if (!course) return res.status(404).json({ error: 'Cours non trouvé' });

      const attendanceDate = new Date(date);
      const startOfDay = new Date(attendanceDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

      await prisma.absence.deleteMany({
        where: {
          courseId,
          date: { gte: startOfDay, lt: endOfDay },
        },
      });

      const absences = await Promise.all(
        attendance.map((att: any) =>
          prisma.absence.create({
            data: {
              studentId: att.studentId,
              courseId,
              teacherId: course.teacherId,
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

// Créer une note (Admin)
router.post(
  '/grades',
  [
    body('studentId').notEmpty(),
    body('courseId').notEmpty(),
    body('teacherId').notEmpty(),
    body('evaluationType').isIn(['EXAM', 'QUIZ', 'HOMEWORK', 'PROJECT', 'ORAL']),
    body('title').notEmpty(),
    body('score').isFloat({ min: 0 }),
    body('maxScore').isFloat({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        studentId,
        courseId,
        teacherId,
        evaluationType,
        title,
        score,
        maxScore,
        coefficient,
        date,
        comments,
      } = req.body;

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
          course: {
            select: {
              name: true,
              code: true,
            },
          },
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
      });

      res.status(201).json(grade);
    } catch (error: any) {
      console.error('Erreur lors de la création de la note:', error);
      res.status(500).json({ 
        error: error.message || 'Erreur serveur',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// Mettre à jour une note (Admin)
router.put('/grades/:id', async (req, res) => {
  try {
    const { title, score, maxScore, coefficient, comments, date } = req.body;

    const grade = await prisma.grade.findUnique({
      where: { id: req.params.id },
    });

    if (!grade) {
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
        ...(date && { date: new Date(date) }),
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
        course: {
          select: {
            name: true,
            code: true,
          },
        },
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
    });

    res.json(updatedGrade);
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la note:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Supprimer une note (Admin)
router.delete('/grades/:id', async (req, res) => {
  try {
    const grade = await prisma.grade.findUnique({
      where: { id: req.params.id },
    });

    if (!grade) {
      return res.status(404).json({ error: 'Note non trouvée' });
    }

    await prisma.grade.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Note supprimée avec succès' });
  } catch (error: any) {
    console.error('Erreur lors de la suppression de la note:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Initialiser le pointage (admin) : tous les élèves du cours marqués absents
router.post(
  '/absences/init-attendance',
  [
    body('courseId').notEmpty(),
    body('date').isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { courseId, date } = req.body;

      const course = await prisma.course.findFirst({
        where: { id: courseId },
        include: {
          class: {
            include: {
              students: {
                where: { isActive: true },
              },
            },
          },
        },
      });
      if (!course) return res.status(404).json({ error: 'Cours non trouvé' });

      const students = course.class?.students || [];
      const attendanceDate = new Date(date);
      const startOfDay = new Date(attendanceDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

      await prisma.absence.deleteMany({
        where: {
          courseId,
          date: { gte: startOfDay, lt: endOfDay },
        },
      });

      const absences = await Promise.all(
        students.map((s: any) =>
          prisma.absence.create({
            data: {
              studentId: s.id,
              courseId,
              teacherId: course.teacherId,
              date: attendanceDate,
              status: 'ABSENT',
              excused: false,
            },
          })
        )
      );

      res.status(201).json({
        message: `Pointage initialisé: ${absences.length} élèves marqués absents`,
        total: absences.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Enregistrer la présence d'un élève via scan NFC (admin)
router.post(
  '/absences/nfc-attendance',
  [
    body('courseId').notEmpty(),
    body('studentId').notEmpty(),
    body('date').isISO8601(),
    body('status').optional().isIn(['PRESENT', 'ABSENT', 'LATE']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { courseId, studentId, date, status = 'PRESENT' } = req.body;

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, teacherId: true },
      });
      if (!course) return res.status(404).json({ error: 'Cours non trouvé' });

      const attendanceDate = new Date(date);
      const startOfDay = new Date(attendanceDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

      const existing = await prisma.absence.findFirst({
        where: {
          studentId,
          courseId,
          date: { gte: startOfDay, lt: endOfDay },
        },
      });

      let absence;
      if (existing) {
        absence = await prisma.absence.update({
          where: { id: existing.id },
          data: { status: status || 'PRESENT', updatedAt: new Date() },
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        });
      } else {
        absence = await prisma.absence.create({
          data: {
            studentId,
            courseId,
            teacherId: course.teacherId,
            date: attendanceDate,
            status: status || 'PRESENT',
            excused: false,
          },
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        });
      }

      res.status(201).json(absence);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Créer une absence (Admin)
router.post(
  '/absences',
  [
    body('studentId').notEmpty(),
    body('courseId').notEmpty(),
    body('teacherId').notEmpty(),
    body('date').isISO8601(),
    body('status').isIn(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        studentId,
        courseId,
        teacherId,
        date,
        status,
        excused,
        reason,
      } = req.body;

      const absence = await prisma.absence.create({
        data: {
          studentId,
          courseId,
          teacherId,
          date: new Date(date),
          status,
          excused: excused || false,
          reason,
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
          course: {
            select: {
              name: true,
              code: true,
            },
          },
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
      });

      res.status(201).json(absence);
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'absence:', error);
      res.status(500).json({ 
        error: error.message || 'Erreur serveur',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// Mettre à jour une absence (Admin)
router.put('/absences/:id', async (req, res) => {
  try {
    const { status, excused, reason, date } = req.body;

    const absence = await prisma.absence.findUnique({
      where: { id: req.params.id },
    });

    if (!absence) {
      return res.status(404).json({ error: 'Absence non trouvée' });
    }

    const updatedAbsence = await prisma.absence.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(excused !== undefined && { excused }),
        ...(reason !== undefined && { reason }),
        ...(date && { date: new Date(date) }),
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
        course: {
          select: {
            name: true,
            code: true,
          },
        },
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
    });

    res.json(updatedAbsence);
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de l\'absence:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Supprimer une absence (Admin)
router.delete('/absences/:id', async (req, res) => {
  try {
    const absence = await prisma.absence.findUnique({
      where: { id: req.params.id },
    });

    if (!absence) {
      return res.status(404).json({ error: 'Absence non trouvée' });
    }

    await prisma.absence.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Absence supprimée avec succès' });
  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'absence:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Créer un devoir (Admin)
router.post(
  '/assignments',
  [
    body('courseId').notEmpty(),
    body('teacherId').notEmpty(),
    body('title').notEmpty(),
    body('dueDate').isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        courseId,
        teacherId,
        title,
        description,
        dueDate,
        attachments,
      } = req.body;

      const assignment = await prisma.assignment.create({
        data: {
          courseId,
          teacherId,
          title,
          description: description || null,
          dueDate: new Date(dueDate),
          attachments: attachments || [],
        },
        include: {
          course: {
            select: {
              name: true,
              code: true,
              class: {
                select: {
                  name: true,
                  level: true,
                },
              },
            },
          },
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
      });

      res.status(201).json(assignment);
    } catch (error: any) {
      console.error('Erreur lors de la création du devoir:', error);
      res.status(500).json({ 
        error: error.message || 'Erreur serveur',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// Mettre à jour un devoir (Admin)
router.put('/assignments/:id', async (req, res) => {
  try {
    const { title, description, dueDate, maxScore } = req.body;

    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Devoir non trouvé' });
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(maxScore !== undefined && { maxScore: maxScore ? parseFloat(maxScore) : null }),
      },
      include: {
        course: {
          select: {
            name: true,
            code: true,
            class: {
              select: {
                name: true,
                level: true,
              },
            },
          },
        },
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
    });

    res.json(updatedAssignment);
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du devoir:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Supprimer un devoir (Admin)
router.delete('/assignments/:id', async (req, res) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Devoir non trouvé' });
    }

    // Utiliser une transaction pour supprimer toutes les relations dans le bon ordre
    await prisma.$transaction(async (tx) => {
      // 1. Supprimer tous les StudentAssignment liés
      await tx.studentAssignment.deleteMany({
        where: { assignmentId: req.params.id },
      });

      // 2. Supprimer l'Assignment
      await tx.assignment.delete({
        where: { id: req.params.id },
      });
    });

    res.json({ message: 'Devoir supprimé avec succès' });
  } catch (error: any) {
    console.error('Erreur lors de la suppression du devoir:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Obtenir une note par ID (Admin)
router.get('/grades/:id', async (req, res) => {
  try {
    const grade = await prisma.grade.findUnique({
      where: { id: req.params.id },
      include: {
        student: {
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
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        teacher: {
          include: {
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
    });

    if (!grade) {
      return res.status(404).json({ error: 'Note non trouvée' });
    }

    res.json(grade);
  } catch (error: any) {
    console.error('Erreur dans /admin/grades/:id:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Obtenir une absence par ID (Admin)
router.get('/absences/:id', async (req, res) => {
  try {
    const absence = await prisma.absence.findUnique({
      where: { id: req.params.id },
      include: {
        student: {
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
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        teacher: {
          include: {
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
    });

    if (!absence) {
      return res.status(404).json({ error: 'Absence non trouvée' });
    }

    res.json(absence);
  } catch (error: any) {
    console.error('Erreur dans /admin/absences/:id:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Obtenir un devoir par ID (Admin)
router.get('/assignments/:id', async (req, res) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            class: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        students: {
          include: {
            student: {
              include: {
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
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Devoir non trouvé' });
    }

    res.json(assignment);
  } catch (error: any) {
    console.error('Erreur dans /admin/assignments/:id:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ========== GESTION DES RÔLES ==========

// Obtenir tous les utilisateurs avec leurs rôles
router.get('/users', async (req, res) => {
  try {
    const { role, isActive } = req.query;

    const users = await prisma.user.findMany({
      where: {
        ...(role && { role: role as any }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        teacherProfile: {
          select: {
            id: true,
            employeeId: true,
            specialization: true,
          },
        },
        studentProfile: {
          select: {
            id: true,
            studentId: true,
            class: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
          },
        },
        parentProfile: {
          select: {
            id: true,
            profession: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(users);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Changer le rôle d'un utilisateur
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;

    if (!['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: role as any },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir un utilisateur par ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        teacherProfile: {
          include: {
            classes: true,
            courses: true,
          },
        },
        studentProfile: {
          include: {
            class: true,
            parents: {
              include: {
                parent: {
                  include: {
                    user: {
                      select: {
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
                    class: true,
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                        email: true,
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
    console.error(`Erreur lors de la récupération de l'utilisateur ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour un utilisateur
router.put('/users/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, isActive } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updatedUser);
  } catch (error: any) {
    console.error(`Erreur lors de la mise à jour de l'utilisateur ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un utilisateur
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Ne pas permettre la suppression de son propre compte
    if (user.id === req.user!.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    // Supprimer l'utilisateur (cascade supprimera les profils associés)
    await prisma.user.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error(`Erreur lors de la suppression de l'utilisateur ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les statistiques par rôle
router.get('/roles/stats', async (req, res) => {
  try {
    const [admins, teachers, students, parents, educators, activeUsers, inactiveUsers] = await Promise.all([
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'PARENT' } }),
      prisma.user.count({ where: { role: 'EDUCATOR' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
    ]);

    res.json({
      admins,
      teachers,
      students,
      parents,
      educators,
      activeUsers,
      inactiveUsers,
      total: admins + teachers + students + parents + educators,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== SUIVI PÉDAGOGIQUE ==========

// Statistiques pédagogiques par classe
router.get('/pedagogical/class-stats', async (req, res) => {
  try {
    const { classId } = req.query;

    if (!classId) {
      return res.status(400).json({ error: 'classId requis' });
    }

    const students = await prisma.student.findMany({
      where: { classId: classId as string },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
        grades: {
          include: {
            course: true,
          },
        },
        absences: true,
      },
    });

    const classStats = students.map((student) => {
      const grades = student.grades || [];
      const totalScore = grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 20 * g.coefficient, 0);
      const totalCoefficient = grades.reduce((sum, g) => sum + g.coefficient, 0);
      const average = totalCoefficient > 0 ? totalScore / totalCoefficient : 0;
      const absences = student.absences?.filter((a) => !a.excused).length || 0;

      return {
        studentId: student.studentId,
        firstName: student.user?.firstName || '',
        lastName: student.user?.lastName || '',
        average,
        absences,
        totalGrades: grades.length,
      };
    });

    res.json(classStats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Progression d'un élève
router.get('/pedagogical/student-progress/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { period } = req.query; // 'month', 'semester', 'year'

    const student = await prisma.student.findUnique({
      where: { studentId },
      include: {
        grades: {
          include: {
            course: true,
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    // Grouper les notes par période
    const progress = student.grades.map((grade) => ({
      date: grade.date,
      course: grade.course.name,
      score: (grade.score / grade.maxScore) * 20,
      coefficient: grade.coefficient,
    }));

    res.json(progress);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Statistiques par matière
router.get('/pedagogical/course-stats', async (req, res) => {
  try {
    const { courseId, classId } = req.query;

    const where: any = {};
    if (courseId) where.courseId = courseId as string;
    if (classId) {
      where.student = { classId: classId as string };
    }

    const grades = await prisma.grade.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            class: {
              select: {
                name: true,
              },
            },
          },
        },
        course: true,
      },
    });

    const courseStats = {
      totalGrades: grades.length,
      average: grades.length > 0
        ? grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 20, 0) / grades.length
        : 0,
      distribution: {
        excellent: grades.filter((g) => (g.score / g.maxScore) * 20 >= 16).length,
        good: grades.filter((g) => (g.score / g.maxScore) * 20 >= 12 && (g.score / g.maxScore) * 20 < 16).length,
        average: grades.filter((g) => (g.score / g.maxScore) * 20 >= 10 && (g.score / g.maxScore) * 20 < 12).length,
        weak: grades.filter((g) => (g.score / g.maxScore) * 20 < 10).length,
      },
    };

    res.json(courseStats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Élèves en difficulté
router.get('/pedagogical/students-at-risk', async (req, res) => {
  try {
    const { classId } = req.query;

    const students = await prisma.student.findMany({
      where: classId ? { classId: classId as string } : {},
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
        grades: {
          include: {
            course: true,
          },
        },
        absences: true,
      },
    });

    const atRiskStudents = students
      .map((student) => {
        const grades = student.grades || [];
        const totalScore = grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 20 * g.coefficient, 0);
        const totalCoefficient = grades.reduce((sum, g) => sum + g.coefficient, 0);
        const average = totalCoefficient > 0 ? totalScore / totalCoefficient : 0;
        const unexcusedAbsences = student.absences?.filter((a) => !a.excused).length || 0;

        return {
          studentId: student.studentId,
          firstName: student.user.firstName,
          lastName: student.user.lastName,
          email: student.user.email,
          class: student.class?.name || 'Non assigné',
          average,
          unexcusedAbsences,
          totalGrades: grades.length,
          riskLevel: average < 10 || unexcusedAbsences > 5 ? 'high' : average < 12 ? 'medium' : 'low',
        };
      })
      .filter((s) => s.riskLevel !== 'low')
      .sort((a, b) => {
        if (a.riskLevel === 'high' && b.riskLevel !== 'high') return -1;
        if (a.riskLevel !== 'high' && b.riskLevel === 'high') return 1;
        return a.average - b.average;
      });

    res.json(atRiskStudents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== COMMUNICATION ==========

// Obtenir tous les messages
router.get('/messages', async (req, res) => {
  try {
    const { userId, unread } = req.query;

    const messages = await prisma.message.findMany({
      where: {
        ...(userId && { receiverId: userId as string }),
        ...(unread === 'true' && { read: false }),
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(messages);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Envoyer un message
router.post('/messages', async (req, res) => {
  try {
    const { receiverId, subject, content, category, channels } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'receiverId et content sont requis' });
    }

    // Valider les canaux
    const validChannels = ['PLATFORM', 'EMAIL', 'SMS'];
    const selectedChannels = channels && Array.isArray(channels) 
      ? channels.filter((c: string) => validChannels.includes(c))
      : ['PLATFORM']; // Par défaut, envoyer sur la plateforme

    if (selectedChannels.length === 0) {
      return res.status(400).json({ error: 'Au moins un canal doit être sélectionné' });
    }

    // Valider la catégorie
    const validCategories = ['GENERAL', 'ACADEMIC', 'ABSENCE', 'PAYMENT', 'CONDUCT', 'URGENT', 'ANNOUNCEMENT'];
    const messageCategory = category && validCategories.includes(category) ? category : 'GENERAL';

    // Récupérer les informations du destinataire
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    if (!receiver) {
      return res.status(404).json({ error: 'Destinataire non trouvé' });
    }

    // Récupérer les informations de l'expéditeur
    const sender = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    // Créer le message dans la base de données
    const message = await prisma.message.create({
      data: {
        senderId: req.user!.id,
        receiverId,
        subject,
        content,
        category: messageCategory,
        channels: selectedChannels,
        sentViaSMS: false,
        sentViaEmail: false,
        smsStatus: selectedChannels.includes('SMS') ? 'pending' : null,
        emailStatus: selectedChannels.includes('EMAIL') ? 'pending' : null,
      },
      include: {
        receiver: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        sender: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Envoyer via les différents canaux
    const sendResults = {
      email: { success: false, error: null as string | null },
      sms: { success: false, error: null as string | null },
    };

    // Envoyer par email si demandé
    if (selectedChannels.includes('EMAIL') && receiver.email) {
      const { sendMessageEmail } = await import('../utils/email.util');
      const emailResult = await sendMessageEmail(
        receiver.email,
        subject || 'Message de School Manager',
        content,
        `${sender?.firstName} ${sender?.lastName}`
      );

      if (emailResult.success) {
        sendResults.email.success = true;
        await prisma.message.update({
          where: { id: message.id },
          data: {
            sentViaEmail: true,
            emailStatus: 'sent',
          },
        });
      } else {
        sendResults.email.error = emailResult.error || 'Erreur inconnue';
        await prisma.message.update({
          where: { id: message.id },
          data: {
            emailStatus: 'failed',
          },
        });
      }
    }

    // Envoyer par SMS si demandé
    if (selectedChannels.includes('SMS') && receiver.phone) {
      const { sendSMS, formatPhoneNumber, isValidPhoneNumber } = await import('../utils/sms.util');
      
      if (isValidPhoneNumber(receiver.phone)) {
        const formattedPhone = formatPhoneNumber(receiver.phone);
        const smsContent = subject 
          ? `${subject}\n\n${content}` 
          : content;
        
        // Limiter la longueur du SMS (160 caractères)
        const smsText = smsContent.length > 160 
          ? smsContent.substring(0, 157) + '...' 
          : smsContent;

        const smsResult = await sendSMS(formattedPhone, smsText);

        if (smsResult.success) {
          sendResults.sms.success = true;
          await prisma.message.update({
            where: { id: message.id },
            data: {
              sentViaSMS: true,
              smsStatus: 'sent',
            },
          });
        } else {
          sendResults.sms.error = smsResult.error || 'Erreur inconnue';
          await prisma.message.update({
            where: { id: message.id },
            data: {
              smsStatus: 'failed',
            },
          });
        }
      } else {
        sendResults.sms.error = 'Numéro de téléphone invalide';
        await prisma.message.update({
          where: { id: message.id },
          data: {
            smsStatus: 'failed',
          },
        });
      }
    }

    // Récupérer le message mis à jour
    const updatedMessage = await prisma.message.findUnique({
      where: { id: message.id },
      include: {
        receiver: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        sender: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.status(201).json({
      ...updatedMessage,
      sendResults, // Inclure les résultats d'envoi pour information
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de l\'envoi du message' });
  }
});

// Obtenir un message par ID
router.get('/messages/:id', async (req, res) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.id },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    res.json(message);
  } catch (error: any) {
    console.error(`Erreur lors de la récupération du message ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Marquer un message comme lu
router.put('/messages/:id/read', async (req, res) => {
  try {
    const message = await prisma.message.update({
      where: { id: req.params.id },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    res.json(message);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir une annonce par ID
router.get('/announcements/:id', async (req, res) => {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        targetClass: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    res.json(announcement);
  } catch (error: any) {
    console.error(`Erreur lors de la récupération de l'annonce ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Obtenir toutes les annonces
router.get('/announcements', async (req, res) => {
  try {
    const { published, targetRole, targetClass } = req.query;

    const announcements = await prisma.announcement.findMany({
      where: {
        ...(published !== undefined && { published: published === 'true' }),
        ...(targetRole && { targetRole: targetRole as any }),
        ...(targetClass && { targetClassId: targetClass as string }),
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        targetClass: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(announcements);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des annonces:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Créer une annonce
router.post('/announcements', async (req, res) => {
  try {
    const { title, content, targetRole, targetClass, priority, expiresAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'title et content sont requis' });
    }

    // Valider le priority
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    const finalPriority = priority && validPriorities.includes(priority) ? priority : 'normal';

    // Valider le targetRole si fourni
    let finalTargetRole = null;
    if (targetRole) {
      const validRoles = ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'EDUCATOR'];
      if (validRoles.includes(targetRole)) {
        finalTargetRole = targetRole;
      }
    }

    // Vérifier que targetClass existe si fourni
    if (targetClass) {
      const classExists = await prisma.class.findUnique({
        where: { id: targetClass },
      });
      if (!classExists) {
        return res.status(400).json({ error: 'Classe non trouvée' });
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        authorId: req.user!.id,
        title: title.trim(),
        content: content.trim(),
        targetRole: finalTargetRole,
        targetClassId: targetClass || null,
        priority: finalPriority,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        targetClass: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    res.status(201).json(announcement);
  } catch (error: any) {
    console.error('Erreur lors de la création de l\'annonce:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Publier une annonce
router.put('/announcements/:id/publish', async (req, res) => {
  try {
    const announcement = await prisma.announcement.update({
      where: { id: req.params.id },
      data: {
        published: true,
        publishedAt: new Date(),
      },
    });

    res.json(announcement);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour une annonce
router.put('/announcements/:id', async (req, res) => {
  try {
    const { title, content, targetRole, targetClass, priority, expiresAt } = req.body;

    const announcement = await prisma.announcement.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(targetRole && { targetRole }),
        ...(targetClass && { targetClassId: targetClass }),
        ...(priority && { priority }),
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
      },
    });

    res.json(announcement);
  } catch (error: any) {
    console.error(`Erreur lors de la mise à jour de l'annonce ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Supprimer une annonce
router.delete('/announcements/:id', async (req, res) => {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: req.params.id },
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    await prisma.announcement.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Annonce supprimée avec succès' });
  } catch (error: any) {
    console.error(`Erreur lors de la suppression de l'annonce ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un message
router.delete('/messages/:id', async (req, res) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.id },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    await prisma.message.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Message supprimé avec succès' });
  } catch (error: any) {
    console.error(`Erreur lors de la suppression du message ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour une annonce
router.put('/announcements/:id', async (req, res) => {
  try {
    const { title, content, targetRole, targetClass, priority, expiresAt } = req.body;

    const announcement = await prisma.announcement.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(targetRole && { targetRole }),
        ...(targetClass && { targetClassId: targetClass }),
        ...(priority && { priority }),
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
      },
    });

    res.json(announcement);
  } catch (error: any) {
    console.error(`Erreur lors de la mise à jour de l'annonce ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Supprimer une annonce
router.delete('/announcements/:id', async (req, res) => {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: req.params.id },
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    await prisma.announcement.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Annonce supprimée avec succès' });
  } catch (error: any) {
    console.error(`Erreur lors de la suppression de l'annonce ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un message
router.delete('/messages/:id', async (req, res) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.id },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    await prisma.message.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Message supprimé avec succès' });
  } catch (error: any) {
    console.error(`Erreur lors de la suppression du message ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les notifications
router.get('/notifications', async (req, res) => {
  try {
    const { userId, unread } = req.query;

    const notifications = await prisma.notification.findMany({
      where: {
        ...(userId && { userId: userId as string }),
        ...(unread === 'true' && { read: false }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Augmenté pour permettre plus de notifications
    });

    res.json(notifications);
  } catch (error: any) {
    console.error('Erreur dans /admin/notifications:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Marquer toutes les notifications comme lues (doit être avant /notifications/:id/read)
router.put('/notifications/read-all', async (req, res) => {
  try {
    const { userId } = req.query;
    const currentUser = (req as any).user;

    // Construire le filtre where
    const where: any = {
      read: false,
    };

    // Si userId est fourni, filtrer par utilisateur, sinon utiliser l'utilisateur actuel
    if (userId) {
      where.userId = userId as string;
    } else if (currentUser?.id) {
      where.userId = currentUser.id;
    } else {
      // Si aucun userId n'est fourni et aucun utilisateur actuel, on marque toutes les notifications (pour admin)
      // On garde seulement le filtre read: false
    }

    // Mettre à jour toutes les notifications non lues
    const result = await prisma.notification.updateMany({
      where,
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    res.json({ 
      message: `${result.count} notification(s) marquée(s) comme lue(s)`,
      count: result.count 
    });
  } catch (error: any) {
    console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ========== GESTION DE LA CONDUITE ==========

// Obtenir toutes les évaluations de conduite
router.get('/conduct', async (req, res) => {
  try {
    const { studentId, period, academicYear } = req.query;

    const conducts = await prisma.conduct.findMany({
      where: {
        ...(studentId && { studentId: studentId as string }),
        ...(period && { period: period as string }),
        ...(academicYear && { academicYear: academicYear as string }),
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(conducts);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des évaluations de conduite:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Créer ou mettre à jour une évaluation de conduite (Admin)
router.post('/conduct', async (req, res) => {
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

    // Vérifier que l'étudiant existe
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Élève non trouvé' });
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
        evaluatedByRole: 'ADMIN',
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
        evaluatedByRole: 'ADMIN',
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

// Mettre à jour une évaluation de conduite (Admin)
router.put('/conduct/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      punctuality,
      respect,
      participation,
      behavior,
      comments,
    } = req.body;

    const conduct = await prisma.conduct.findUnique({
      where: { id },
    });

    if (!conduct) {
      return res.status(404).json({ error: 'Évaluation de conduite non trouvée' });
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
        evaluatedByRole: 'ADMIN',
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

// Supprimer une évaluation de conduite (Admin)
router.delete('/conduct/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const conduct = await prisma.conduct.findUnique({
      where: { id },
    });

    if (!conduct) {
      return res.status(404).json({ error: 'Évaluation de conduite non trouvée' });
    }

    await prisma.conduct.delete({
      where: { id },
    });

    res.json({ message: 'Évaluation de conduite supprimée avec succès' });
  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'évaluation de conduite:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Marquer une notification comme lue
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la notification existe
    const existingNotification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    res.json(notification);
  } catch (error: any) {
    console.error('Erreur dans /admin/notifications/:id/read:', error);
    // Si c'est une erreur de notification non trouvée, retourner 404
    if (error.code === 'P2025' || error.message?.includes('not found')) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Supprimer une notification
router.delete('/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la notification existe
    const existingNotification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.json({ message: 'Notification supprimée avec succès' });
  } catch (error: any) {
    console.error(`Erreur lors de la suppression de la notification ${req.params.id}:`, error);
    // Si c'est une erreur de notification non trouvée, retourner 404
    if (error.code === 'P2025' || error.message?.includes('not found')) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ========== GESTION DES EMPLOIS DU TEMPS ==========

// Obtenir tous les emplois du temps
router.get('/schedules', async (req, res) => {
  try {
    const { classId, courseId } = req.query;

    const schedules = await prisma.schedule.findMany({
      where: {
        ...(classId && { classId: classId as string }),
        ...(courseId && { courseId: courseId as string }),
      },
      include: {
        class: {
          select: {
            name: true,
            level: true,
          },
        },
        course: {
          select: {
            name: true,
            code: true,
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
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    res.json(schedules);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un emploi du temps
router.post('/schedules', async (req, res) => {
  try {
    const { classId, courseId, dayOfWeek, startTime, endTime, room } = req.body;

    if (!classId || !courseId || dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Vérifier les conflits
    const conflictingSchedule = await prisma.schedule.findFirst({
      where: {
        classId,
        dayOfWeek: parseInt(dayOfWeek),
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (conflictingSchedule) {
      return res.status(400).json({ error: 'Conflit d\'horaire détecté' });
    }

    const schedule = await prisma.schedule.create({
      data: {
        classId,
        courseId,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        room,
      },
      include: {
        class: true,
        course: {
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
      },
    });

    res.status(201).json(schedule);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir un emploi du temps par ID
router.get('/schedules/:id', async (req, res) => {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: req.params.id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            teacher: {
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
            },
          },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Emploi du temps non trouvé' });
    }

    res.json(schedule);
  } catch (error: any) {
    console.error('Erreur dans /admin/schedules/:id:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Mettre à jour un emploi du temps
router.put('/schedules/:id', async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime, room } = req.body;

    const schedule = await prisma.schedule.update({
      where: { id: req.params.id },
      data: {
        ...(dayOfWeek !== undefined && { dayOfWeek: parseInt(dayOfWeek) }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(room !== undefined && { room }),
      },
      include: {
        class: true,
        course: true,
      },
    });

    res.json(schedule);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un emploi du temps
router.delete('/schedules/:id', async (req, res) => {
  try {
    await prisma.schedule.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Emploi du temps supprimé' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== SÉCURITÉ & CONFIDENTIALITÉ ==========

// Obtenir les logs de connexion
router.get('/security/login-logs', async (req, res) => {
  try {
    const { userId, limit = 100 } = req.query;

    const limitNum = parseInt(limit as string) || 100;
    const validLimit = limitNum > 0 && limitNum <= 1000 ? limitNum : 100;

    const logs = await prisma.loginLog.findMany({
      where: {
        ...(userId && { userId: userId as string }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: validLimit,
    });

    res.json(logs);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des logs de connexion:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Obtenir les événements de sécurité
router.get('/security/events', async (req, res) => {
  try {
    const { userId, severity, limit = 100 } = req.query;

    const limitNum = parseInt(limit as string) || 100;
    const validLimit = limitNum > 0 && limitNum <= 1000 ? limitNum : 100;

    const events = await prisma.securityEvent.findMany({
      where: {
        ...(userId && { userId: userId as string }),
        ...(severity && { severity: severity as string }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: validLimit,
    });

    res.json(events);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des événements de sécurité:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Obtenir les statistiques de sécurité
router.get('/security/stats', async (req, res) => {
  try {
    const [totalLogins, successfulLogins, failedLogins, recentEvents, criticalEvents] = await Promise.all([
      prisma.loginLog.count(),
      prisma.loginLog.count({ where: { success: true } }),
      prisma.loginLog.count({ where: { success: false } }),
      prisma.securityEvent.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 derniers jours
          },
        },
      }),
      prisma.securityEvent.count({ where: { severity: 'critical' } }),
    ]);

    res.json({
      totalLogins,
      successfulLogins,
      failedLogins,
      recentEvents,
      criticalEvents,
      successRate: totalLogins > 0 ? (successfulLogins / totalLogins) * 100 : 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Changer le mot de passe d'un utilisateur
router.put('/security/users/:id/password', async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.params.id },
      data: { password: hashedPassword },
    });

    // Enregistrer l'événement de sécurité
    await prisma.securityEvent.create({
      data: {
        userId: req.user!.id,
        type: 'password_change',
        description: `Mot de passe modifié pour l'utilisateur ${req.params.id}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        severity: 'info',
      },
    });

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Désactiver/Activer un compte utilisateur
router.put('/security/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive },
    });

    // Enregistrer l'événement de sécurité
    await prisma.securityEvent.create({
      data: {
        userId: req.user!.id,
        type: isActive ? 'account_activated' : 'account_deactivated',
        description: `Compte ${isActive ? 'activé' : 'désactivé'} pour ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        severity: 'warning',
      },
    });

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== STATISTIQUES ==========

// Tableau de bord avec statistiques
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      activeStudents,
      totalParents,
      totalEducators,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count(),
      prisma.student.count({ where: { isActive: true } }),
      prisma.parent.count(),
      prisma.educator.count(),
    ]);

    res.json({
      totalStudents,
      totalTeachers,
      totalClasses,
      activeStudents,
      totalParents,
      totalEducators,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== GÉNÉRATION DE BULLETINS ==========

// Générer les données pour les bulletins
router.get('/report-cards/generate-data', async (req, res) => {
  try {
    const { classId, period, academicYear } = req.query;

    if (!classId || !period || !academicYear) {
      return res.status(400).json({ error: 'classId, period et academicYear sont requis' });
    }

    // Calculer les dates de début et fin de période
    const periodDates = getPeriodDates(period as string, academicYear as string);
    
    // Récupérer tous les élèves de la classe
    const students = await prisma.student.findMany({
      where: { classId: classId as string },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        class: {
          select: {
            name: true,
            level: true,
          },
        },
      },
    });

    // Récupérer tous les cours de la classe pour inclure les matières sans notes
    const classCourses = await prisma.course.findMany({
      where: { classId: classId as string },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    // Pour chaque élève, calculer les moyennes par matière
    const reportCardData = await Promise.all(
      students.map(async (student) => {
        // Récupérer toutes les notes de l'élève dans la période
        const grades = await prisma.grade.findMany({
          where: {
            studentId: student.id,
            date: {
              gte: periodDates.start,
              lte: periodDates.end,
            },
          },
          include: {
            course: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        });

        // Calculer les moyennes par cours (seulement pour les cours avec notes)
        const courseAverages: Record<string, { total: number; count: number; average: number }> = {};

        grades.forEach((grade) => {
          const courseId = grade.courseId;
          if (!courseAverages[courseId]) {
            courseAverages[courseId] = { total: 0, count: 0, average: 0 };
          }
          const gradeOn20 = (grade.score / grade.maxScore) * 20;
          courseAverages[courseId].total += gradeOn20 * grade.coefficient;
          courseAverages[courseId].count += grade.coefficient;
        });

        // Calculer la moyenne finale pour chaque cours
        Object.keys(courseAverages).forEach((courseId) => {
          const course = courseAverages[courseId];
          course.average = course.count > 0 ? course.total / course.count : 0;
        });

        // Ajouter les cours sans notes avec moyenne 0
        classCourses.forEach((course) => {
          if (!courseAverages[course.id]) {
            courseAverages[course.id] = { total: 0, count: 0, average: 0 };
          }
        });

        // Calculer la moyenne générale (seulement pour les cours avec notes)
        let totalWeightedAverage = 0;
        let totalCoefficient = 0;
        Object.entries(courseAverages).forEach(([courseId, course]) => {
          // Vérifier si ce cours a des notes
          const hasGrades = grades.some(g => g.courseId === courseId);
          if (hasGrades && course.count > 0) {
            totalWeightedAverage += course.average * course.count;
            totalCoefficient += course.count;
          }
        });
        const overallAverage = totalCoefficient > 0 ? totalWeightedAverage / totalCoefficient : 0;

        return {
          studentId: student.id,
          userId: student.userId,
          studentIdNumber: student.studentId,
          user: student.user,
          class: student.class,
          grades,
          courseAverages,
          allCourses: classCourses, // Ajouter tous les cours de la classe
          average: overallAverage,
          totalStudents: students.length,
        };
      })
    );

    // Trier par moyenne décroissante et attribuer les rangs
    reportCardData.sort((a, b) => b.average - a.average);
    reportCardData.forEach((student: any, index) => {
      student.rank = index + 1;
    });

    res.json(reportCardData);
  } catch (error: any) {
    console.error('Erreur lors de la génération des données de bulletins:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Sauvegarder les bulletins
router.post('/report-cards/save', async (req, res) => {
  try {
    const { classId, period, academicYear } = req.body;

    if (!classId || !period || !academicYear) {
      return res.status(400).json({ error: 'classId, period et academicYear sont requis' });
    }

    // Générer les données (réutiliser la logique)
    const periodDates = getPeriodDates(period, academicYear);
    
    const students = await prisma.student.findMany({
      where: { classId },
      include: {
        user: true,
      },
    });

    const savedReportCards = await Promise.all(
      students.map(async (student) => {
        const grades = await prisma.grade.findMany({
          where: {
            studentId: student.id,
            date: {
              gte: periodDates.start,
              lte: periodDates.end,
            },
          },
        });

        // Calculer la moyenne
        let totalWeightedAverage = 0;
        let totalCoefficient = 0;
        const courseAverages: Record<string, { total: number; count: number }> = {};

        grades.forEach((grade) => {
          const courseId = grade.courseId;
          if (!courseAverages[courseId]) {
            courseAverages[courseId] = { total: 0, count: 0 };
          }
          const gradeOn20 = (grade.score / grade.maxScore) * 20;
          courseAverages[courseId].total += gradeOn20 * grade.coefficient;
          courseAverages[courseId].count += grade.coefficient;
        });

        Object.values(courseAverages).forEach((course) => {
          const courseAverage = course.count > 0 ? course.total / course.count : 0;
          totalWeightedAverage += courseAverage * course.count;
          totalCoefficient += course.count;
        });

        const average = totalCoefficient > 0 ? totalWeightedAverage / totalCoefficient : 0;

        // Calculer le rang (simplifié, peut être amélioré)
        const allAverages = await Promise.all(
          students.map(async (s) => {
            const sGrades = await prisma.grade.findMany({
              where: {
                studentId: s.id,
                date: {
                  gte: periodDates.start,
                  lte: periodDates.end,
                },
              },
            });
            let sTotal = 0;
            let sCoeff = 0;
            const sCourseAvg: Record<string, { total: number; count: number }> = {};
            sGrades.forEach((g) => {
              if (!sCourseAvg[g.courseId]) sCourseAvg[g.courseId] = { total: 0, count: 0 };
              const gOn20 = (g.score / g.maxScore) * 20;
              sCourseAvg[g.courseId].total += gOn20 * g.coefficient;
              sCourseAvg[g.courseId].count += g.coefficient;
            });
            Object.values(sCourseAvg).forEach((c) => {
              const cAvg = c.count > 0 ? c.total / c.count : 0;
              sTotal += cAvg * c.count;
              sCoeff += c.count;
            });
            return sCoeff > 0 ? sTotal / sCoeff : 0;
          })
        );

        allAverages.sort((a, b) => b - a);
        const rank = allAverages.findIndex((a) => a <= average) + 1;

        // Créer ou mettre à jour le bulletin
        const periodLabel = getPeriodLabel(period);
        
        // Vérifier si le bulletin existe déjà
        const existingReportCard = await prisma.reportCard.findUnique({
          where: {
            studentId_period_academicYear: {
              studentId: student.id,
              period: periodLabel,
              academicYear,
            },
          },
        });

        let reportCard;
        if (existingReportCard) {
          // Mettre à jour
          reportCard = await prisma.reportCard.update({
            where: { id: existingReportCard.id },
            data: {
              average,
              rank,
            },
          });
        } else {
          // Créer
          reportCard = await prisma.reportCard.create({
            data: {
              studentId: student.id,
              period: periodLabel,
              academicYear,
              average,
              rank,
              published: false,
            },
          });
        }

        return reportCard;
      })
    );

    res.json({ message: `${savedReportCards.length} bulletin(s) sauvegardé(s)`, count: savedReportCards.length });
  } catch (error: any) {
    console.error('Erreur lors de la sauvegarde des bulletins:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Obtenir les bulletins
router.get('/report-cards', async (req, res) => {
  try {
    const { classId, period, academicYear } = req.query;

    const where: any = {};
    if (classId) {
      where.student = { classId: classId as string };
    }
    if (period) {
      where.period = period as string;
    }
    if (academicYear) {
      where.academicYear = academicYear as string;
    }

    const reportCards = await prisma.reportCard.findMany({
      where,
      orderBy: [
        { academicYear: 'desc' },
        { period: 'desc' },
        { average: 'desc' },
      ],
    });

    res.json(reportCards);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des bulletins:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Fonctions utilitaires
function getPeriodDates(period: string, academicYear: string): { start: Date; end: Date } {
  const [yearStart, yearEnd] = academicYear.split('-').map(Number);
  let start: Date;
  let end: Date;

  switch (period) {
    case 'trim1':
      start = new Date(yearStart, 8, 1); // Septembre
      end = new Date(yearStart, 10, 30); // Novembre
      break;
    case 'trim2':
      start = new Date(yearStart, 11, 1); // Décembre
      end = new Date(yearEnd, 1, 28); // Février
      break;
    case 'trim3':
      start = new Date(yearEnd, 2, 1); // Mars
      end = new Date(yearEnd, 6, 30); // Juillet
      break;
    case 'sem1':
      start = new Date(yearStart, 8, 1); // Septembre
      end = new Date(yearEnd, 1, 28); // Février
      break;
    case 'sem2':
      start = new Date(yearEnd, 2, 1); // Mars
      end = new Date(yearEnd, 6, 30); // Juillet
      break;
    default:
      start = new Date(yearStart, 8, 1);
      end = new Date(yearEnd, 6, 30);
  }

  return { start, end };
}

function getPeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    trim1: 'Trimestre 1',
    trim2: 'Trimestre 2',
    trim3: 'Trimestre 3',
    sem1: 'Semestre 1',
    sem2: 'Semestre 2',
  };
  return labels[period] || period;
}

// ========== GESTION DES FRAIS DE SCOLARITÉ ==========

// Obtenir tous les frais de scolarité
router.get('/tuition-fees', async (req, res) => {
  try {
    const { studentId, classId, academicYear, period, isPaid, grouped } = req.query;

    const where: any = {};
    if (studentId) {
      where.studentId = studentId as string;
    }
    if (classId) {
      where.student = { classId: classId as string };
    }
    if (academicYear) {
      where.academicYear = academicYear as string;
    }
    if (period) {
      where.period = period as string;
    }
    if (isPaid !== undefined) {
      where.isPaid = isPaid === 'true';
    }

    // Si grouped=true, retourner les frais regroupés par élève et parent
    if (grouped === 'true') {
      const tuitionFees = await prisma.tuitionFee.findMany({
        where,
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
              parents: {
                include: {
                  parent: {
                    include: {
                      user: {
                        select: {
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
          payments: {
            include: {
              payer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Regrouper par élève
      const groupedByStudent: { [key: string]: any } = {};
      
      tuitionFees.forEach((fee: any) => {
        const studentId = fee.studentId;
        if (!groupedByStudent[studentId]) {
          groupedByStudent[studentId] = {
            student: {
              id: fee.student.id,
              name: `${fee.student.user.firstName} ${fee.student.user.lastName}`,
              email: fee.student.user.email,
              class: fee.student.class?.name || 'Non assigné',
              level: fee.student.class?.level || '',
            },
            fees: [],
            totalAmount: 0,
            totalPaid: 0,
            byParent: {} as { [key: string]: any },
          };
        }
        
        groupedByStudent[studentId].fees.push(fee);
        groupedByStudent[studentId].totalAmount += fee.amount;
        
        // Calculer le total payé pour ce frais
        const feeTotalPaid = fee.payments
          .filter((p: any) => p.status === 'COMPLETED')
          .reduce((sum: number, p: any) => sum + p.amount, 0);
        groupedByStudent[studentId].totalPaid += feeTotalPaid;
        
        // Regrouper les paiements par parent pour cet élève
        fee.payments.forEach((payment: any) => {
          const payerId = payment.payerId;
          if (payment.payer.role === 'PARENT' || payment.payer.role === 'STUDENT') {
            if (!groupedByStudent[studentId].byParent[payerId]) {
              groupedByStudent[studentId].byParent[payerId] = {
                payer: {
                  id: payment.payer.id,
                  name: `${payment.payer.firstName} ${payment.payer.lastName}`,
                  email: payment.payer.email,
                  role: payment.payer.role,
                },
                payments: [],
                totalPaid: 0,
              };
            }
            
            groupedByStudent[studentId].byParent[payerId].payments.push(payment);
            if (payment.status === 'COMPLETED') {
              groupedByStudent[studentId].byParent[payerId].totalPaid += payment.amount;
            }
          }
        });
      });

      // Convertir en tableau et calculer les totaux par parent
      const result = Object.values(groupedByStudent).map((group: any) => {
        // Convertir byParent en tableau
        group.byParent = Object.values(group.byParent);
        // Calculer le montant restant
        group.remainingAmount = group.totalAmount - group.totalPaid;
        group.paymentProgress = group.totalAmount > 0 
          ? (group.totalPaid / group.totalAmount) * 100 
          : 0;
        return group;
      });

      return res.json(result);
    }

    // Sinon, retourner la liste simple
    const tuitionFees = await prisma.tuitionFee.findMany({
      where,
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
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    res.json(tuitionFees);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des frais de scolarité:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Créer un frais de scolarité pour un élève
router.post('/tuition-fees', async (req, res) => {
  try {
    console.log('Requête reçue pour créer un frais de scolarité:', req.body);
    const { studentId, academicYear, period, amount, dueDate, description } = req.body;

    if (!studentId || !academicYear || !period || !amount || !dueDate) {
      console.error('Champs manquants:', { studentId, academicYear, period, amount, dueDate });
      return res.status(400).json({ error: 'studentId, academicYear, period, amount et dueDate sont requis' });
    }

    // Vérifier que l'élève existe
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      console.error('Élève non trouvé:', studentId);
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    // Vérifier si un frais similaire existe déjà
    const existingFee = await prisma.tuitionFee.findFirst({
      where: {
        studentId,
        academicYear,
        period,
      },
    });

    if (existingFee) {
      console.error('Frais déjà existant pour:', { studentId, academicYear, period });
      return res.status(400).json({ error: 'Un frais de scolarité existe déjà pour cet élève, cette période et cette année scolaire' });
    }

    // Valider et convertir les données
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return res.status(400).json({ error: 'Le montant doit être un nombre positif' });
    }

    const dueDateValue = new Date(dueDate);
    if (isNaN(dueDateValue.getTime())) {
      return res.status(400).json({ error: 'La date d\'échéance est invalide' });
    }

    // Préparer les données pour Prisma
    const tuitionFeeData = {
      studentId,
      academicYear: String(academicYear),
      period: String(period),
      amount: amountValue,
      dueDate: dueDateValue,
      description: description ? String(description) : null,
      isPaid: false,
    };

    console.log('Données à insérer dans Prisma:', tuitionFeeData);

    // Créer le frais de scolarité
    const tuitionFee = await prisma.tuitionFee.create({
      data: tuitionFeeData,
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
      },
    });

    console.log('Frais de scolarité créé avec succès:', tuitionFee.id);
    res.status(201).json(tuitionFee);
  } catch (error: any) {
    console.error('Erreur lors de la création du frais de scolarité:', error);
    console.error('Stack:', error.stack);
    console.error('Body reçu:', req.body);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      code: error.code,
    });
  }
});

// Créer des frais de scolarité pour plusieurs élèves (par classe)
router.post('/tuition-fees/bulk', async (req, res) => {
  try {
    const { classId, academicYear, period, amount, dueDate, description, studentIds } = req.body;

    if (!academicYear || !period || !amount || !dueDate) {
      return res.status(400).json({ error: 'academicYear, period, amount et dueDate sont requis' });
    }

    if (!classId && (!studentIds || studentIds.length === 0)) {
      return res.status(400).json({ error: 'classId ou studentIds est requis' });
    }

    // Récupérer les élèves
    let students;
    if (classId) {
      students = await prisma.student.findMany({
        where: {
          classId: classId as string,
          isActive: true,
        },
      });
    } else {
      students = await prisma.student.findMany({
        where: {
          id: { in: studentIds },
          isActive: true,
        },
      });
    }

    if (students.length === 0) {
      return res.status(404).json({ error: 'Aucun élève trouvé' });
    }

    const createdFees: any[] = [];
    const skippedFees: Array<{ studentId: string; reason: string }> = [];

    for (const student of students) {
      // Vérifier si un frais similaire existe déjà
      const existingFee = await prisma.tuitionFee.findFirst({
        where: {
          studentId: student.id,
          academicYear,
          period,
        },
      });

      if (existingFee) {
        skippedFees.push({
          studentId: student.id,
          reason: 'Frais déjà existant',
        });
        continue;
      }

      // Créer le frais de scolarité
      const tuitionFee = await prisma.tuitionFee.create({
        data: {
          studentId: student.id,
          academicYear,
          period,
          amount: parseFloat(amount),
          dueDate: new Date(dueDate),
          description: description || null,
          isPaid: false,
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

      createdFees.push(tuitionFee);
    }

    res.status(201).json({
      message: 'Frais de scolarité créés avec succès',
      created: createdFees.length,
      skipped: skippedFees.length,
      details: {
        created: createdFees,
        skipped: skippedFees,
      },
    });
  } catch (error: any) {
    console.error('Erreur lors de la création en masse des frais de scolarité:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Mettre à jour un frais de scolarité
router.put('/tuition-fees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { academicYear, period, amount, dueDate, description, isPaid } = req.body;

    const tuitionFee = await prisma.tuitionFee.findUnique({
      where: { id },
    });

    if (!tuitionFee) {
      return res.status(404).json({ error: 'Frais de scolarité non trouvé' });
    }

    const updatedTuitionFee = await prisma.tuitionFee.update({
      where: { id },
      data: {
        ...(academicYear && { academicYear }),
        ...(period && { period }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(description !== undefined && { description }),
        ...(isPaid !== undefined && { isPaid }),
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
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    res.json(updatedTuitionFee);
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du frais de scolarité:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Supprimer un frais de scolarité
router.delete('/tuition-fees/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const tuitionFee = await prisma.tuitionFee.findUnique({
      where: { id },
    });

    if (!tuitionFee) {
      return res.status(404).json({ error: 'Frais de scolarité non trouvé' });
    }

    // Supprimer les paiements associés
    await prisma.payment.deleteMany({
      where: { tuitionFeeId: id },
    });

    // Supprimer le frais de scolarité
    await prisma.tuitionFee.delete({
      where: { id },
    });

    res.json({ message: 'Frais de scolarité supprimé avec succès' });
  } catch (error: any) {
    console.error('Erreur lors de la suppression du frais de scolarité:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Créer des frais de scolarité de test
router.post('/tuition-fees/create-test', async (req, res) => {
  try {
    // Récupérer tous les étudiants actifs
    const students = await prisma.student.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (students.length === 0) {
      return res.status(404).json({ error: 'Aucun étudiant actif trouvé' });
    }

    // Année scolaire actuelle
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const academicYear = currentMonth >= 8 
      ? `${currentYear}-${currentYear + 1}` 
      : `${currentYear - 1}-${currentYear}`;

    // Périodes possibles
    const periods = [
      'Trimestre 1',
      'Trimestre 2',
      'Trimestre 3',
      'Semestre 1',
      'Semestre 2',
      'Frais d\'inscription',
      'Frais de scolarité annuelle',
    ];

    // Montants possibles (en FCFA)
    const amounts = [50000, 75000, 100000, 125000, 150000, 200000, 250000];

    let createdCount = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    for (const student of students) {
      // Créer 2-4 frais par étudiant
      const numFees = Math.floor(Math.random() * 3) + 2;

      for (let i = 0; i < numFees; i++) {
        const period = periods[Math.floor(Math.random() * periods.length)];
        const amount = amounts[Math.floor(Math.random() * amounts.length)];
        
        // Générer une date d'échéance
        const dueDate = new Date();
        const daysOffset = Math.floor(Math.random() * 90) - 30; // Entre -30 et +60 jours
        dueDate.setDate(dueDate.getDate() + daysOffset);

        // Déterminer le statut (30% payé, 50% en attente, 20% en retard)
        const statusRand = Math.random();
        let isPaid = false;
        let paidAt: Date | null = null;

        if (statusRand < 0.3) {
          // Frais payé
          isPaid = true;
          paidAt = new Date(dueDate);
          paidAt.setDate(paidAt.getDate() - Math.floor(Math.random() * 30)); // Payé avant l'échéance
          paidCount++;
        } else if (statusRand < 0.8) {
          // Frais en attente
          pendingCount++;
        } else {
          // Frais en retard
          overdueCount++;
        }

        // Vérifier si un frais similaire existe déjà
        const existingFee = await prisma.tuitionFee.findFirst({
          where: {
            studentId: student.id,
            academicYear,
            period,
          },
        });

        if (existingFee) {
          continue; // Ignorer si le frais existe déjà
        }

        // Créer le frais de scolarité
        const tuitionFee = await prisma.tuitionFee.create({
          data: {
            studentId: student.id,
            academicYear,
            period,
            amount,
            dueDate,
            description: `Frais de scolarité pour ${period} - ${academicYear}`,
            isPaid,
            paidAt,
          },
        });

        createdCount++;

        // Si le frais est payé, créer un paiement associé
        if (isPaid && paidAt) {
          const paymentMethods = ['CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CASH'];
          const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

          await prisma.payment.create({
            data: {
              tuitionFeeId: tuitionFee.id,
              studentId: student.id,
              payerId: student.userId,
              payerRole: 'STUDENT',
              amount,
              paymentMethod: paymentMethod as any,
              status: 'COMPLETED',
              paymentReference: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
              transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
              paidAt,
            },
          });
        }
      }
    }

    res.json({
      message: 'Frais de scolarité de test créés avec succès',
      summary: {
        totalCreated: createdCount,
        paid: paidCount,
        pending: pendingCount,
        overdue: overdueCount,
        students: students.length,
      },
    });
  } catch (error: any) {
    console.error('Erreur lors de la création des frais de scolarité de test:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ========== GESTION DES PAIEMENTS ==========

// Obtenir tous les paiements regroupés par élève et par parent
router.get('/payments/grouped', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
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
        payer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        tuitionFee: {
          select: {
            id: true,
            period: true,
            academicYear: true,
            amount: true,
            dueDate: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Regrouper par élève
    const groupedByStudent: { [key: string]: any } = {};
    
    payments.forEach((payment: any) => {
      const studentId = payment.studentId;
      if (!groupedByStudent[studentId]) {
        groupedByStudent[studentId] = {
          student: {
            id: payment.student.id,
            name: `${payment.student.user.firstName} ${payment.student.user.lastName}`,
            email: payment.student.user.email,
            class: payment.student.class?.name || 'Non assigné',
            level: payment.student.class?.level || '',
          },
          payments: [],
          totalPaid: 0,
          byParent: {} as { [key: string]: any },
        };
      }
      
      groupedByStudent[studentId].payments.push(payment);
      groupedByStudent[studentId].totalPaid += payment.amount;
      
      // Regrouper par parent pour cet élève
      const payerId = payment.payerId;
      if (!groupedByStudent[studentId].byParent[payerId]) {
        groupedByStudent[studentId].byParent[payerId] = {
          parent: {
            id: payment.payer.id,
            name: `${payment.payer.firstName} ${payment.payer.lastName}`,
            email: payment.payer.email,
            role: payment.payer.role,
          },
          payments: [],
          totalPaid: 0,
        };
      }
      
      groupedByStudent[studentId].byParent[payerId].payments.push(payment);
      groupedByStudent[studentId].byParent[payerId].totalPaid += payment.amount;
    });

    // Convertir en tableau et calculer les totaux par parent
    const result = Object.values(groupedByStudent).map((group: any) => {
      // Convertir byParent en tableau
      group.byParent = Object.values(group.byParent);
      return group;
    });

    res.json(result);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des paiements regroupés:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Obtenir tous les paiements (liste simple)
router.get('/payments', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
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
        payer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        tuitionFee: {
          select: {
            id: true,
            period: true,
            academicYear: true,
            amount: true,
            dueDate: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(payments);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des paiements:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ========== INSCRIPTIONS & ADMISSIONS ==========

async function admissionsWithEnrolledStudents<A extends { enrolledStudentId: string | null }>(
  rows: A[],
  mode: 'list' | 'detail' | 'patch'
): Promise<(A & { enrolledStudent: unknown })[]> {
  const ids = [...new Set(rows.map((r) => r.enrolledStudentId).filter(Boolean))] as string[];
  if (ids.length === 0) {
    return rows.map((r) => ({ ...r, enrolledStudent: null }));
  }
  const include =
    mode === 'list'
      ? {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          class: { select: { id: true, name: true, level: true } },
        }
      : mode === 'detail'
        ? {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            class: true,
          }
        : {
            user: { select: { email: true, firstName: true, lastName: true } },
          };
  const students = await prisma.student.findMany({
    where: { id: { in: ids } },
    include,
  });
  const map = new Map(students.map((s) => [s.id, s]));
  return rows.map((r) => ({
    ...r,
    enrolledStudent: r.enrolledStudentId ? map.get(r.enrolledStudentId) ?? null : null,
  }));
}

router.get('/admissions', async (req, res) => {
  try {
    const { status, academicYear } = req.query;
    const admissions = await prisma.admission.findMany({
      where: {
        ...(status && typeof status === 'string' ? { status: status as any } : {}),
        ...(academicYear && typeof academicYear === 'string'
          ? { academicYear: academicYear }
          : {}),
      },
      include: {
        proposedClass: {
          select: { id: true, name: true, level: true, academicYear: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const enriched = await admissionsWithEnrolledStudents(admissions, 'list');
    res.json(enriched);
  } catch (error: any) {
    console.error('GET /admissions:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.get('/admissions/stats', async (_req, res) => {
  try {
    const [pending, underReview, accepted, total] = await Promise.all([
      prisma.admission.count({ where: { status: 'PENDING' } }),
      prisma.admission.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.admission.count({ where: { status: 'ACCEPTED' } }),
      prisma.admission.count(),
    ]);
    res.json({ pending, underReview, accepted, total });
  } catch (error: any) {
    console.error('GET /admissions/stats:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.get('/admissions/:id', async (req, res) => {
  try {
    const admission = await prisma.admission.findUnique({
      where: { id: req.params.id },
      include: {
        proposedClass: true,
      },
    });
    if (!admission) {
      return res.status(404).json({ error: 'Dossier introuvable' });
    }
    const [enriched] = await admissionsWithEnrolledStudents([admission], 'detail');
    res.json(enriched);
  } catch (error: any) {
    console.error('GET /admissions/:id:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.patch(
  '/admissions/:id',
  [
    body('status')
      .optional()
      .isIn(['PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'WAITLIST', 'ENROLLED'])
      .withMessage('Statut invalide'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const existing = await prisma.admission.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Dossier introuvable' });
      }
      if (existing.status === 'ENROLLED' && req.body.status && req.body.status !== 'ENROLLED') {
        return res.status(400).json({ error: 'Impossible de modifier le statut d\'un dossier déjà inscrit' });
      }

      const { status, adminNotes, proposedClassId } = req.body;
      const adminId = (req as any).user?.id;

      if (status === 'ENROLLED' && !existing.enrolledStudentId) {
        return res.status(400).json({
          error:
            'Le statut « Inscrit » est attribué automatiquement après création du compte élève (action Inscrire).',
        });
      }

      const data: any = {
        ...(status !== undefined && { status }),
        ...(adminNotes !== undefined && { adminNotes: adminNotes === '' ? null : String(adminNotes) }),
        ...(proposedClassId !== undefined && {
          proposedClassId: proposedClassId === '' || proposedClassId === null ? null : proposedClassId,
        }),
        ...(status !== undefined &&
          status !== existing.status && {
            reviewedAt: new Date(),
            reviewedById: adminId,
          }),
      };

      const updated = await prisma.admission.update({
        where: { id: req.params.id },
        data,
        include: {
          proposedClass: { select: { id: true, name: true, level: true } },
        },
      });

      const [enriched] = await admissionsWithEnrolledStudents([updated], 'patch');

      try {
        await prisma.securityEvent.create({
          data: {
            userId: adminId,
            type: 'admission_updated',
            description: `Dossier ${existing.reference}: ${status ?? existing.status}`,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.get('user-agent'),
            severity: 'info',
          },
        });
      } catch (_) {
        /* ignore */
      }

      res.json(enriched);
    } catch (error: any) {
      console.error('PATCH /admissions/:id:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

async function generateUniqueStudentId(firstName: string, lastName: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const initials = `${firstName[0]?.toUpperCase() || 'X'}${lastName[0]?.toUpperCase() || 'X'}`;
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const candidate = `STU${initials}${random}`;
    const taken = await prisma.student.findUnique({ where: { studentId: candidate } });
    if (!taken) return candidate;
  }
  return `STU${Date.now().toString(36).toUpperCase()}`;
}

router.post(
  '/admissions/:id/enroll',
  [
    body('password').isLength({ min: 6 }).withMessage('Mot de passe (min. 6 caractères) requis'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const admission = await prisma.admission.findUnique({
        where: { id: req.params.id },
      });

      if (!admission) {
        return res.status(404).json({ error: 'Dossier introuvable' });
      }
      if (admission.status !== 'ACCEPTED') {
        return res.status(400).json({
          error: 'Le dossier doit être au statut « Accepté » avant de créer le compte élève',
        });
      }
      if (admission.enrolledStudentId) {
        return res.status(400).json({ error: 'Un compte élève existe déjà pour ce dossier' });
      }

      const {
        password,
        studentId: bodyStudentId,
        classId: bodyClassId,
        address,
        emergencyContact,
        emergencyPhone,
        medicalInfo,
      } = req.body;

      const email = admission.email.trim().toLowerCase();
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          error: 'Cet email est déjà utilisé par un compte. Utilisez un autre email sur le dossier ou fusionnez manuellement.',
        });
      }

      let studentId = bodyStudentId ? String(bodyStudentId).trim() : '';
      if (!studentId) {
        studentId = await generateUniqueStudentId(admission.firstName, admission.lastName);
      } else {
        const taken = await prisma.student.findUnique({ where: { studentId } });
        if (taken) {
          return res.status(400).json({ error: 'Ce numéro d\'élève existe déjà' });
        }
      }

      const classId = bodyClassId || admission.proposedClassId || undefined;
      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: admission.firstName,
          lastName: admission.lastName,
          phone: admission.phone ?? undefined,
          role: 'STUDENT',
          studentProfile: {
            create: {
              studentId,
              dateOfBirth: admission.dateOfBirth,
              gender: admission.gender,
              address: address ?? admission.address ?? undefined,
              emergencyContact: emergencyContact ?? admission.parentName ?? undefined,
              emergencyPhone: emergencyPhone ?? admission.parentPhone ?? undefined,
              medicalInfo: medicalInfo ?? undefined,
              classId: classId ?? undefined,
            },
          },
        },
        include: {
          studentProfile: {
            include: { class: true },
          },
        },
      });

      const createdStudent = user.studentProfile;
      if (!createdStudent) {
        return res.status(500).json({ error: 'Profil élève non créé' });
      }

      await prisma.admission.update({
        where: { id: admission.id },
        data: {
          status: 'ENROLLED',
          enrolledStudentId: createdStudent.id,
          reviewedById: (req as any).user?.id,
          reviewedAt: new Date(),
        },
      });

      try {
        await prisma.securityEvent.create({
          data: {
            userId: (req as any).user?.id,
            type: 'admission_enrolled',
            description: `Inscription finalisée: ${admission.reference} → ${studentId}`,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.get('user-agent'),
            severity: 'info',
          },
        });
      } catch (_) {
        /* ignore */
      }

      res.status(201).json({
        message: 'Élève inscrit et compte créé',
        user,
        reference: admission.reference,
      });
    } catch (error: any) {
      console.error('POST /admissions/:id/enroll:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

// ========== BIBLIOTHÈQUE ==========

router.get('/library/books', async (req, res) => {
  try {
    const { search, category, isActive } = req.query;
    const where: any = {};
    if (isActive === 'false') {
      where.isActive = false;
    } else if (isActive === 'all') {
      // pas de filtre isActive
    } else {
      where.isActive = true;
    }
    if (category && typeof category === 'string' && category.length > 0) {
      where.category = category;
    }
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const s = search.trim();
      where.OR = [
        { title: { contains: s } },
        { author: { contains: s } },
        { isbn: { contains: s } },
      ];
    }
    const books = await prisma.libraryBook.findMany({
      where,
      orderBy: { title: 'asc' },
    });
    res.json(books);
  } catch (error: any) {
    console.error('GET /library/books:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.post(
  '/library/books',
  [
    body('title').notEmpty().withMessage('Titre requis'),
    body('author').notEmpty().withMessage('Auteur requis'),
    body('copiesTotal').optional().isInt({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const {
        isbn,
        title,
        author,
        publisher,
        publicationYear,
        category,
        description,
        copiesTotal,
        copiesAvailable,
        shelfLocation,
      } = req.body;
      const total = copiesTotal != null ? parseInt(String(copiesTotal), 10) : 1;
      const avail =
        copiesAvailable != null ? parseInt(String(copiesAvailable), 10) : total;
      if (avail < 0 || avail > total) {
        return res
          .status(400)
          .json({ error: 'Exemplaires disponibles incohérents avec le total' });
      }
      const book = await prisma.libraryBook.create({
        data: {
          isbn: isbn?.trim() || null,
          title: String(title).trim(),
          author: String(author).trim(),
          publisher: publisher?.trim() || null,
          publicationYear:
            publicationYear != null && publicationYear !== ''
              ? parseInt(String(publicationYear), 10)
              : null,
          category: category?.trim() || null,
          description: description?.trim() || null,
          copiesTotal: total,
          copiesAvailable: avail,
          shelfLocation: shelfLocation?.trim() || null,
        },
      });
      res.status(201).json(book);
    } catch (error: any) {
      console.error('POST /library/books:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

router.put('/library/books/:id', async (req, res) => {
  try {
    const {
      isbn,
      title,
      author,
      publisher,
      publicationYear,
      category,
      description,
      copiesTotal,
      copiesAvailable,
      shelfLocation,
      isActive,
    } = req.body;
    const existing = await prisma.libraryBook.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Livre introuvable' });
    }
    const data: any = {};
    if (isbn !== undefined) data.isbn = isbn === null || isbn === '' ? null : String(isbn).trim();
    if (title !== undefined) data.title = String(title).trim();
    if (author !== undefined) data.author = String(author).trim();
    if (publisher !== undefined) data.publisher = publisher?.trim() || null;
    if (publicationYear !== undefined) {
      data.publicationYear =
        publicationYear === null || publicationYear === ''
          ? null
          : parseInt(String(publicationYear), 10);
    }
    if (category !== undefined) data.category = category?.trim() || null;
    if (description !== undefined) data.description = description?.trim() || null;
    if (shelfLocation !== undefined) data.shelfLocation = shelfLocation?.trim() || null;
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (copiesTotal !== undefined) {
      data.copiesTotal = parseInt(String(copiesTotal), 10);
    }
    if (copiesAvailable !== undefined) {
      data.copiesAvailable = parseInt(String(copiesAvailable), 10);
    }
    if (data.copiesTotal != null && data.copiesAvailable != null) {
      if (data.copiesAvailable < 0 || data.copiesAvailable > data.copiesTotal) {
        return res.status(400).json({ error: 'Exemplaires disponibles incohérents' });
      }
    } else if (data.copiesTotal != null) {
      const nextTotal = data.copiesTotal;
      const diff = nextTotal - existing.copiesTotal;
      data.copiesAvailable = Math.max(0, existing.copiesAvailable + diff);
      if (data.copiesAvailable > nextTotal) {
        data.copiesAvailable = nextTotal;
      }
    }
    const book = await prisma.libraryBook.update({
      where: { id: req.params.id },
      data,
    });
    res.json(book);
  } catch (error: any) {
    console.error('PUT /library/books/:id:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.delete('/library/books/:id', async (req, res) => {
  try {
    const activeLoans = await prisma.libraryLoan.count({
      where: { bookId: req.params.id, status: 'ACTIVE' },
    });
    if (activeLoans > 0) {
      return res.status(400).json({
        error: 'Impossible de supprimer : emprunts actifs sur cet ouvrage',
      });
    }
    await prisma.libraryBook.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ ok: true });
  } catch (error: any) {
    console.error('DELETE /library/books/:id:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.get('/library/loans', async (req, res) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status === 'ACTIVE' || status === 'RETURNED') {
      where.status = status;
    }
    const loans = await prisma.libraryLoan.findMany({
      where,
      include: {
        book: true,
        borrower: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { loanedAt: 'desc' },
    });
    const now = new Date();
    const enriched = loans.map((l) => ({
      ...l,
      isOverdue:
        l.status === 'ACTIVE' && l.returnedAt == null && new Date(l.dueDate) < now,
    }));
    res.json(enriched);
  } catch (error: any) {
    console.error('GET /library/loans:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.post(
  '/library/loans',
  [body('bookId').notEmpty(), body('borrowerId').notEmpty(), body('dueDate').isISO8601()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { bookId, borrowerId, dueDate, notes } = req.body;
      const adminId = (req as any).user?.id as string | undefined;

      const result = await prisma.$transaction(async (tx) => {
        const book = await tx.libraryBook.findUnique({ where: { id: bookId } });
        if (!book || !book.isActive) {
          throw Object.assign(new Error('Livre introuvable ou inactif'), { status: 404 });
        }
        if (book.copiesAvailable < 1) {
          throw Object.assign(new Error('Aucun exemplaire disponible'), { status: 400 });
        }
        const borrower = await tx.user.findUnique({ where: { id: borrowerId } });
        if (!borrower) {
          throw Object.assign(new Error('Utilisateur introuvable'), { status: 404 });
        }
        const loan = await tx.libraryLoan.create({
          data: {
            bookId,
            borrowerId,
            dueDate: new Date(dueDate),
            notes: notes?.trim() || null,
            createdById: adminId || null,
            status: 'ACTIVE',
          },
        });
        await tx.libraryBook.update({
          where: { id: bookId },
          data: { copiesAvailable: { decrement: 1 } },
        });
        return loan;
      });

      const full = await prisma.libraryLoan.findUnique({
        where: { id: result.id },
        include: {
          book: true,
          borrower: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      });
      res.status(201).json(full);
    } catch (error: any) {
      const code = error.status || 500;
      if (code !== 500) {
        return res.status(code).json({ error: error.message });
      }
      console.error('POST /library/loans:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

router.patch('/library/loans/:id/return', async (req, res) => {
  try {
    const loan = await prisma.libraryLoan.findUnique({
      where: { id: req.params.id },
      include: { book: true },
    });
    if (!loan) {
      return res.status(404).json({ error: 'Emprunt introuvable' });
    }
    if (loan.status === 'RETURNED') {
      return res.status(400).json({ error: 'Déjà retourné' });
    }
    await prisma.$transaction(async (tx) => {
      await tx.libraryLoan.update({
        where: { id: loan.id },
        data: {
          status: 'RETURNED',
          returnedAt: new Date(),
        },
      });
      await tx.libraryBook.update({
        where: { id: loan.bookId },
        data: { copiesAvailable: { increment: 1 } },
      });
      const nextRes = await tx.libraryReservation.findFirst({
        where: { bookId: loan.bookId, status: 'PENDING' },
        orderBy: { reservedAt: 'asc' },
      });
      if (nextRes) {
        const exp = new Date();
        exp.setDate(exp.getDate() + 7);
        await tx.libraryReservation.update({
          where: { id: nextRes.id },
          data: { status: 'READY', expiresAt: exp },
        });
      }
    });
    const updated = await prisma.libraryLoan.findUnique({
      where: { id: req.params.id },
      include: {
        book: true,
        borrower: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
    res.json(updated);
  } catch (error: any) {
    console.error('PATCH /library/loans/:id/return:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.get('/library/reservations', async (req, res) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (
      status &&
      typeof status === 'string' &&
      ['PENDING', 'READY', 'FULFILLED', 'CANCELLED', 'EXPIRED'].includes(status)
    ) {
      where.status = status;
    }
    const list = await prisma.libraryReservation.findMany({
      where,
      include: {
        book: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { reservedAt: 'desc' },
    });
    res.json(list);
  } catch (error: any) {
    console.error('GET /library/reservations:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.post(
  '/library/reservations',
  [body('bookId').notEmpty(), body('userId').notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { bookId, userId } = req.body;
      const book = await prisma.libraryBook.findUnique({ where: { id: bookId } });
      if (!book || !book.isActive) {
        return res.status(404).json({ error: 'Livre introuvable' });
      }
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur introuvable' });
      }
      const dup = await prisma.libraryReservation.findFirst({
        where: {
          bookId,
          userId,
          status: { in: ['PENDING', 'READY'] },
        },
      });
      if (dup) {
        return res.status(400).json({ error: 'Réservation déjà en cours pour ce livre' });
      }
      const resv = await prisma.libraryReservation.create({
        data: {
          bookId,
          userId,
          status: 'PENDING',
        },
        include: {
          book: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      });
      res.status(201).json(resv);
    } catch (error: any) {
      console.error('POST /library/reservations:', error);
      res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
  }
);

router.patch('/library/reservations/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (
      !['PENDING', 'READY', 'FULFILLED', 'CANCELLED', 'EXPIRED'].includes(status)
    ) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    const data: any = { status };
    if (status === 'FULFILLED') {
      data.fulfilledAt = new Date();
    }
    const resv = await prisma.libraryReservation.update({
      where: { id: req.params.id },
      data,
      include: {
        book: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
    res.json(resv);
  } catch (error: any) {
    console.error('PATCH /library/reservations/:id:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.get('/library/penalties', async (req, res) => {
  try {
    const { paid } = req.query;
    const where: any = {};
    if (paid === 'true') {
      where.paid = true;
    } else if (paid === 'false') {
      where.paid = false;
    }
    const list = await prisma.libraryPenalty.findMany({
      where,
      include: {
        loan: { include: { book: true } },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(list);
  } catch (error: any) {
    console.error('GET /library/penalties:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.post(
  '/library/penalties',
  [body('userId').notEmpty(), body('amount').isFloat({ min: 0 }), body('reason').notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { loanId, userId, amount, reason, notes } = req.body;
      const pen = await prisma.libraryPenalty.create({
        data: {
          loanId: loanId || null,
          userId,
          amount: parseFloat(String(amount)),
          reason: String(reason).trim(),
          notes: notes?.trim() || null,
        },
        include: {
          loan: { include: { book: true } },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      });
      res.status(201).json(pen);
    } catch (error: any) {
    console.error('POST /library/penalties:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.patch('/library/penalties/:id', async (req, res) => {
  try {
    const { paid, waived, notes } = req.body;
    const data: any = {};
    if (paid === true) {
      data.paid = true;
      data.paidAt = new Date();
    }
    if (waived === true) {
      data.waived = true;
    }
    if (notes !== undefined) {
      data.notes = notes === null || notes === '' ? null : String(notes).trim();
    }
    const pen = await prisma.libraryPenalty.update({
      where: { id: req.params.id },
      data,
      include: {
        loan: { include: { book: true } },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
    res.json(pen);
  } catch (error: any) {
    console.error('PATCH /library/penalties/:id:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// ========== GESTION MATÉRIELLE ==========

router.get('/material/rooms', async (req, res) => {
  try {
    const { search, isActive } = req.query;
    const rooms = await prisma.materialRoom.findMany({
      where: {
        ...(search &&
          typeof search === 'string' &&
          search.trim() && {
            OR: [
              { name: { contains: search.trim() } },
              { code: { contains: search.trim() } },
              { building: { contains: search.trim() } },
            ],
          }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
      },
      orderBy: { name: 'asc' },
    });
    res.json(rooms);
  } catch (error: any) {
    console.error('GET /material/rooms:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.post('/material/rooms', async (req, res) => {
  try {
    const { name, code, building, floor, capacity, description, isActive } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Le nom de la salle est requis' });
    }
    const room = await prisma.materialRoom.create({
      data: {
        name: name.trim(),
        code: code?.trim() || null,
        building: building?.trim() || null,
        floor: floor?.trim() || null,
        capacity: capacity != null && capacity !== '' ? Number(capacity) : null,
        description: description?.trim() || null,
        isActive: isActive !== false,
      },
    });
    res.status(201).json(room);
  } catch (error: any) {
    console.error('POST /material/rooms:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.put('/material/rooms/:id', async (req, res) => {
  try {
    const existing = await prisma.materialRoom.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Salle introuvable' });
    }
    const { name, code, building, floor, capacity, description, isActive } = req.body;
    const room = await prisma.materialRoom.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(code !== undefined && { code: code ? String(code).trim() : null }),
        ...(building !== undefined && { building: building ? String(building).trim() : null }),
        ...(floor !== undefined && { floor: floor ? String(floor).trim() : null }),
        ...(capacity !== undefined && {
          capacity: capacity != null && capacity !== '' ? Number(capacity) : null,
        }),
        ...(description !== undefined && { description: description ? String(description).trim() : null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });
    res.json(room);
  } catch (error: any) {
    console.error('PUT /material/rooms/:id:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.delete('/material/rooms/:id', async (req, res) => {
  try {
    const existing = await prisma.materialRoom.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Salle introuvable' });
    }
    const [eqCount, maintCount] = await Promise.all([
      prisma.materialEquipment.count({ where: { roomId: req.params.id } }),
      prisma.materialMaintenance.count({ where: { roomId: req.params.id } }),
    ]);
    if (eqCount > 0 || maintCount > 0) {
      await prisma.materialRoom.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      return res.json({ ok: true, deactivated: true });
    }
    await prisma.materialRoom.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error: any) {
    console.error('DELETE /material/rooms/:id:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.get('/material/equipment', async (req, res) => {
  try {
    const { search, category, roomId, isActive } = req.query;
    const list = await prisma.materialEquipment.findMany({
      where: {
        ...(search &&
          typeof search === 'string' &&
          search.trim() && {
            OR: [
              { name: { contains: search.trim() } },
              { serialNumber: { contains: search.trim() } },
            ],
          }),
        ...(category && typeof category === 'string' && category.trim() && { category: category.trim() }),
        ...(roomId && typeof roomId === 'string' && { roomId }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
      },
      include: { room: { select: { id: true, name: true, code: true } } },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    res.json(list);
  } catch (error: any) {
    console.error('GET /material/equipment:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.post('/material/equipment', async (req, res) => {
  try {
    const { roomId, name, category, serialNumber, quantity, condition, notes, purchasedAt, isActive } =
      req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Le nom de l’équipement est requis' });
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: 'La catégorie est requise' });
    }
    if (roomId) {
      const r = await prisma.materialRoom.findUnique({ where: { id: roomId } });
      if (!r) return res.status(400).json({ error: 'Salle de stockage invalide' });
    }
    const eq = await prisma.materialEquipment.create({
      data: {
        roomId: roomId || null,
        name: name.trim(),
        category: category.trim(),
        serialNumber: serialNumber?.trim() || null,
        quantity: Math.max(1, Number(quantity) || 1),
        condition: condition || 'GOOD',
        notes: notes?.trim() || null,
        purchasedAt: purchasedAt ? new Date(purchasedAt) : null,
        isActive: isActive !== false,
      },
      include: { room: { select: { id: true, name: true, code: true } } },
    });
    res.status(201).json(eq);
  } catch (error: any) {
    console.error('POST /material/equipment:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.put('/material/equipment/:id', async (req, res) => {
  try {
    const existing = await prisma.materialEquipment.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Équipement introuvable' });
    }
    const { roomId, name, category, serialNumber, quantity, condition, notes, purchasedAt, isActive } =
      req.body;
    if (roomId) {
      const r = await prisma.materialRoom.findUnique({ where: { id: roomId } });
      if (!r) return res.status(400).json({ error: 'Salle de stockage invalide' });
    }
    const eq = await prisma.materialEquipment.update({
      where: { id: req.params.id },
      data: {
        ...(roomId !== undefined && { roomId: roomId || null }),
        ...(name !== undefined && { name: String(name).trim() }),
        ...(category !== undefined && { category: String(category).trim() }),
        ...(serialNumber !== undefined && { serialNumber: serialNumber ? String(serialNumber).trim() : null }),
        ...(quantity !== undefined && { quantity: Math.max(1, Number(quantity) || 1) }),
        ...(condition !== undefined && { condition }),
        ...(notes !== undefined && { notes: notes ? String(notes).trim() : null }),
        ...(purchasedAt !== undefined && {
          purchasedAt: purchasedAt ? new Date(purchasedAt) : null,
        }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
      include: { room: { select: { id: true, name: true, code: true } } },
    });
    res.json(eq);
  } catch (error: any) {
    console.error('PUT /material/equipment/:id:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.delete('/material/equipment/:id', async (req, res) => {
  try {
    const existing = await prisma.materialEquipment.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Équipement introuvable' });
    }
    const activeAlloc = await prisma.materialAllocation.count({
      where: { equipmentId: req.params.id, status: 'ACTIVE' },
    });
    if (activeAlloc > 0) {
      await prisma.materialEquipment.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      return res.json({ ok: true, deactivated: true });
    }
    await prisma.materialEquipment.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error: any) {
    console.error('DELETE /material/equipment/:id:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.get('/material/maintenance', async (req, res) => {
  try {
    const { status, equipmentId, roomId } = req.query;
    const list = await prisma.materialMaintenance.findMany({
      where: {
        ...(status && typeof status === 'string' && { status: status as any }),
        ...(equipmentId && typeof equipmentId === 'string' && { equipmentId }),
        ...(roomId && typeof roomId === 'string' && { roomId }),
      },
      include: {
        equipment: { select: { id: true, name: true, category: true } },
        room: { select: { id: true, name: true, code: true } },
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { openedAt: 'desc' },
    });
    res.json(list);
  } catch (error: any) {
    console.error('GET /material/maintenance:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.post('/material/maintenance', async (req, res) => {
  try {
    const {
      equipmentId,
      roomId,
      title,
      description,
      status,
      priority,
      costEstimate,
      costActual,
      reportedById,
      assigneeId,
    } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Le titre est requis' });
    }
    if (!equipmentId && !roomId) {
      return res.status(400).json({ error: 'Renseignez un équipement ou une salle' });
    }
    if (equipmentId) {
      const e = await prisma.materialEquipment.findUnique({ where: { id: equipmentId } });
      if (!e) return res.status(400).json({ error: 'Équipement invalide' });
    }
    if (roomId) {
      const r = await prisma.materialRoom.findUnique({ where: { id: roomId } });
      if (!r) return res.status(400).json({ error: 'Salle invalide' });
    }
    if (reportedById) {
      const u = await prisma.user.findUnique({ where: { id: reportedById } });
      if (!u) return res.status(400).json({ error: 'Signaleur invalide' });
    }
    if (assigneeId) {
      const u = await prisma.user.findUnique({ where: { id: assigneeId } });
      if (!u) return res.status(400).json({ error: 'Assigné invalide' });
    }
    const row = await prisma.materialMaintenance.create({
      data: {
        equipmentId: equipmentId || null,
        roomId: roomId || null,
        title: title.trim(),
        description: description?.trim() || null,
        status: status || 'OPEN',
        priority: priority?.trim() || 'normal',
        costEstimate: costEstimate != null ? Number(costEstimate) : null,
        costActual: costActual != null ? Number(costActual) : null,
        reportedById: reportedById || null,
        assigneeId: assigneeId || null,
      },
      include: {
        equipment: { select: { id: true, name: true, category: true } },
        room: { select: { id: true, name: true, code: true } },
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    res.status(201).json(row);
  } catch (error: any) {
    console.error('POST /material/maintenance:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.patch('/material/maintenance/:id', async (req, res) => {
  try {
    const existing = await prisma.materialMaintenance.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Demande introuvable' });
    }
    const {
      title,
      description,
      status,
      priority,
      costEstimate,
      costActual,
      assigneeId,
      closedAt,
    } = req.body;
    if (assigneeId) {
      const u = await prisma.user.findUnique({ where: { id: assigneeId } });
      if (!u) return res.status(400).json({ error: 'Assigné invalide' });
    }
    const nextStatus = status ?? existing.status;
    const row = await prisma.materialMaintenance.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(description !== undefined && { description: description ? String(description).trim() : null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority: String(priority).trim() }),
        ...(costEstimate !== undefined && {
          costEstimate: costEstimate != null ? Number(costEstimate) : null,
        }),
        ...(costActual !== undefined && { costActual: costActual != null ? Number(costActual) : null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(closedAt !== undefined && { closedAt: closedAt ? new Date(closedAt) : null }),
        ...((nextStatus === 'RESOLVED' || nextStatus === 'CANCELLED') &&
          !existing.closedAt && { closedAt: new Date() }),
      },
      include: {
        equipment: { select: { id: true, name: true, category: true } },
        room: { select: { id: true, name: true, code: true } },
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    res.json(row);
  } catch (error: any) {
    console.error('PATCH /material/maintenance/:id:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.get('/material/allocations', async (req, res) => {
  try {
    const { status, equipmentId } = req.query;
    const list = await prisma.materialAllocation.findMany({
      where: {
        ...(status && typeof status === 'string' && { status: status as any }),
        ...(equipmentId && typeof equipmentId === 'string' && { equipmentId }),
      },
      include: {
        equipment: { select: { id: true, name: true, category: true, quantity: true } },
      },
      orderBy: { startDate: 'desc' },
    });
    res.json(list);
  } catch (error: any) {
    console.error('GET /material/allocations:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.post('/material/allocations', async (req, res) => {
  try {
    const { equipmentId, targetType, targetId, quantity, startDate, endDate, purpose, notes } = req.body;
    if (!equipmentId || !targetType || !targetId) {
      return res.status(400).json({ error: 'Équipement, type de cible et identifiant cible sont requis' });
    }
    const eq = await prisma.materialEquipment.findUnique({ where: { id: equipmentId } });
    if (!eq) return res.status(400).json({ error: 'Équipement invalide' });
    const qty = Math.max(1, Number(quantity) || 1);
    if (qty > eq.quantity) {
      return res.status(400).json({ error: 'Quantité supérieure au stock déclaré' });
    }
    if (targetType === 'USER') {
      const u = await prisma.user.findUnique({ where: { id: targetId } });
      if (!u) return res.status(400).json({ error: 'Utilisateur cible invalide' });
    } else if (targetType === 'CLASS') {
      const c = await prisma.class.findUnique({ where: { id: targetId } });
      if (!c) return res.status(400).json({ error: 'Classe cible invalide' });
    } else if (targetType === 'ROOM') {
      const r = await prisma.materialRoom.findUnique({ where: { id: targetId } });
      if (!r) return res.status(400).json({ error: 'Salle cible invalide' });
    } else {
      return res.status(400).json({ error: 'Type de cible invalide' });
    }
    const activeSum = await prisma.materialAllocation.aggregate({
      where: { equipmentId, status: 'ACTIVE' },
      _sum: { quantity: true },
    });
    const used = activeSum._sum.quantity ?? 0;
    if (used + qty > eq.quantity) {
      return res.status(400).json({
        error: `Stock insuffisant (${used} déjà alloué(s) sur ${eq.quantity})`,
      });
    }
    const row = await prisma.materialAllocation.create({
      data: {
        equipmentId,
        targetType,
        targetId: String(targetId),
        quantity: qty,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        purpose: purpose?.trim() || null,
        notes: notes?.trim() || null,
        status: 'ACTIVE',
      },
      include: {
        equipment: { select: { id: true, name: true, category: true, quantity: true } },
      },
    });
    res.status(201).json(row);
  } catch (error: any) {
    console.error('POST /material/allocations:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.patch('/material/allocations/:id', async (req, res) => {
  try {
    const existing = await prisma.materialAllocation.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Allocation introuvable' });
    }
    const { status, endDate, notes } = req.body;
    const row = await prisma.materialAllocation.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(notes !== undefined && { notes: notes ? String(notes).trim() : null }),
        ...(status === 'RETURNED' && { endDate: new Date() }),
      },
      include: {
        equipment: { select: { id: true, name: true, category: true, quantity: true } },
      },
    });
    res.json(row);
  } catch (error: any) {
    console.error('PATCH /material/allocations/:id:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// ========== RAPPORTS & STATISTIQUES (agrégats) ==========

router.get('/reports/summary', async (_req, res) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      studentsTotal,
      studentsActive,
      teachersTotal,
      educatorsTotal,
      classesTotal,
      coursesTotal,
      assignmentsPublished,
      studentAssignmentStats,
      admissionPending,
      admissionUnderReview,
      admissionAccepted,
      admissionRejected,
      admissionWaitlist,
      admissionEnrolled,
      admissionTotal,
      admissionByYear,
      paymentGroup,
      tuitionUnpaid,
      absenceTotals,
      allStudents,
      paymentsRecent,
      usersTotal,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({
        where: { isActive: true, enrollmentStatus: 'ACTIVE' },
      }),
      prisma.teacher.count(),
      prisma.educator.count(),
      prisma.class.count(),
      prisma.course.count(),
      prisma.assignment.count(),
      prisma.studentAssignment
        .findMany({ select: { submitted: true } })
        .then((rows) => ({
          total: rows.length,
          submitted: rows.filter((r) => r.submitted).length,
        })),
      prisma.admission.count({ where: { status: 'PENDING' } }),
      prisma.admission.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.admission.count({ where: { status: 'ACCEPTED' } }),
      prisma.admission.count({ where: { status: 'REJECTED' } }),
      prisma.admission.count({ where: { status: 'WAITLIST' } }),
      prisma.admission.count({ where: { status: 'ENROLLED' } }),
      prisma.admission.count(),
      prisma.admission.groupBy({
        by: ['academicYear'],
        _count: true,
        orderBy: { academicYear: 'desc' },
        take: 12,
      }),
      prisma.payment.groupBy({
        by: ['status'],
        _sum: { amount: true },
        _count: true,
      }),
      prisma.tuitionFee.aggregate({
        where: { isPaid: false },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.absence
        .findMany({ select: { excused: true } })
        .then((rows) => ({
          total: rows.length,
          excused: rows.filter((a) => a.excused).length,
        })),
      prisma.student.findMany({
        include: {
          grades: { select: { score: true, maxScore: true, coefficient: true } },
          absences: { select: { excused: true } },
          class: { select: { id: true, name: true } },
        },
      }),
      prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
          paidAt: { gte: sixMonthsAgo },
        },
        select: { amount: true, paidAt: true },
      }),
      prisma.user.count(),
    ]);

    const gradesList = allStudents.flatMap((s) => s.grades);
    let gradeAverage: number | null = null;
    if (gradesList.length > 0) {
      let num = 0;
      let den = 0;
      for (const g of gradesList) {
        const max = g.maxScore > 0 ? g.maxScore : 20;
        const normalized = (g.score / max) * 20;
        num += normalized * g.coefficient;
        den += g.coefficient;
      }
      gradeAverage = den > 0 ? Math.round((num / den) * 100) / 100 : null;
    }

    const byClassMap = new Map<
      string,
      { classId: string; className: string; sum: number; coef: number; gradeCount: number }
    >();
    for (const s of allStudents) {
      if (!s.classId || !s.class) continue;
      const key = s.classId;
      if (!byClassMap.has(key)) {
        byClassMap.set(key, {
          classId: key,
          className: s.class.name,
          sum: 0,
          coef: 0,
          gradeCount: 0,
        });
      }
      const bucket = byClassMap.get(key)!;
      for (const g of s.grades) {
        const max = g.maxScore > 0 ? g.maxScore : 20;
        const normalized = (g.score / max) * 20;
        bucket.sum += normalized * g.coefficient;
        bucket.coef += g.coefficient;
        bucket.gradeCount += 1;
      }
    }
    const averagesByClass = [...byClassMap.values()]
      .map((b) => ({
        classId: b.classId,
        className: b.className,
        average:
          b.coef > 0 ? Math.round((b.sum / b.coef) * 100) / 100 : null,
        gradeCount: b.gradeCount,
      }))
      .filter((x) => x.gradeCount > 0)
      .sort((a, b) => (b.average ?? 0) - (a.average ?? 0))
      .slice(0, 12);

    let atRiskHigh = 0;
    let atRiskMedium = 0;
    for (const student of allStudents) {
      const grades = student.grades || [];
      const totalScore = grades.reduce(
        (sum, g) => sum + (g.maxScore > 0 ? g.score / g.maxScore : 0) * 20 * g.coefficient,
        0
      );
      const totalCoefficient = grades.reduce((sum, g) => sum + g.coefficient, 0);
      const average = totalCoefficient > 0 ? totalScore / totalCoefficient : 0;
      const unexcusedAbsences = student.absences?.filter((a) => !a.excused).length || 0;
      const riskLevel =
        average < 10 || unexcusedAbsences > 5
          ? 'high'
          : average < 12
            ? 'medium'
            : 'low';
      if (riskLevel === 'high') atRiskHigh += 1;
      else if (riskLevel === 'medium') atRiskMedium += 1;
    }

    const paymentsByMonth: { month: string; label: string; amount: number }[] = [];
    const monthKeys = new Map<string, number>();
    for (const p of paymentsRecent) {
      if (!p.paidAt) continue;
      const d = new Date(p.paidAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthKeys.set(key, (monthKeys.get(key) ?? 0) + p.amount);
    }
    for (const [month, amount] of [...monthKeys.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      const [y, m] = month.split('-');
      const label = `${m}/${y}`;
      paymentsByMonth.push({ month, label, amount: Math.round(amount * 100) / 100 });
    }

    const gbCount = (row: { _count: number | { _all?: number } }) =>
      typeof row._count === 'number' ? row._count : row._count?._all ?? 0;

    const paymentTotals = {
      completedAmount: 0,
      pendingAmount: 0,
      failedAmount: 0,
      otherAmount: 0,
      byStatus: paymentGroup.map((p) => ({
        status: p.status,
        count: gbCount(p),
        sum: p._sum.amount ?? 0,
      })),
    };
    for (const p of paymentGroup) {
      const sum = p._sum.amount ?? 0;
      if (p.status === 'COMPLETED') paymentTotals.completedAmount += sum;
      else if (p.status === 'PENDING') paymentTotals.pendingAmount += sum;
      else if (p.status === 'FAILED') paymentTotals.failedAmount += sum;
      else paymentTotals.otherAmount += sum;
    }

    res.json({
      generatedAt: now.toISOString(),
      dashboard: {
        studentsTotal,
        studentsActive,
        teachersTotal,
        educatorsTotal,
        classesTotal,
        coursesTotal,
        assignmentsPublished,
        usersTotal,
      },
      financial: {
        paymentTotals,
        tuitionOutstandingAmount: tuitionUnpaid._sum.amount ?? 0,
        tuitionOutstandingCount: tuitionUnpaid._count,
        paymentsByMonth,
      },
      academic: {
        gradesCount: gradesList.length,
        gradeAverage,
        assignmentsPublished,
        studentAssignmentStats,
        absenceTotals,
        averagesByClass,
      },
      admissions: {
        pending: admissionPending,
        underReview: admissionUnderReview,
        accepted: admissionAccepted,
        rejected: admissionRejected,
        waitlist: admissionWaitlist,
        enrolled: admissionEnrolled,
        total: admissionTotal,
        byAcademicYear: admissionByYear.map((a) => ({
          academicYear: a.academicYear,
          count: gbCount(a),
        })),
      },
      performance: {
        atRiskHigh,
        atRiskMedium,
        atRiskTotal: atRiskHigh + atRiskMedium,
        submissionRate:
          studentAssignmentStats.total > 0
            ? Math.round(
                (studentAssignmentStats.submitted / studentAssignmentStats.total) * 1000
              ) / 10
            : null,
        absenceExcusedRate:
          absenceTotals.total > 0
            ? Math.round((absenceTotals.excused / absenceTotals.total) * 1000) / 10
            : null,
      },
    });
  } catch (error: any) {
    console.error('GET /reports/summary:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

export default router;

