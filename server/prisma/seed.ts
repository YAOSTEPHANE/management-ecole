import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed de la base de données...');

  // Nettoyer la base de données
  console.log('🧹 Nettoyage de la base de données...');
  await prisma.studentAssignment.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.absence.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.tuitionFee.deleteMany();
  await prisma.tuitionPaymentScheduleTemplate.deleteMany();
  await prisma.tuitionFeeCatalog.deleteMany();
  await prisma.conduct.deleteMany();
  await prisma.reportCard.deleteMany();
  await prisma.course.deleteMany();
  await prisma.parentTeacherAppointment.deleteMany();
  await prisma.studentPickupAuthorization.deleteMany();
  await prisma.parentConsent.deleteMany();
  await prisma.parentInteraction.deleteMany();
  await prisma.parentContact.deleteMany();
  await prisma.studentParent.deleteMany();
  await prisma.student.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.educator.deleteMany();
  await prisma.staffAttendance.deleteMany();
  await prisma.staffMember.deleteMany();
  await prisma.jobDescription.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Créer des utilisateurs ADMIN
  console.log('👤 Création des administrateurs...');
  const admin1 = await prisma.user.create({
    data: {
      email: 'admin@school.com',
      password: hashedPassword,
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'ADMIN',
      phone: '+33 6 12 34 56 78',
      isActive: true,
    },
  });

  // Créer des enseignants
  console.log('👨‍🏫 Création des enseignants...');
  const teacher1 = await prisma.user.create({
    data: {
      email: 'teacher1@school.com',
      password: hashedPassword,
      firstName: 'Marie',
      lastName: 'Martin',
      role: 'TEACHER',
      phone: '+33 6 11 22 33 44',
      isActive: true,
      teacherProfile: {
        create: {
          employeeId: 'EMP001',
          specialization: 'Mathématiques',
          hireDate: new Date('2020-09-01'),
          contractType: 'CDI',
          salary: 3500,
        },
      },
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      email: 'teacher2@school.com',
      password: hashedPassword,
      firstName: 'Pierre',
      lastName: 'Durand',
      role: 'TEACHER',
      phone: '+33 6 22 33 44 55',
      isActive: true,
      teacherProfile: {
        create: {
          employeeId: 'EMP002',
          specialization: 'Français',
          hireDate: new Date('2019-09-01'),
          contractType: 'CDI',
          salary: 3400,
        },
      },
    },
  });

  const teacher3 = await prisma.user.create({
    data: {
      email: 'teacher3@school.com',
      password: hashedPassword,
      firstName: 'Sophie',
      lastName: 'Bernard',
      role: 'TEACHER',
      phone: '+33 6 33 44 55 66',
      isActive: true,
      teacherProfile: {
        create: {
          employeeId: 'EMP003',
          specialization: 'Histoire-Géographie',
          hireDate: new Date('2021-09-01'),
          contractType: 'CDI',
          salary: 3300,
        },
      },
    },
  });

  const teacher1Profile = await prisma.teacher.findUnique({
    where: { userId: teacher1.id },
  });
  const teacher2Profile = await prisma.teacher.findUnique({
    where: { userId: teacher2.id },
  });
  const teacher3Profile = await prisma.teacher.findUnique({
    where: { userId: teacher3.id },
  });

  // Créer des classes
  console.log('📚 Création des classes...');
  const class1 = await prisma.class.create({
    data: {
      name: '6ème A',
      level: '6ème',
      room: 'Salle 101',
      capacity: 30,
      academicYear: '2024-2025',
      teacherId: teacher1Profile!.id,
    },
  });

  const class2 = await prisma.class.create({
    data: {
      name: '5ème B',
      level: '5ème',
      room: 'Salle 102',
      capacity: 28,
      academicYear: '2024-2025',
      teacherId: teacher2Profile!.id,
    },
  });

  // Créer des cours
  console.log('📖 Création des cours...');
  const course1 = await prisma.course.create({
    data: {
      name: 'Mathématiques',
      code: 'MATH-6A',
      description: 'Cours de mathématiques niveau 6ème',
      classId: class1.id,
      teacherId: teacher1Profile!.id,
    },
  });

  const course2 = await prisma.course.create({
    data: {
      name: 'Français',
      code: 'FR-6A',
      description: 'Cours de français niveau 6ème',
      classId: class1.id,
      teacherId: teacher2Profile!.id,
    },
  });

  const course3 = await prisma.course.create({
    data: {
      name: 'Histoire-Géographie',
      code: 'HG-6A',
      description: 'Cours d\'histoire-géographie niveau 6ème',
      classId: class1.id,
      teacherId: teacher3Profile!.id,
    },
  });

  const course4 = await prisma.course.create({
    data: {
      name: 'Mathématiques',
      code: 'MATH-5B',
      description: 'Cours de mathématiques niveau 5ème',
      classId: class2.id,
      teacherId: teacher1Profile!.id,
    },
  });

  const course5 = await prisma.course.create({
    data: {
      name: 'Français',
      code: 'FR-5B',
      description: 'Cours de français niveau 5ème',
      classId: class2.id,
      teacherId: teacher2Profile!.id,
    },
  });

  // Créer des élèves
  console.log('👨‍🎓 Création des élèves...');
  const student1 = await prisma.user.create({
    data: {
      email: 'student1@school.com',
      password: hashedPassword,
      firstName: 'Lucas',
      lastName: 'Moreau',
      role: 'STUDENT',
      phone: '+33 6 44 55 66 77',
      isActive: true,
      studentProfile: {
        create: {
          studentId: 'STU001',
          dateOfBirth: new Date('2012-05-15'),
          gender: 'MALE',
          address: '123 Rue de la République, 75001 Paris',
          emergencyContact: 'Mme Moreau',
          emergencyPhone: '+33 6 55 66 77 88',
          medicalInfo: 'Aucune allergie connue',
          enrollmentDate: new Date('2024-09-01'),
          classId: class1.id,
        },
      },
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'student2@school.com',
      password: hashedPassword,
      firstName: 'Emma',
      lastName: 'Lefebvre',
      role: 'STUDENT',
      phone: '+33 6 55 66 77 88',
      isActive: true,
      studentProfile: {
        create: {
          studentId: 'STU002',
          dateOfBirth: new Date('2012-08-20'),
          gender: 'FEMALE',
          address: '456 Avenue des Champs, 75008 Paris',
          emergencyContact: 'M. Lefebvre',
          emergencyPhone: '+33 6 66 77 88 99',
          medicalInfo: 'Asthme léger',
          enrollmentDate: new Date('2024-09-01'),
          classId: class1.id,
        },
      },
    },
  });

  const student3 = await prisma.user.create({
    data: {
      email: 'student3@school.com',
      password: hashedPassword,
      firstName: 'Thomas',
      lastName: 'Garcia',
      role: 'STUDENT',
      phone: '+33 6 66 77 88 99',
      isActive: true,
      studentProfile: {
        create: {
          studentId: 'STU003',
          dateOfBirth: new Date('2012-03-10'),
          gender: 'MALE',
          address: '789 Boulevard Saint-Germain, 75006 Paris',
          emergencyContact: 'Mme Garcia',
          emergencyPhone: '+33 6 77 88 99 00',
          medicalInfo: 'Aucune',
          enrollmentDate: new Date('2024-09-01'),
          classId: class1.id,
        },
      },
    },
  });

  const student4 = await prisma.user.create({
    data: {
      email: 'student4@school.com',
      password: hashedPassword,
      firstName: 'Chloé',
      lastName: 'Roux',
      role: 'STUDENT',
      phone: '+33 6 10 20 30 40',
      isActive: true,
      studentProfile: {
        create: {
          studentId: 'STU004',
          dateOfBirth: new Date('2011-11-22'),
          gender: 'FEMALE',
          address: '12 rue des Écoles, Paris',
          emergencyContact: 'M. Roux',
          emergencyPhone: '+33 6 20 30 40 50',
          medicalInfo: 'Aucune',
          enrollmentDate: new Date('2024-09-01'),
          classId: class2.id,
        },
      },
    },
  });

  const student5 = await prisma.user.create({
    data: {
      email: 'student5@school.com',
      password: hashedPassword,
      firstName: 'Hugo',
      lastName: 'Blanc',
      role: 'STUDENT',
      phone: '+33 6 11 21 31 41',
      isActive: true,
      studentProfile: {
        create: {
          studentId: 'STU005',
          dateOfBirth: new Date('2011-04-18'),
          gender: 'MALE',
          address: '8 avenue Voltaire, Paris',
          emergencyContact: 'Mme Blanc',
          emergencyPhone: '+33 6 21 31 41 51',
          medicalInfo: 'Aucune',
          enrollmentDate: new Date('2024-09-01'),
          classId: class2.id,
        },
      },
    },
  });

  const student6 = await prisma.user.create({
    data: {
      email: 'student6@school.com',
      password: hashedPassword,
      firstName: 'Léa',
      lastName: 'Noir',
      role: 'STUDENT',
      phone: '+33 6 12 22 32 42',
      isActive: true,
      studentProfile: {
        create: {
          studentId: 'STU006',
          dateOfBirth: new Date('2011-07-30'),
          gender: 'FEMALE',
          address: '5 place d’Italie, Paris',
          emergencyContact: 'M. Noir',
          emergencyPhone: '+33 6 22 32 42 52',
          medicalInfo: 'Aucune',
          enrollmentDate: new Date('2024-09-01'),
          classId: class2.id,
        },
      },
    },
  });

  const student7 = await prisma.user.create({
    data: {
      email: 'student7@school.com',
      password: hashedPassword,
      firstName: 'Nathan',
      lastName: 'Klein',
      role: 'STUDENT',
      phone: '+33 6 13 23 33 43',
      isActive: true,
      studentProfile: {
        create: {
          studentId: 'STU007',
          dateOfBirth: new Date('2012-01-25'),
          gender: 'MALE',
          address: '22 rue Monge, Paris',
          emergencyContact: 'Mme Klein',
          emergencyPhone: '+33 6 23 33 43 53',
          medicalInfo: 'Aucune',
          enrollmentDate: new Date('2024-09-01'),
          classId: class1.id,
        },
      },
    },
  });

  const student8 = await prisma.user.create({
    data: {
      email: 'student8@school.com',
      password: hashedPassword,
      firstName: 'Inès',
      lastName: 'Benali',
      role: 'STUDENT',
      phone: '+33 6 14 24 34 44',
      isActive: true,
      studentProfile: {
        create: {
          studentId: 'STU008',
          dateOfBirth: new Date('2012-09-12'),
          gender: 'FEMALE',
          address: '9 boulevard de Belleville, Paris',
          emergencyContact: 'M. Benali',
          emergencyPhone: '+33 6 24 34 44 54',
          medicalInfo: 'Aucune',
          enrollmentDate: new Date('2024-09-01'),
          classId: class1.id,
        },
      },
    },
  });

  const student9 = await prisma.user.create({
    data: {
      email: 'student9@school.com',
      password: hashedPassword,
      firstName: 'Max',
      lastName: 'Perrot',
      role: 'STUDENT',
      phone: '+33 6 15 25 35 45',
      isActive: true,
      studentProfile: {
        create: {
          studentId: 'STU009',
          dateOfBirth: new Date('2011-12-05'),
          gender: 'MALE',
          address: '3 rue de la Grange, Paris',
          emergencyContact: 'Mme Perrot',
          emergencyPhone: '+33 6 25 35 45 55',
          medicalInfo: 'Aucune',
          enrollmentDate: new Date('2024-09-01'),
          classId: class2.id,
        },
      },
    },
  });

  const student1Profile = await prisma.student.findUnique({
    where: { userId: student1.id },
  });
  const student2Profile = await prisma.student.findUnique({
    where: { userId: student2.id },
  });
  const student3Profile = await prisma.student.findUnique({
    where: { userId: student3.id },
  });
  const student4Profile = await prisma.student.findUnique({
    where: { userId: student4.id },
  });
  const student5Profile = await prisma.student.findUnique({
    where: { userId: student5.id },
  });
  const student6Profile = await prisma.student.findUnique({
    where: { userId: student6.id },
  });
  const student7Profile = await prisma.student.findUnique({
    where: { userId: student7.id },
  });
  const student8Profile = await prisma.student.findUnique({
    where: { userId: student8.id },
  });
  const student9Profile = await prisma.student.findUnique({
    where: { userId: student9.id },
  });

  // Créer des parents
  console.log('👨‍👩‍👧 Création des parents...');
  const parent1 = await prisma.user.create({
    data: {
      email: 'parent1@school.com',
      password: hashedPassword,
      firstName: 'Claire',
      lastName: 'Moreau',
      role: 'PARENT',
      phone: '+33 6 55 66 77 88',
      isActive: true,
      parentProfile: {
        create: {
          profession: 'Ingénieur',
        },
      },
    },
  });

  const parent2 = await prisma.user.create({
    data: {
      email: 'parent2@school.com',
      password: hashedPassword,
      firstName: 'Marc',
      lastName: 'Lefebvre',
      role: 'PARENT',
      phone: '+33 6 66 77 88 99',
      isActive: true,
      parentProfile: {
        create: {
          profession: 'Médecin',
        },
      },
    },
  });

  const parent1Profile = await prisma.parent.findUnique({
    where: { userId: parent1.id },
  });
  const parent2Profile = await prisma.parent.findUnique({
    where: { userId: parent2.id },
  });

  // Lier les parents aux élèves
  console.log('🔗 Liaison parents-élèves...');
  await prisma.studentParent.create({
    data: {
      studentId: student1Profile!.id,
      parentId: parent1Profile!.id,
      relation: 'mother',
    },
  });

  // Créer des éducateurs
  console.log('👨‍🏫 Création des éducateurs...');
  const educator1 = await prisma.user.create({
    data: {
      email: 'educator1@school.com',
      password: hashedPassword,
      firstName: 'Luc',
      lastName: 'Petit',
      role: 'EDUCATOR',
      phone: '+33 6 77 88 99 00',
      isActive: true,
      educatorProfile: {
        create: {
          employeeId: 'EDU001',
          specialization: 'Soutien scolaire et orientation',
          hireDate: new Date('2020-09-01'),
          contractType: 'CDI',
          salary: 3200,
        },
      },
    },
  });

  const educator2 = await prisma.user.create({
    data: {
      email: 'educator2@school.com',
      password: hashedPassword,
      firstName: 'Julie',
      lastName: 'Rousseau',
      role: 'EDUCATOR',
      phone: '+33 6 88 99 00 11',
      isActive: true,
      educatorProfile: {
        create: {
          employeeId: 'EDU002',
          specialization: 'Accompagnement éducatif',
          hireDate: new Date('2021-09-01'),
          contractType: 'CDI',
          salary: 3100,
        },
      },
    },
  });

  await prisma.studentParent.create({
    data: {
      studentId: student2Profile!.id,
      parentId: parent2Profile!.id,
      relation: 'father',
    },
  });

  // Créer des notes (volume pour graphiques : plusieurs mois + toutes les classes)
  console.log('📝 Création des notes...');
  type CourseRef = { id: string; teacherId: string };
  const class1Courses: CourseRef[] = [
    { id: course1.id, teacherId: teacher1Profile!.id },
    { id: course2.id, teacherId: teacher2Profile!.id },
    { id: course3.id, teacherId: teacher3Profile!.id },
  ];
  const class2Courses: CourseRef[] = [
    { id: course4.id, teacherId: teacher1Profile!.id },
    { id: course5.id, teacherId: teacher2Profile!.id },
  ];

  const trendMonths = [
    new Date('2025-09-18'),
    new Date('2025-10-22'),
    new Date('2025-11-14'),
    new Date('2025-12-09'),
    new Date('2026-01-28'),
    new Date('2026-02-19'),
    new Date('2026-03-11'),
    new Date('2026-04-08'),
    new Date('2026-05-02'),
  ];

  const evaluationCycle = ['EXAM', 'QUIZ', 'HOMEWORK'] as const;
  const gradeRows: {
    studentId: string;
    courseId: string;
    teacherId: string;
    evaluationType: (typeof evaluationCycle)[number];
    title: string;
    score: number;
    maxScore: number;
    coefficient: number;
    date: Date;
    comments?: string;
  }[] = [];

  const pushGrades = (studentId: string, courses: CourseRef[], offset: number) => {
    courses.forEach((c, ci) => {
      trendMonths.forEach((date, mi) => {
        const score = 10 + ((offset + ci * 2 + mi * 3) % 9);
        gradeRows.push({
          studentId,
          courseId: c.id,
          teacherId: c.teacherId,
          evaluationType: evaluationCycle[mi % evaluationCycle.length],
          title: `Évaluation ${mi + 1}`,
          score,
          maxScore: 20,
          coefficient: mi % 4 === 0 ? 2 : 1,
          date,
          comments: score >= 14 ? 'Satisfaisant' : 'À renforcer',
        });
      });
    });
  };

  const studentsClass1 = [
    student1Profile!,
    student2Profile!,
    student3Profile!,
    student7Profile!,
    student8Profile!,
  ];
  const studentsClass2 = [
    student4Profile!,
    student5Profile!,
    student6Profile!,
    student9Profile!,
  ];

  studentsClass1.forEach((s, i) => pushGrades(s.id, class1Courses, i));
  studentsClass2.forEach((s, i) => pushGrades(s.id, class2Courses, i + 10));

  await prisma.grade.createMany({ data: gradeRows });

  // Créer des absences (réparties sur plusieurs mois pour les graphiques)
  console.log('📋 Création des absences...');
  await prisma.absence.createMany({
    data: [
      {
        studentId: student1Profile!.id,
        courseId: course1.id,
        teacherId: teacher1Profile!.id,
        date: new Date('2025-10-10'),
        status: 'ABSENT',
        reason: 'Maladie',
        excused: true,
      },
      {
        studentId: student2Profile!.id,
        courseId: course2.id,
        teacherId: teacher2Profile!.id,
        date: new Date('2025-11-12'),
        status: 'LATE',
        reason: 'Retard transport',
        excused: true,
      },
      {
        studentId: student3Profile!.id,
        courseId: course3.id,
        teacherId: teacher3Profile!.id,
        date: new Date('2025-12-03'),
        status: 'ABSENT',
        reason: 'Rendez-vous médical',
        excused: true,
      },
      {
        studentId: student4Profile!.id,
        courseId: course4.id,
        teacherId: teacher1Profile!.id,
        date: new Date('2026-01-15'),
        status: 'ABSENT',
        reason: 'Maladie',
        excused: false,
      },
      {
        studentId: student5Profile!.id,
        courseId: course5.id,
        teacherId: teacher2Profile!.id,
        date: new Date('2026-02-07'),
        status: 'LATE',
        reason: 'Transport',
        excused: true,
      },
      {
        studentId: student7Profile!.id,
        courseId: course1.id,
        teacherId: teacher1Profile!.id,
        date: new Date('2026-03-20'),
        status: 'ABSENT',
        reason: 'Famille',
        excused: true,
      },
      {
        studentId: student8Profile!.id,
        courseId: course2.id,
        teacherId: teacher2Profile!.id,
        date: new Date('2026-04-14'),
        status: 'LATE',
        reason: 'Réveil tardif',
        excused: false,
      },
      {
        studentId: student9Profile!.id,
        courseId: course4.id,
        teacherId: teacher1Profile!.id,
        date: new Date('2026-05-02'),
        status: 'ABSENT',
        reason: 'Sans justification',
        excused: false,
      },
    ],
  });

  // Créer des devoirs
  console.log('📚 Création des devoirs...');
  const assignment1 = await prisma.assignment.create({
    data: {
      courseId: course1.id,
      teacherId: teacher1Profile!.id,
      title: 'Exercices de mathématiques - Chapitre 2',
      description: 'Faire les exercices 1 à 10 page 45 du manuel',
      dueDate: new Date('2024-11-01'),
      attachments: [],
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      courseId: course2.id,
      teacherId: teacher2Profile!.id,
      title: 'Rédaction - Mon animal préféré',
      description: 'Écrire une rédaction de 200 mots sur votre animal préféré',
      dueDate: new Date('2024-11-05'),
      attachments: [],
    },
  });

  const assignment3 = await prisma.assignment.create({
    data: {
      courseId: course4.id,
      teacherId: teacher1Profile!.id,
      title: 'Problèmes - Fractions et proportions',
      description: 'Exercices 15 à 28 page 112',
      dueDate: new Date('2026-05-15'),
      attachments: [],
    },
  });

  const assignment4 = await prisma.assignment.create({
    data: {
      courseId: course5.id,
      teacherId: teacher2Profile!.id,
      title: 'Lecture analytique - poésie',
      description: 'Analyser le sonnet fourni en cours',
      dueDate: new Date('2026-05-20'),
      attachments: [],
    },
  });

  const allStudentIds = [
    student1Profile!.id,
    student2Profile!.id,
    student3Profile!.id,
    student4Profile!.id,
    student5Profile!.id,
    student6Profile!.id,
    student7Profile!.id,
    student8Profile!.id,
    student9Profile!.id,
  ];

  // Créer les entrées pour les devoirs des élèves (tous les élèves ont une ligne par devoir)
  const studentAssignmentRows: {
    studentId: string;
    assignmentId: string;
    submitted: boolean;
    submittedAt?: Date;
    fileUrl?: string;
    grade?: number;
    feedback?: string;
  }[] = [];

  const pickSubmitted = (studentIndex: number, assignmentIndex: number) =>
    (studentIndex + assignmentIndex * 2) % 3 !== 0;

  const assignmentsList = [assignment1, assignment2, assignment3, assignment4];
  allStudentIds.forEach((sid, si) => {
    assignmentsList.forEach((a, ai) => {
      const submitted = pickSubmitted(si, ai);
      studentAssignmentRows.push({
        studentId: sid,
        assignmentId: a.id,
        submitted,
        submittedAt: submitted ? new Date('2026-04-20T14:00:00') : undefined,
        fileUrl: submitted ? `https://example.com/a${ai}-st${si}.pdf` : undefined,
        grade: submitted ? 12 + ((si + ai) % 7) : undefined,
        feedback: submitted ? 'Remis dans les temps' : undefined,
      });
    });
  });

  await prisma.studentAssignment.createMany({ data: studentAssignmentRows });

  // Créer un emploi du temps
  console.log('📅 Création de l\'emploi du temps...');
  await prisma.schedule.createMany({
    data: [
      {
        classId: class1.id,
        courseId: course1.id,
        dayOfWeek: 1, // Lundi
        startTime: '08:00',
        endTime: '09:00',
        room: 'Salle 101',
      },
      {
        classId: class1.id,
        courseId: course2.id,
        dayOfWeek: 1, // Lundi
        startTime: '09:00',
        endTime: '10:00',
        room: 'Salle 101',
      },
      {
        classId: class1.id,
        courseId: course3.id,
        dayOfWeek: 2, // Mardi
        startTime: '10:00',
        endTime: '11:00',
        room: 'Salle 103',
      },
      {
        classId: class1.id,
        courseId: course1.id,
        dayOfWeek: 3, // Mercredi
        startTime: '08:00',
        endTime: '09:00',
        room: 'Salle 101',
      },
      {
        classId: class1.id,
        courseId: course2.id,
        dayOfWeek: 4, // Jeudi
        startTime: '14:00',
        endTime: '15:00',
        room: 'Salle 101',
      },
      {
        classId: class1.id,
        courseId: course3.id,
        dayOfWeek: 5, // Vendredi
        startTime: '10:00',
        endTime: '11:00',
        room: 'Salle 103',
      },
    ],
  });

  console.log('✅ Seed terminé avec succès !');
  console.log('\n📊 Résumé des données créées :');
  console.log(`   - 1 Administrateur (admin@school.com / password123)`);
  console.log(`   - 3 Enseignants (teacher1@school.com … / password123)`);
  console.log(`   - 9 Élèves (student1@school.com … student9@school.com / password123)`);
  console.log(`   - 2 Parents (parent1@school.com, parent2@school.com / password123)`);
  console.log(`   - 2 Classes (6ème A : 5 élèves, 5ème B : 4 élèves)`);
  console.log(`   - 5 Cours (3 en 6ème A, 2 en 5ème B)`);
  console.log(`   - Nombreuses notes sur sept. 2025 – mai 2026 (graphiques admin / élève)`);
  console.log(`   - 8 Absences réparties sur plusieurs mois`);
  console.log(`   - 4 Devoirs + remises pour tous les élèves`);
  console.log(`   - 6 Entrées d'emploi du temps (6ème A)`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

