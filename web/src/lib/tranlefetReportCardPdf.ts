import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';

export type TranlefetBranding = {
  schoolName: string;
  schoolPhone: string;
  schoolAddress: string;
  regionalDirection: string;
  principalName: string;
  city: string;
};

export const TRANLEFET_DEFAULT_BRANDING: TranlefetBranding = {
  schoolName: 'COLLEGE PRIVE TRANLEFET DE BOUAKÉ',
  schoolPhone: '07 88 94 87 12',
  schoolAddress: 'Bouaké',
  regionalDirection: 'Direction Régionale de Bouaké',
  principalName: '',
  city: 'Bouaké',
};

export type ReportCardStudentPayload = {
  studentIdNumber?: string;
  user: { firstName: string; lastName: string; avatar?: string | null };
  class?: { name: string; level: string };
  gender?: string;
  dateOfBirth?: string;
  address?: string | null;
  grades?: Array<{
    courseId: string;
    title: string;
    score: number;
    maxScore: number;
    coefficient: number;
    date: string;
    course?: { id: string; name: string; code?: string };
  }>;
  allCourses?: Array<{ id: string; name: string; code?: string }>;
  courseAverages?: Record<string, { average: number; count?: number }>;
  average?: number;
  rank?: number;
  totalStudents?: number;
  absences?: { total: number; unexcused: number; excused: number; late: number };
};

function appreciation(average: number): string {
  if (average <= 0) return 'Non noté';
  if (average >= 16) return 'Excellent';
  if (average >= 14) return 'Très bien';
  if (average >= 12) return 'Bien';
  if (average >= 10) return 'Assez bien';
  if (average >= 8) return 'Passable';
  return 'Insuffisant';
}

function genderLabel(g?: string): string {
  if (g === 'FEMALE') return 'F';
  if (g === 'MALE') return 'M';
  return '—';
}

