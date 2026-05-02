import express from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate);
router.use(authorize('PARENT'));

// Obtenir les enfants du parent
router.get('/children', async (req: AuthRequest, res) => {
  try {
    const parent = await prisma.parent.findFirst({
      where: {
        userId: req.user!.id,
      },
      include: {
        students: {
          include: {
            student: {
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
            },
          },
        },
      },
    });

    if (!parent) {
      return res.status(404).json({ error: 'Parent non trouvé' });
    }

    const children = parent.students.map((sp) => ({
      ...sp.student,
      relation: sp.relation,
    }));

    res.json(children);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les notes d'un enfant
router.get('/children/:studentId/grades', async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.params;

    // Vérifier que l'élève est bien un enfant du parent
    const parent = await prisma.parent.findFirst({
      where: {
        userId: req.user!.id,
      },
      include: {
        students: {
          where: {
            studentId,
          },
        },
      },
    });

    if (!parent || parent.students.length === 0) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const grades = await prisma.grade.findMany({
      where: {
        studentId,
      },
      include: {
        course: {
          include: {
            class: true,
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

    // Calculer les moyennes par cours
    const courseAverages: Record<string, { total: number; count: number; average: number }> = {};

    grades.forEach((grade) => {
      const courseId = grade.courseId;
      if (!courseAverages[courseId]) {
        courseAverages[courseId] = { total: 0, count: 0, average: 0 };
      }
      courseAverages[courseId].total += (grade.score / grade.maxScore) * 20 * grade.coefficient;
      courseAverages[courseId].count += grade.coefficient;
    });

    Object.keys(courseAverages).forEach((courseId) => {
      const course = courseAverages[courseId];
      course.average = course.count > 0 ? course.total / course.count : 0;
    });

    res.json({
      grades,
      courseAverages,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les absences d'un enfant
router.get('/children/:studentId/absences', async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.params;

    // Vérifier que l'élève est bien un enfant du parent
    const parent = await prisma.parent.findFirst({
      where: {
        userId: req.user!.id,
      },
      include: {
        students: {
          where: {
            studentId,
          },
        },
      },
    });

    if (!parent || parent.students.length === 0) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const absences = await prisma.absence.findMany({
      where: {
        studentId,
      },
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
    });

    res.json(absences);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir l'emploi du temps d'un enfant
router.get('/children/:studentId/schedule', async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.params;

    // Vérifier que l'élève est bien un enfant du parent
    const parent = await prisma.parent.findFirst({
      where: {
        userId: req.user!.id,
      },
      include: {
        students: {
          where: {
            studentId,
          },
        },
      },
    });

    if (!parent || parent.students.length === 0) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
      },
    });

    if (!student || !student.classId) {
      return res.status(404).json({ error: 'Classe non trouvée' });
    }

    const schedule = await prisma.schedule.findMany({
      where: {
        classId: student.classId,
      },
      include: {
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
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    res.json(schedule);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les devoirs d'un enfant
router.get('/children/:studentId/assignments', async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.params;

    // Vérifier que l'élève est bien un enfant du parent
    const parent = await prisma.parent.findFirst({
      where: {
        userId: req.user!.id,
      },
      include: {
        students: {
          where: {
            studentId,
          },
        },
      },
    });

    if (!parent || parent.students.length === 0) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const assignments = await prisma.studentAssignment.findMany({
      where: {
        studentId,
      },
      include: {
        assignment: {
          include: {
            course: {
              include: {
                class: true,
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
        },
      },
      orderBy: {
        assignment: {
          dueDate: 'desc',
        },
      },
    });

    res.json(assignments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== GESTION DES PAIEMENTS ==========

// Obtenir les frais de scolarité d'un enfant
router.get('/children/:studentId/tuition-fees', async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.params;

    // Vérifier que l'élève est bien un enfant du parent
    const parent = await prisma.parent.findFirst({
      where: {
        userId: req.user!.id,
      },
      include: {
        students: {
          where: {
            studentId,
          },
        },
      },
    });

    if (!parent || parent.students.length === 0) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const tuitionFees = await prisma.tuitionFee.findMany({
      where: {
        studentId,
      },
      include: {
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

    // Calculer le montant payé et restant pour chaque frais
    const feesWithPaymentInfo = tuitionFees.map((fee) => {
      const completedPayments = fee.payments.filter((p: any) => p.status === 'COMPLETED');
      const totalPaid = completedPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
      const remainingAmount = fee.amount - totalPaid;
      
      return {
        ...fee,
        totalPaid,
        remainingAmount: Math.max(0, remainingAmount),
        paymentProgress: fee.amount > 0 ? (totalPaid / fee.amount) * 100 : 0,
      };
    });

    res.json(feesWithPaymentInfo);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des frais de scolarité:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Créer un paiement pour un enfant
router.post('/children/:studentId/payments', async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.params;
    const { tuitionFeeId, paymentMethod, amount, phoneNumber, operator, transactionCode } = req.body;

    if (!tuitionFeeId || !paymentMethod || !amount) {
      return res.status(400).json({ error: 'tuitionFeeId, paymentMethod et amount sont requis' });
    }

    // Validation spécifique pour Mobile Money
    if (paymentMethod === 'MOBILE_MONEY') {
      if (!phoneNumber) {
        return res.status(400).json({ error: 'Le numéro de téléphone est requis pour Mobile Money' });
      }
      // Valider le format du numéro (ex: +237 6XX XXX XXX ou 6XX XXX XXX)
      const phoneRegex = /^(\+237\s?)?[67]\d{8}$/;
      const cleanPhone = phoneNumber.replace(/\s/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({ error: 'Format de numéro de téléphone invalide. Utilisez le format: +237 6XX XXX XXX ou 6XX XXX XXX' });
      }
    }

    // Vérifier que l'élève est bien un enfant du parent
    const parent = await prisma.parent.findFirst({
      where: {
        userId: req.user!.id,
      },
      include: {
        students: {
          where: {
            studentId,
          },
        },
      },
    });

    if (!parent || parent.students.length === 0) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier que le frais appartient à l'élève
    const tuitionFee = await prisma.tuitionFee.findFirst({
      where: {
        id: tuitionFeeId,
        studentId,
      },
    });

    if (!tuitionFee) {
      return res.status(404).json({ error: 'Frais de scolarité non trouvé' });
    }

    // Calculer le montant total payé pour ce frais
    const completedPayments = await prisma.payment.findMany({
      where: {
        tuitionFeeId,
        status: 'COMPLETED',
      },
    });
    const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = tuitionFee.amount - totalPaid;

    if (remainingAmount <= 0) {
      return res.status(400).json({ error: 'Ce frais a déjà été entièrement payé' });
    }

    // Valider que le montant du paiement ne dépasse pas le montant restant
    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) {
      return res.status(400).json({ error: 'Le montant doit être supérieur à 0' });
    }
    if (paymentAmount > remainingAmount) {
      return res.status(400).json({ 
        error: `Le montant ne peut pas dépasser le montant restant (${remainingAmount.toFixed(0)} FCFA)` 
      });
    }

    // Générer une référence de paiement unique
    const paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Préparer les notes pour Mobile Money
    let paymentNotes = '';
    if (paymentMethod === 'MOBILE_MONEY') {
      paymentNotes = `Mobile Money - Téléphone: ${phoneNumber}${operator ? `, Opérateur: ${operator}` : ''}${transactionCode ? `, Code: ${transactionCode}` : ''}`;
    }

    // Créer le paiement
    const payment = await prisma.payment.create({
      data: {
        tuitionFeeId,
        studentId,
        payerId: req.user!.id,
        payerRole: 'PARENT',
        amount: paymentAmount,
        paymentMethod,
        status: 'PENDING',
        paymentReference,
        notes: paymentNotes || undefined,
      },
      include: {
        tuitionFee: true,
        student: {
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

    res.status(201).json({
      payment,
      paymentUrl: `/payment/process/${payment.id}`,
      message: 'Paiement initié avec succès',
    });
  } catch (error: any) {
    console.error('Erreur lors de la création du paiement:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Confirmer un paiement
router.post('/children/:studentId/payments/:id/confirm', async (req: AuthRequest, res) => {
  try {
    const { studentId, id } = req.params;
    const { transactionId } = req.body;

    // Vérifier que l'élève est bien un enfant du parent
    const parent = await prisma.parent.findFirst({
      where: {
        userId: req.user!.id,
      },
      include: {
        students: {
          where: {
            studentId,
          },
        },
      },
    });

    if (!parent || parent.students.length === 0) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        studentId,
        payerId: req.user!.id,
      },
      include: {
        tuitionFee: true,
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Paiement non trouvé ou non autorisé' });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({ error: 'Ce paiement ne peut plus être modifié' });
    }

    // Mettre à jour le paiement comme complété
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        transactionId: transactionId || `TXN-${Date.now()}`,
        paidAt: new Date(),
      },
    });

    // Calculer le montant total payé pour ce frais
    const completedPayments = await prisma.payment.findMany({
      where: {
        tuitionFeeId: payment.tuitionFeeId,
        status: 'COMPLETED',
      },
    });
    const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const isFullyPaid = totalPaid >= payment.tuitionFee.amount;

    // Mettre à jour le frais de scolarité
    await prisma.tuitionFee.update({
      where: { id: payment.tuitionFeeId },
      data: {
        isPaid: isFullyPaid,
        paidAt: isFullyPaid ? new Date() : null,
      },
    });

    res.json({
      payment: updatedPayment,
      message: 'Paiement confirmé avec succès',
    });
  } catch (error: any) {
    console.error('Erreur lors de la confirmation du paiement:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Obtenir l'historique des paiements pour un enfant
router.get('/children/:studentId/payments', async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.params;

    // Vérifier que l'élève est bien un enfant du parent
    const parent = await prisma.parent.findFirst({
      where: {
        userId: req.user!.id,
      },
      include: {
        students: {
          where: {
            studentId,
          },
        },
      },
    });

    if (!parent || parent.students.length === 0) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const payments = await prisma.payment.findMany({
      where: {
        studentId,
        payerId: req.user!.id,
      },
      include: {
        tuitionFee: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    email: true,
                  },
                },
              },
            },
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

// ========== BULLETINS ==========

// Obtenir les bulletins d'un enfant
router.get('/children/:studentId/report-cards', async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.params;

    // Vérifier que l'élève est bien un enfant du parent
    const parent = await prisma.parent.findFirst({
      where: {
        userId: req.user!.id,
      },
      include: {
        students: {
          where: {
            studentId,
          },
        },
      },
    });

    if (!parent || parent.students.length === 0) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const reportCards = await prisma.reportCard.findMany({
      where: {
        studentId,
      },
      orderBy: [
        { academicYear: 'desc' },
        { period: 'asc' },
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

// ========== CONDUITE ==========

// Obtenir les évaluations de conduite d'un enfant
router.get('/children/:studentId/conduct', async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.params;
    const { period, academicYear } = req.query;

    // Vérifier que l'élève est bien un enfant du parent
    const parent = await prisma.parent.findFirst({
      where: {
        userId: req.user!.id,
      },
      include: {
        students: {
          where: {
            studentId,
          },
        },
      },
    });

    if (!parent || parent.students.length === 0) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const conducts = await prisma.conduct.findMany({
      where: {
        studentId,
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
      orderBy: [
        { academicYear: 'desc' },
        { period: 'asc' },
      ],
    });

    res.json(conducts);
  } catch (error: any) {
    console.error('Erreur lors de la récupération de la conduite:', error);
    res.status(500).json({ 
      error: error.message || 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ========== COMMUNICATION (messages avec l’école) ==========

router.get('/messages', async (req: AuthRequest, res) => {
  try {
    const { unread } = req.query;

    const receivedWhere: { receiverId: string; read?: boolean } = {
      receiverId: req.user!.id,
    };
    if (unread === 'true') {
      receivedWhere.read = false;
    }

    const [received, sent] = await Promise.all([
      prisma.message.findMany({
        where: receivedWhere,
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
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.message.findMany({
        where: { senderId: req.user!.id },
        include: {
          receiver: {
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
        take: 100,
      }),
    ]);

    res.json({ received, sent });
  } catch (error: any) {
    console.error('GET /parent/messages:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.post('/messages', async (req: AuthRequest, res) => {
  try {
    const { subject, content, category, studentId } = req.body;
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Le contenu du message est requis' });
    }

    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN', isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!admin) {
      return res.status(503).json({
        error: 'Aucun administrateur n’est disponible pour recevoir le message pour le moment.',
      });
    }

    let body = content.trim();
    if (studentId && typeof studentId === 'string') {
      const parent = await prisma.parent.findFirst({
        where: {
          userId: req.user!.id,
          students: { some: { studentId } },
        },
      });
      if (!parent) {
        return res.status(403).json({ error: 'Cet élève n’est pas associé à votre compte' });
      }
      const st = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: { select: { firstName: true, lastName: true } } },
      });
      if (st?.user) {
        body += `\n\n---\nConcernant l’élève : ${st.user.firstName} ${st.user.lastName}`;
      }
    }

    const validCategories = [
      'GENERAL',
      'ACADEMIC',
      'ABSENCE',
      'PAYMENT',
      'CONDUCT',
      'URGENT',
      'ANNOUNCEMENT',
    ] as const;
    const cat =
      category && validCategories.includes(category) ? category : 'GENERAL';

    const message = await prisma.message.create({
      data: {
        senderId: req.user!.id,
        receiverId: admin.id,
        subject: subject && String(subject).trim() ? String(subject).trim() : null,
        content: body,
        category: cat,
        channels: ['PLATFORM'],
      },
      include: {
        receiver: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        sender: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    res.status(201).json(message);
  } catch (error: any) {
    console.error('POST /parent/messages:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.put('/messages/:id/read', async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.message.findFirst({
      where: {
        id: req.params.id,
        receiverId: req.user!.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Message introuvable' });
    }

    const message = await prisma.message.update({
      where: { id: existing.id },
      data: { read: true, readAt: new Date() },
    });

    res.json(message);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;




