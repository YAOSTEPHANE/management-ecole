import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FilterDropdown from '../ui/FilterDropdown';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

import {
  FiFileText,
  FiBook,
  FiUsers,
  FiAlertCircle,
  FiCalendar,
  FiDownload,
  FiLoader,
  FiCheck,
  FiAward,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
} from 'react-icons/fi';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';

interface GenerateReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const periods = [
  { value: 'trim1', label: 'Trimestre 1' },
  { value: 'trim2', label: 'Trimestre 2' },
  { value: 'trim3', label: 'Trimestre 3' },
  { value: 'sem1', label: 'Semestre 1' },
  { value: 'sem2', label: 'Semestre 2' },
];

const academicYears = [
  { value: '2023-2024', label: '2023-2024' },
  { value: '2024-2025', label: '2024-2025' },
  { value: '2025-2026', label: '2025-2026' },
  { value: '2026-2027', label: '2026-2027' },
];

const GenerateReportCardModal: React.FC<GenerateReportCardModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('trim1');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2024-2025');
  const [isGenerating, setIsGenerating] = useState(false);
  /** Après génération PDF : enregistrer en base et rendre visible aux élèves / familles */
  const [publishAfterSave, setPublishAfterSave] = useState(false);

  // Fetch classes
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: adminApi.getClasses,
    enabled: isOpen,
  });

  // Fetch report card data when class is selected
  const { data: reportCardData, isLoading: isLoadingData } = useQuery({
    queryKey: ['report-card-data', selectedClass, selectedPeriod, selectedAcademicYear],
    queryFn: () => adminApi.generateReportCardData({
      classId: selectedClass,
      period: selectedPeriod,
      academicYear: selectedAcademicYear,
    }),
    enabled: isOpen && !!selectedClass && !!selectedPeriod && !!selectedAcademicYear,
  });

  // Generate report card mutation
  const generateReportCardMutation = useMutation({
    mutationFn: async () => {
      if (!reportCardData) {
        throw new Error('Données de bulletin non disponibles');
      }

      // Generate PDF for each student
      for (const studentData of reportCardData) {
        await generateStudentReportCardPDF(studentData);
      }

      // Save report cards to database
      await adminApi.saveReportCards({
        classId: selectedClass,
        period: selectedPeriod,
        academicYear: selectedAcademicYear,
        publish: publishAfterSave,
      });

      queryClient.invalidateQueries({ queryKey: ['report-cards'] });
      queryClient.invalidateQueries({ queryKey: ['admin-report-cards-tab'] });
      return reportCardData.length;
    },
    onSuccess: (count) => {
      toast.success(
        `${count} bulletin(s) généré(s) et synchronisé(s)${publishAfterSave ? ', publiés pour les familles' : ''} !`
      );
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error generating report cards:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la génération des bulletins');
    },
  });

  const generateStudentReportCardPDF = async (studentData: any) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ===== HEADER WITH BACKGROUND =====
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Logo area
    doc.setFillColor(255, 255, 255);
    doc.circle(25, 17.5, 8, 'F');
    doc.setFontSize(12);
    doc.setTextColor(59, 130, 246);
    doc.setFont('helvetica', 'bold');
    doc.text('SM', 21.5, 20);

    // Title
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('School Manager', 38, 18);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('BULLETIN DE NOTES', pageWidth / 2, 26, { align: 'center' });

        // Period and Year in header
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255); // Blanc (sur fond bleu)
        const periodLabel = periods.find(p => p.value === selectedPeriod)?.label || selectedPeriod;
        doc.text(`${periodLabel} - Année scolaire ${selectedAcademicYear}`, pageWidth / 2, 32, { align: 'center' });

    // ===== STUDENT INFORMATION SECTION =====
    let yPos = 45;
    
    // Box for student info
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(250, 250, 252);
    doc.roundedRect(14, yPos, pageWidth - 28, 42, 3, 3, 'FD');

    // Student Photo (on the right side)
    const photoSize = 32;
    const photoX = pageWidth - 50;
    const photoY = yPos + 5;
    const photoCenterX = photoX + photoSize/2;
    const photoCenterY = photoY + photoSize/2;
    
    // Photo border
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(2);
    doc.circle(photoCenterX, photoCenterY, photoSize/2 + 1, 'D');
    
    try {
      if (studentData.user.avatar) {
        // Try to add image (if URL is accessible)
        doc.addImage(studentData.user.avatar, 'JPEG', photoX, photoY, photoSize, photoSize, undefined, 'FAST');
      } else {
        // Default avatar placeholder with gradient effect
        doc.setFillColor(200, 200, 200);
        doc.circle(photoCenterX, photoCenterY, photoSize/2, 'F');
        doc.setFontSize(18);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'bold');
        const initials = `${studentData.user.firstName[0] || ''}${studentData.user.lastName[0] || ''}`.toUpperCase();
        doc.text(initials, photoCenterX, photoCenterY + 4, { align: 'center' });
      }
    } catch (error) {
      // If image fails, use placeholder
      doc.setFillColor(200, 200, 200);
      doc.circle(photoCenterX, photoCenterY, photoSize/2, 'F');
      doc.setFontSize(18);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'bold');
      const initials = `${studentData.user.firstName[0] || ''}${studentData.user.lastName[0] || ''}`.toUpperCase();
      doc.text(initials, photoCenterX, photoCenterY + 4, { align: 'center' });
    }

    // Student Information Text
    const infoX = 20;
    let infoY = yPos + 8;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Noir
    doc.text('INFORMATIONS DE L\'ÉLÈVE', infoX, infoY);
    infoY += 9;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Noir
    
    doc.text('Nom complet:', infoX, infoY);
    doc.text(`${studentData.user.lastName} ${studentData.user.firstName}`, infoX + 35, infoY);
    infoY += 6;
    
    doc.text('Numéro d\'élève:', infoX, infoY);
    doc.text(studentData.studentIdNumber || studentData.studentId || 'N/A', infoX + 35, infoY);
    infoY += 6;
    
    if (studentData.class) {
      doc.text('Classe:', infoX, infoY);
      doc.text(`${studentData.class.name} (${studentData.class.level})`, infoX + 35, infoY);
      infoY += 6;
    }
    
    doc.text('Année scolaire:', infoX, infoY);
    doc.text(selectedAcademicYear, infoX + 35, infoY);
    
    yPos = 97;

    // Organiser les notes par matière
    const coursesMap = new Map<string, { course: any; grades: any[]; average: number }>();
    
    // D'abord, ajouter tous les cours de la classe (même ceux sans notes)
    if (studentData.allCourses && studentData.allCourses.length > 0) {
      studentData.allCourses.forEach((course: any) => {
        if (!coursesMap.has(course.id)) {
          coursesMap.set(course.id, {
            course: course,
            grades: [],
            average: 0,
          });
        }
      });
    }
    
    // Ensuite, grouper les notes par matière et associer aux cours
    if (studentData.grades && studentData.grades.length > 0) {
      studentData.grades.forEach((grade: any) => {
        const courseId = grade.courseId;
        if (!coursesMap.has(courseId)) {
          // Si le cours n'est pas dans allCourses, l'ajouter quand même
          coursesMap.set(courseId, {
            course: grade.course,
            grades: [],
            average: 0,
          });
        }
        coursesMap.get(courseId)!.grades.push(grade);
      });
    }

    // Calculer la moyenne pour chaque matière (utiliser les données du serveur)
    coursesMap.forEach((courseData, courseId) => {
      const courseAvg = studentData.courseAverages?.[courseId];
      if (courseAvg && courseAvg.average !== undefined) {
        courseData.average = courseAvg.average;
      } else if (courseData.grades.length > 0) {
        // Calculer la moyenne si elle n'est pas fournie mais qu'on a des notes
        let total = 0;
        let totalCoeff = 0;
        courseData.grades.forEach((grade: any) => {
          const gradeOn20 = (grade.score / grade.maxScore) * 20;
          total += gradeOn20 * grade.coefficient;
          totalCoeff += grade.coefficient;
        });
        courseData.average = totalCoeff > 0 ? total / totalCoeff : 0;
      } else {
        // Pas de notes pour cette matière
        courseData.average = 0;
      }
    });

    // Créer le tableau avec toutes les notes détaillées par matière
    const tableData: any[][] = [];
    
    // Trier les matières par nom pour un affichage cohérent
    const sortedCourses = Array.from(coursesMap.entries()).sort((a, b) => 
      a[1].course.name.localeCompare(b[1].course.name)
    );
    
    sortedCourses.forEach(([courseId, courseData]) => {
      const { course, grades, average } = courseData;
      
      // Si pas de notes, afficher quand même la matière
      if (!grades || grades.length === 0) {
        let appreciation = 'Non noté';
        if (average > 0) {
          if (average >= 16) appreciation = 'Excellent';
          else if (average >= 14) appreciation = 'Très Bien';
          else if (average >= 12) appreciation = 'Bien';
          else if (average >= 10) appreciation = 'Assez Bien';
          else appreciation = 'À Améliorer';
        }
        
        tableData.push([
          course.name,
          average > 0 ? `${average.toFixed(2)}/20` : '-',
          appreciation,
          'Aucune note',
          '-',
          '-',
          '-',
        ]);
        return;
      }
      
      // Trier les notes par date (plus récente en premier)
      const sortedGrades = [...grades].sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Appréciation
      let appreciation = '';
      if (average >= 16) appreciation = 'Excellent';
      else if (average >= 14) appreciation = 'Très Bien';
      else if (average >= 12) appreciation = 'Bien';
      else if (average >= 10) appreciation = 'Assez Bien';
      else appreciation = 'À Améliorer';

      // Pour chaque note de cette matière, créer une ligne
      sortedGrades.forEach((grade: any, index: number) => {
        tableData.push([
          index === 0 ? course.name : '', // Nom de la matière seulement sur la première ligne
          index === 0 ? `${average.toFixed(2)}/20` : '', // Moyenne seulement sur la première ligne
          index === 0 ? appreciation : '', // Appréciation seulement sur la première ligne
          grade.title || 'Sans titre',
          `${grade.score}/${grade.maxScore}`,
          `coeff. ${grade.coefficient}`,
          format(new Date(grade.date), 'dd/MM/yyyy', { locale: fr }),
        ]);
      });
    });

    if (tableData.length > 0) {
      // Title before table - amélioré
      yPos += 3; // Espace avant le titre
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0); // Noir
      doc.text('DÉTAIL DES NOTES PAR MATIÈRE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10; // Plus d'espace après le titre
      
      const tableOptions = {
        startY: yPos,
        head: [['Matière', 'Moyenne', 'Appréciation', 'Évaluation', 'Note', 'Coeff.', 'Date']],
        body: tableData,
        theme: 'striped' as const,
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 2, fontStyle: 'bold', textColor: [0, 0, 0] }, // Tous les textes en gras et noir
        columnStyles: {
          0: { cellWidth: 38, fontStyle: 'bold' },
          1: { cellWidth: 26, halign: 'center' as const, fontStyle: 'bold' },
          2: { cellWidth: 30, halign: 'center' as const },
          3: { cellWidth: 35 },
          4: { cellWidth: 24, halign: 'center' as const },
          5: { cellWidth: 22, halign: 'center' as const },
          6: { cellWidth: 30, halign: 'center' as const, cellPadding: 3 }, // Date avec plus d'espace
        },
        margin: { left: 14, right: 14, bottom: 50 },
        pageBreak: 'auto' as const,
        rowPageBreak: 'avoid' as const,
        showHead: 'everyPage' as const,
        didParseCell: (data: any) => {
          // Mettre en évidence les lignes avec le nom de la matière
          if (data.column.index === 0 && data.cell.raw !== '') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 248, 255];
          }
          if (data.column.index === 1 && data.cell.raw !== '') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 248, 255];
            // Color code based on average
            const avg = parseFloat(data.cell.raw.replace('/20', '')) || 0;
            if (avg >= 16) data.cell.styles.textColor = [16, 185, 129]; // green
            else if (avg >= 14) data.cell.styles.textColor = [59, 130, 246]; // blue
            else if (avg >= 10) data.cell.styles.textColor = [245, 158, 11]; // orange
            else data.cell.styles.textColor = [239, 68, 68]; // red
          }
          if (data.column.index === 2 && data.cell.raw !== '') {
            data.cell.styles.fillColor = [240, 248, 255];
          }
        },
      };

      // Utiliser autoTable comme fonction plutôt que comme méthode
      if (typeof (doc as any).autoTable === 'function') {
        (doc as any).autoTable(tableOptions);
        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else if (typeof autoTable === 'function') {
        autoTable(doc, tableOptions as any);
        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
        console.error('autoTable is not available');
      }
    }

    // ===== OVERALL AVERAGE AND RANK SECTION =====
    if (studentData.average !== undefined) {
      // Vérifier si on a assez d'espace, sinon créer une nouvelle page
      const avgBoxHeight = studentData.rank ? 25 : 18;
      if (yPos + avgBoxHeight + 30 > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      } else {
        yPos += 5;
      }
      
      // Background box for average
      doc.setFillColor(245, 247, 250);
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.roundedRect(14, yPos, pageWidth - 28, avgBoxHeight, 3, 3, 'FD');
      
      const avgBoxCenterY = yPos + avgBoxHeight / 2;
      
      // Average
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0); // Noir
      doc.text('Moyenne Générale', pageWidth / 2, avgBoxCenterY - 4, { align: 'center' });
      
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0); // Noir
      const avgValue = studentData.average.toFixed(2);
      doc.text(`${avgValue}/20`, pageWidth / 2, avgBoxCenterY + 8, { align: 'center' });

      // Rank if available
      if (studentData.rank) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0); // Noir
        doc.text(`Rang: ${studentData.rank}/${studentData.totalStudents || ''} dans la classe`, pageWidth / 2, avgBoxCenterY + 15, { align: 'center' });
      }
    }

    // ===== FOOTER ON ALL PAGES =====
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const currentPageHeight = doc.internal.pageSize.getHeight();
      const footerY = currentPageHeight - 20;
      
      // Footer line
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(14, footerY - 8, pageWidth - 14, footerY - 8);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0); // Noir
      if (i === pageCount) {
        doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, pageWidth / 2, footerY, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('School Manager - Système de Gestion Scolaire', pageWidth / 2, footerY + 5, { align: 'center' });
      }
      // Page number
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0); // Noir
      doc.text(`Page ${i}/${pageCount}`, pageWidth - 20, footerY + 5, { align: 'right' });
    }

    // Save PDF
    const fileName = `bulletin_${studentData.user.lastName}_${studentData.user.firstName}_${selectedPeriod}_${selectedAcademicYear}.pdf`;
    doc.save(fileName);
  };

  const handleGenerate = async () => {
    if (!selectedClass) {
      toast.error('Veuillez sélectionner une classe');
      return;
    }
    if (!selectedPeriod) {
      toast.error('Veuillez sélectionner une période');
      return;
    }
    if (!selectedAcademicYear) {
      toast.error('Veuillez sélectionner une année scolaire');
      return;
    }

    setIsGenerating(true);
    generateReportCardMutation.mutate();
  };

  const handleClose = () => {
    setSelectedClass('');
    setSelectedPeriod('trim1');
    setSelectedAcademicYear('2024-2025');
    setPublishAfterSave(false);
    onClose();
  };

  const canGenerate = selectedClass && selectedPeriod && selectedAcademicYear && reportCardData && reportCardData.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Génération de Bulletins" size="lg">
      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <FiAlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">Instructions</p>
              <p className="text-sm text-blue-700">
                Sélectionnez une classe, une période et une année scolaire pour générer les bulletins PDF de tous les
                élèves. Les moyennes et rangs sont calculés automatiquement à partir des notes saisies sur la période,
                puis enregistrés en base. Cochez « Publier » pour que les bulletins apparaissent dans l’espace élève et
                parent.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Classe <span className="text-red-500">*</span>
            </label>
            <FilterDropdown
              options={[
                { value: '', label: 'Sélectionner une classe' },
                ...(classes || []).map((cls: any) => ({
                  value: cls.id,
                  label: `${cls.name} - ${cls.level}`,
                })),
              ]}
              selected={selectedClass}
              onChange={setSelectedClass}
              label="Classe"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Période <span className="text-red-500">*</span>
            </label>
            <FilterDropdown
              options={periods}
              selected={selectedPeriod}
              onChange={setSelectedPeriod}
              label="Période"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Année scolaire <span className="text-red-500">*</span>
            </label>
            <FilterDropdown
              options={academicYears}
              selected={selectedAcademicYear}
              onChange={setSelectedAcademicYear}
              label="Année scolaire"
            />
          </div>
        </div>

        {/* Preview */}
        {isLoadingData && (
          <div className="flex items-center justify-center py-8">
            <FiLoader className="w-6 h-6 animate-spin text-blue-600 mr-3" />
            <span className="text-gray-600">Chargement des données...</span>
          </div>
        )}

        {reportCardData && reportCardData.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <FiUsers className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Aperçu</h3>
            </div>
            <p className="text-sm text-gray-700">
              {reportCardData.length} élève(s) trouvé(s) dans cette classe. Les bulletins seront générés pour tous les élèves.
            </p>
            {selectedClass && classes && (
              <p className="text-sm text-gray-600 mt-2">
                Classe: {classes.find((c: any) => c.id === selectedClass)?.name}
              </p>
            )}
          </div>
        )}

        {reportCardData && reportCardData.length === 0 && selectedClass && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <FiAlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Aucun élève trouvé dans cette classe pour la période sélectionnée.
              </p>
            </div>
          </div>
        )}

        <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-gray-200 bg-gray-50/80 p-3">
          <input
            type="checkbox"
            className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
            checked={publishAfterSave}
            onChange={(e) => setPublishAfterSave(e.target.checked)}
          />
          <span>
            <span className="text-sm font-semibold text-gray-900">Publier les bulletins</span>
            <span className="block text-xs text-gray-600 mt-0.5">
              Sinon ils restent en brouillon : visibles uniquement dans l’administration jusqu’à publication manuelle.
            </span>
          </span>
        </label>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={handleClose} disabled={isGenerating}>
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isGenerating ? (
              <>
                <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <FiFileText className="w-4 h-4 mr-2" />
                Générer les bulletins
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default GenerateReportCardModal;