function drawOfficialHeader(
  doc: jsPDF,
  pageWidth: number,
  branding: TranlefetBranding,
  academicYear: string,
  level: string,
  periodLabel: string,
): number {
  const margin = 14;
  let y = 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);

  doc.text('MINISTERE DE L\'EDUCATION NATIONALE', margin, y);
  doc.text('REPUBLIQUE DE COTE D\'IVOIRE', pageWidth - margin, y, { align: 'right' });
  y += 4;
  doc.text(branding.regionalDirection, margin, y);
  doc.setFont('helvetica', 'italic');
  doc.text('Union — Discipline — Travail', pageWidth - margin, y, { align: 'right' });
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(branding.schoolName, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Année scolaire ${academicYear}`, pageWidth - margin, y, { align: 'right' });
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`TEL ${branding.schoolPhone}`, margin, y);
  doc.text(`NIVEAU : ${level || '…………'}`, pageWidth - margin, y, { align: 'right' });
  y += 6;

  const titleW = 90;
  const titleX = (pageWidth - titleW) / 2;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.rect(titleX, y, titleW, 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BULLETIN DE NOTES', pageWidth / 2, y + 6.5, { align: 'center' });
  y += 13;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(periodLabel.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 6;

  return y;
}

function buildCourseRows(studentData: ReportCardStudentPayload): Array<{
  name: string;
  average: number;
  appreciation: string;
  coeff: string;
  detail: string;
}> {
  const coursesMap = new Map<string, { course: { name: string }; grades: typeof studentData.grades; average: number }>();

  (studentData.allCourses || []).forEach((course) => {
    coursesMap.set(course.id, { course, grades: [], average: 0 });
  });

  (studentData.grades || []).forEach((grade) => {
    const id = grade.courseId;
    if (!coursesMap.has(id)) {
      coursesMap.set(id, { course: grade.course || { name: 'Matière' }, grades: [], average: 0 });
    }
    coursesMap.get(id)!.grades!.push(grade);
  });

  coursesMap.forEach((entry, courseId) => {
    const avg = studentData.courseAverages?.[courseId]?.average;
    if (avg !== undefined) {
      entry.average = avg;
    } else if (entry.grades && entry.grades.length > 0) {
      let total = 0;
      let coeff = 0;
      entry.grades.forEach((g) => {
        const on20 = (g.score / g.maxScore) * 20;
        total += on20 * g.coefficient;
        coeff += g.coefficient;
      });
      entry.average = coeff > 0 ? total / coeff : 0;
    }
  });

  return [...coursesMap.entries()]
    .sort((a, b) => a[1].course.name.localeCompare(b[1].course.name, 'fr'))
    .map(([, data]) => {
      const grades = data.grades || [];
      const detail =
        grades.length > 0
          ? grades
              .slice(0, 4)
              .map((g) => `${g.title}: ${g.score}/${g.maxScore}`)
              .join(' · ')
          : '—';
      const coeffSum = grades.reduce((s, g) => s + g.coefficient, 0);
      return {
        name: data.course.name,
        average: data.average,
        appreciation: appreciation(data.average),
        coeff: coeffSum > 0 ? String(coeffSum) : '—',
        detail,
      };
    });
}

export function generateTranlefetReportCardPdf(
  studentData: ReportCardStudentPayload,
  options: {
    periodLabel: string;
    periodKey: string;
    academicYear: string;
    branding?: Partial<TranlefetBranding>;
  },
): void {
  const branding: TranlefetBranding = { ...TRANLEFET_DEFAULT_BRANDING, ...options.branding };
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  let y = drawOfficialHeader(
    doc,
    pageWidth,
    branding,
    options.academicYear,
    studentData.class?.level || '',
    options.periodLabel,
  );

  const fullName = `${studentData.user.lastName} ${studentData.user.firstName}`.toUpperCase();
  const dob = studentData.dateOfBirth
    ? format(new Date(studentData.dateOfBirth), 'dd/MM/yyyy', { locale: fr })
    : '…………';

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.8, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.25 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
    body: [
      [
        { content: 'Matricule', styles: { fontStyle: 'bold' } },
        studentData.studentIdNumber || '…………',
        { content: 'Sexe (M/F)', styles: { fontStyle: 'bold' } },
        genderLabel(studentData.gender),
      ],
      [
        { content: 'Nom et Prénom(s)', styles: { fontStyle: 'bold' } },
        { content: fullName, colSpan: 3 },
      ],
      [
        { content: 'Classe', styles: { fontStyle: 'bold' } },
        studentData.class ? `${studentData.class.name}` : '…………',
        { content: 'Date de naissance', styles: { fontStyle: 'bold' } },
        dob,
      ],
      [
        { content: 'Adresse', styles: { fontStyle: 'bold' } },
        { content: studentData.address?.trim() || '…………', colSpan: 3 },
      ],
    ],
    margin: { left: margin, right: margin },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('RESULTATS SCOLAIRES', pageWidth / 2, y, { align: 'center' });
  y += 4;

  const courseRows = buildCourseRows(studentData);
  autoTable(doc, {
    startY: y,
    head: [['Discipline', 'Moy. /20', 'Appréciation', 'Coeff.', 'Détail des évaluations']],
    body: courseRows.map((r) => [
      r.name,
      r.average > 0 ? r.average.toFixed(2) : '—',
      r.appreciation,
      r.coeff,
      r.detail,
    ]),
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.6, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.25 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'center', cellWidth: 28 },
      3: { halign: 'center', cellWidth: 14 },
      4: { cellWidth: 'auto' },
    },
    margin: { left: margin, right: margin, bottom: 42 },
    showHead: 'everyPage',
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
  const pageHeight = doc.internal.pageSize.getHeight();

  if (y + 48 > pageHeight - 10) {
    doc.addPage();
    y = 20;
  }

  const abs = studentData.absences;
  const absLine = abs
    ? `Absences : ${abs.total} (non excusées : ${abs.unexcused}, excusées : ${abs.excused}, retards : ${abs.late})`
    : 'Absences : …………';

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.2, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.25 },
    body: [
      [
        { content: 'MOYENNE GENERALE', styles: { fontStyle: 'bold' } },
        studentData.average !== undefined ? `${studentData.average.toFixed(2)} / 20` : '—',
        { content: 'RANG / EFFECTIF', styles: { fontStyle: 'bold' } },
        studentData.rank && studentData.totalStudents
          ? `${studentData.rank} / ${studentData.totalStudents}`
          : '—',
      ],
      [{ content: absLine, colSpan: 4 }],
      [
        {
          content:
            'Décision du conseil de classe : ………………………………………………………………………………………………',
          colSpan: 4,
        },
      ],
    ],
    margin: { left: margin, right: margin },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  const sigY = Math.min(y, pageHeight - 32);
  const colW = (pageWidth - margin * 2) / 3;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const signatures = [
    'Le(la) Directeur(trice) des études',
    branding.principalName ? `Le(la) Chef(fe) d\'établissement\n${branding.principalName}` : 'Le(la) Chef(fe) d\'établissement',
    'Signature du parent / tuteur',
  ];
  signatures.forEach((label, i) => {
    const x = margin + i * colW;
    doc.text(label, x + colW / 2, sigY, { align: 'center' });
    doc.setLineWidth(0.3);
    doc.line(x + 4, sigY + 14, x + colW - 4, sigY + 14);
  });

  doc.setFontSize(7.5);
  doc.text(
    `${branding.city} le ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`,
    pageWidth - margin,
    sigY + 22,
    { align: 'right' },
  );
  doc.text('Signature et cachet de l\'établissement', margin, sigY + 22);

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text(`${branding.schoolName} — Bulletin ${options.periodLabel}`, margin, pageHeight - 6);
    doc.text(`Page ${i}/${pageCount}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  const fileName = `bulletin_${studentData.user.lastName}_${studentData.user.firstName}_${options.periodKey}_${options.academicYear}.pdf`;
  doc.save(fileName);
}
