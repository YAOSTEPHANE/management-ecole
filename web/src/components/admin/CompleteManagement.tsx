import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Table from '../ui/Table';
import SearchBar from '../ui/SearchBar';
import FilterDropdown from '../ui/FilterDropdown';
import { 
  FiClipboard, 
  FiFileText, 
  FiCalendar, 
  FiUpload,
  FiSearch,
  FiFilter,
  FiEye,
  FiEdit,
  FiTrash2,
  FiDownload,
  FiPlus,
  FiTrendingUp,
  FiTrendingDown,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiUser,
  FiBook,
  FiAward,
  FiAlertCircle,
  FiBarChart
} from 'react-icons/fi';
import AddGradeModal from './AddGradeModal';
import GradeDetailsModal from './GradeDetailsModal';
import AddAbsenceModal from './AddAbsenceModal';
import AbsenceDetailsModal from './AbsenceDetailsModal';
import AddAssignmentModal from './AddAssignmentModal';
import AssignmentDetailsModal from './AssignmentDetailsModal';
import GenerateReportCardModal from './GenerateReportCardModal';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
// Import both default and side-effect to ensure plugin is loaded
import autoTable from 'jspdf-autotable';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

type ManagementTab = 'grades' | 'reportCards' | 'absences' | 'assignments';

interface CompleteManagementProps {
  /** Notes + bulletins uniquement (module Notation & évaluation) */
  gradingModule?: boolean;
  /** Absences / présences uniquement (module Gestion des présences) */
  attendanceModule?: boolean;
}

const CompleteManagement: React.FC<CompleteManagementProps> = ({
  gradingModule = false,
  attendanceModule = false,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ManagementTab>(
    attendanceModule ? 'absences' : 'grades'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  
  // Modals state
  const [isAddGradeModalOpen, setIsAddGradeModalOpen] = useState(false);
  const [isAddAbsenceModalOpen, setIsAddAbsenceModalOpen] = useState(false);
  const [isAddAssignmentModalOpen, setIsAddAssignmentModalOpen] = useState(false);
  const [isGenerateReportCardModalOpen, setIsGenerateReportCardModalOpen] = useState(false);
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);
  const [selectedAbsenceId, setSelectedAbsenceId] = useState<string | null>(null);
  const [isAbsenceDetailsModalOpen, setIsAbsenceDetailsModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [isAssignmentDetailsModalOpen, setIsAssignmentDetailsModalOpen] = useState(false);

  useEffect(() => {
    if (
      gradingModule &&
      (activeTab === 'absences' || activeTab === 'assignments')
    ) {
      setActiveTab('grades');
    }
    if (attendanceModule && activeTab !== 'absences') {
      setActiveTab('absences');
    }
  }, [gradingModule, attendanceModule, activeTab]);

  // Fetch data
  const { data: grades, isLoading: gradesLoading } = useQuery({
    queryKey: ['admin-grades', selectedClass, selectedCourse],
    queryFn: () =>
      adminApi.getAllGrades({
        ...(selectedClass !== 'all' && { classId: selectedClass }),
        ...(selectedCourse !== 'all' && { courseId: selectedCourse }),
      }),
    enabled: !attendanceModule,
  });

  const { data: absences, isLoading: absencesLoading } = useQuery({
    queryKey: ['admin-absences', selectedClass, selectedCourse],
    queryFn: () =>
      adminApi.getAllAbsences({
        ...(selectedClass !== 'all' && { classId: selectedClass }),
        ...(selectedCourse !== 'all' && { courseId: selectedCourse }),
      }),
    enabled: !gradingModule,
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['admin-assignments', selectedClass, selectedCourse],
    queryFn: () =>
      adminApi.getAllAssignments({
        ...(selectedClass !== 'all' && { classId: selectedClass }),
        ...(selectedCourse !== 'all' && { courseId: selectedCourse }),
      }),
    enabled: !gradingModule && !attendanceModule,
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: adminApi.getClasses,
  });

  const { data: courses } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => adminApi.getAllCourses(),
  });

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: adminApi.getStudents,
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: adminApi.getTeachers,
  });

  // Delete mutations
  const deleteGradeMutation = useMutation({
    mutationFn: adminApi.deleteGrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-grades'] });
      toast.success('Note supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    },
  });

  const deleteAbsenceMutation = useMutation({
    mutationFn: adminApi.deleteAbsence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-absences'] });
      toast.success('Absence supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: adminApi.deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
      toast.success('Devoir supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    },
  });

  const handleDeleteGrade = (gradeId: string, studentName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la note de "${studentName}" ?`)) {
      deleteGradeMutation.mutate(gradeId);
    }
  };

  const handleDeleteAbsence = (absenceId: string, studentName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'absence de "${studentName}" ?`)) {
      deleteAbsenceMutation.mutate(absenceId);
    }
  };

  const handleDeleteAssignment = (assignmentId: string, title: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le devoir "${title}" ?`)) {
      deleteAssignmentMutation.mutate(assignmentId);
    }
  };

  const [isGradeDetailsModalOpen, setIsGradeDetailsModalOpen] = useState(false);

  const handleViewGrade = (gradeId: string) => {
    setSelectedGradeId(gradeId);
    setIsGradeDetailsModalOpen(true);
  };

  const handleViewAbsence = (absenceId: string) => {
    setSelectedAbsenceId(absenceId);
    setIsAbsenceDetailsModalOpen(true);
  };

  const handleEditAbsence = (absenceId: string) => {
    setSelectedAbsenceId(absenceId);
    setIsAddAbsenceModalOpen(true);
  };

  const handleViewAssignment = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setIsAssignmentDetailsModalOpen(true);
  };

  const handleEditAssignment = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setIsAddAssignmentModalOpen(true);
  };

  // Export functions
  const exportGradesToCSV = () => {
    if (!filteredGrades || filteredGrades.length === 0) {
      toast.error('Aucune note à exporter');
      return;
    }

    try {
      const headers = [
        'Élève',
        'Classe',
        'Matière',
        'Type d\'évaluation',
        'Titre',
        'Note',
        'Note maximale',
        'Pourcentage',
        'Coefficient',
        'Date',
        'Enseignant',
        'Commentaires'
      ];

      const csvContent = [
        headers.join(','),
        ...filteredGrades.map((grade: any) => {
          const percentage = ((grade.score / grade.maxScore) * 100).toFixed(2);
          return [
            `"${grade.student.user.firstName} ${grade.student.user.lastName}"`,
            `"${grade.student.class?.name || 'N/A'}"`,
            `"${grade.course.name}"`,
            `"${grade.evaluationType || grade.type || 'N/A'}"`,
            `"${grade.title.replace(/"/g, '""')}"`,
            grade.score.toFixed(2),
            grade.maxScore.toFixed(2),
            percentage,
            grade.coefficient?.toFixed(2) || '1.00',
            format(new Date(grade.date), 'dd/MM/yyyy', { locale: fr }),
            `"${grade.teacher.user.firstName} ${grade.teacher.user.lastName}"`,
            `"${(grade.comments || '').replace(/"/g, '""')}"`
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `notes_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Notes exportées en CSV avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  const exportGradesToJSON = () => {
    if (!filteredGrades || filteredGrades.length === 0) {
      toast.error('Aucune note à exporter');
      return;
    }

    try {
      const jsonData = filteredGrades.map((grade: any) => ({
        id: grade.id,
        élève: `${grade.student.user.firstName} ${grade.student.user.lastName}`,
        classe: grade.student.class?.name || 'N/A',
        matière: grade.course.name,
        type: grade.evaluationType || grade.type || 'N/A',
        titre: grade.title,
        note: grade.score,
        noteMaximale: grade.maxScore,
        pourcentage: ((grade.score / grade.maxScore) * 100).toFixed(2),
        coefficient: grade.coefficient || 1,
        date: format(new Date(grade.date), 'dd/MM/yyyy', { locale: fr }),
        enseignant: `${grade.teacher.user.firstName} ${grade.teacher.user.lastName}`,
        commentaires: grade.comments || ''
      }));

      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `notes_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Notes exportées en JSON avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export JSON:', error);
      toast.error('Erreur lors de l\'export JSON');
    }
  };

  const exportGradesToPDF = () => {
    if (!filteredGrades || filteredGrades.length === 0) {
      toast.error('Aucune note à exporter');
      return;
    }

    try {
      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation for better table display
      
      // Verify autoTable is available
      if (typeof (doc as any).autoTable !== 'function') {
        console.error('autoTable plugin not loaded on doc instance');
        // Try using autoTable as a function directly
        if (typeof autoTable === 'function') {
          console.log('Using autoTable as direct function');
          // We'll use it in the table creation section
        } else {
          toast.error('Erreur: Le plugin PDF n\'est pas chargé. Veuillez rafraîchir la page.');
          return;
        }
      }
      
      const currentDate = new Date().toLocaleDateString('fr-FR');
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246);
      doc.text('School Manager', 14, 20);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Rapport des Notes', 14, 30);
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Généré le ${currentDate}`, 14, 37);
      
      // Filters info
      let filterInfo = 'Filtres appliqués: ';
      if (selectedClass !== 'all') {
        const selectedClassObj = classes?.find((c: any) => c.id === selectedClass);
        filterInfo += `Classe: ${selectedClassObj?.name || selectedClass}`;
      }
      if (selectedCourse !== 'all') {
        const selectedCourseObj = courses?.find((c: any) => c.id === selectedCourse);
        filterInfo += selectedClass !== 'all' ? `, Matière: ${selectedCourseObj?.name || selectedCourse}` : `Matière: ${selectedCourseObj?.name || selectedCourse}`;
      }
      if (searchQuery) {
        filterInfo += (selectedClass !== 'all' || selectedCourse !== 'all') ? `, Recherche: "${searchQuery}"` : `Recherche: "${searchQuery}"`;
      }
      if (selectedClass === 'all' && selectedCourse === 'all' && !searchQuery) {
        filterInfo = 'Toutes les notes';
      }
      
      // Truncate filter info if too long
      const maxWidth = 280; // Landscape A4 width - margins
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      const truncatedFilterInfo = doc.splitTextToSize(filterInfo, maxWidth);
      doc.text(truncatedFilterInfo, 14, 45);
      
      // Calculate start Y position based on filter info height
      const filterInfoHeight = truncatedFilterInfo.length * 5;
      const startY = 50 + filterInfoHeight;
      
      // Table data - ensure all values are safe
      const tableData = filteredGrades.map((grade: any) => {
        try {
          const score = parseFloat(grade.score) || 0;
          const maxScore = parseFloat(grade.maxScore) || 20;
          const percentage = ((score / maxScore) * 100).toFixed(1);
          const studentName = `${grade.student?.user?.firstName || ''} ${grade.student?.user?.lastName || ''}`.trim() || 'N/A';
          const className = (grade.student?.class?.name || 'N/A').substring(0, 15);
          const courseName = (grade.course?.name || 'N/A').substring(0, 20);
          const evalType = (grade.evaluationType || grade.type || 'N/A').substring(0, 10);
          const title = (grade.title || 'N/A').substring(0, 25);
          const teacherName = `${grade.teacher?.user?.firstName || ''} ${grade.teacher?.user?.lastName || ''}`.trim().substring(0, 20) || 'N/A';
          const dateStr = grade.date ? format(new Date(grade.date), 'dd/MM/yyyy', { locale: fr }) : 'N/A';
          
          return [
            studentName,
            className,
            courseName,
            evalType,
            title,
            `${score.toFixed(2)}/${maxScore}`,
            `${percentage}%`,
            (grade.coefficient || 1).toFixed(1),
            dateStr,
            teacherName
          ];
        } catch (err) {
          console.error('Error processing grade:', err, grade);
          return ['Erreur', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A'];
        }
      });

      // Add table with better error handling
      // Try using autoTable method on doc first, fallback to function call
      const useAutoTable = (options: any) => {
        if (typeof (doc as any).autoTable === 'function') {
          (doc as any).autoTable(options);
        } else if (typeof autoTable === 'function') {
          autoTable(doc, options);
        } else {
          throw new Error('autoTable is not available');
        }
      };

      try {
        useAutoTable({
          head: [['Élève', 'Classe', 'Matière', 'Type', 'Titre', 'Note', '%', 'Coeff.', 'Date', 'Enseignant']],
          body: tableData,
          startY: startY,
          theme: 'striped',
          headStyles: { 
            fillColor: [59, 130, 246], 
            textColor: 255,
            fontStyle: 'bold'
          },
          styles: {
            fontSize: 7,
            cellPadding: 2
          },
          margin: { left: 14, right: 14 },
          didDrawPage: (data: any) => {
            // Add page number
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(
              `Page ${data.pageNumber}`,
              doc.internal.pageSize.getWidth() / 2,
              doc.internal.pageSize.getHeight() - 10,
              { align: 'center' }
            );
          }
        });
      } catch (tableError: any) {
        console.error('Erreur lors de la création du tableau:', tableError);
        // Try even simpler version
        try {
          useAutoTable({
            head: [['Élève', 'Classe', 'Matière', 'Note', 'Date']],
            body: tableData.map((row: any[]) => [row[0], row[1], row[2], row[5], row[8]]),
            startY: startY,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246], textColor: 255 },
          });
        } catch (altError: any) {
          console.error('Erreur avec méthode alternative:', altError);
          toast.error(`Erreur lors de l'export PDF: ${altError.message || 'Impossible de créer le tableau'}`);
          return;
        }
      }

      // Get final Y position safely
      let finalY = startY;
      try {
        const lastAutoTable = (doc as any).lastAutoTable;
        if (lastAutoTable && typeof lastAutoTable.finalY === 'number') {
          finalY = lastAutoTable.finalY;
        } else {
          // Estimate final Y if lastAutoTable is not available
          const rowsPerPage = 15;
          const rowHeight = 8;
          const pagesNeeded = Math.ceil(tableData.length / rowsPerPage);
          finalY = startY + (pagesNeeded * rowsPerPage * rowHeight);
          if (finalY > doc.internal.pageSize.getHeight() - 30) {
            finalY = doc.internal.pageSize.getHeight() - 30;
          }
        }
      } catch (err) {
        console.warn('Could not get final Y position, using default');
        finalY = doc.internal.pageSize.getHeight() - 50;
      }

      // Add statistics on last page
      const totalGrades = filteredGrades.length;
      if (totalGrades > 0) {
        const averageScore = filteredGrades.reduce((sum: number, g: any) => {
          const score = parseFloat(g.score) || 0;
          const maxScore = parseFloat(g.maxScore) || 20;
          return sum + (score / maxScore) * 20;
        }, 0) / totalGrades;
        const excellentCount = filteredGrades.filter((g: any) => {
          const score = parseFloat(g.score) || 0;
          const maxScore = parseFloat(g.maxScore) || 20;
          return (score / maxScore) * 100 >= 80;
        }).length;
        const goodCount = filteredGrades.filter((g: any) => {
          const score = parseFloat(g.score) || 0;
          const maxScore = parseFloat(g.maxScore) || 20;
          const pct = (score / maxScore) * 100;
          return pct >= 60 && pct < 80;
        }).length;
        const averageCount = filteredGrades.filter((g: any) => {
          const score = parseFloat(g.score) || 0;
          const maxScore = parseFloat(g.maxScore) || 20;
          const pct = (score / maxScore) * 100;
          return pct >= 40 && pct < 60;
        }).length;
        const poorCount = filteredGrades.filter((g: any) => {
          const score = parseFloat(g.score) || 0;
          const maxScore = parseFloat(g.maxScore) || 20;
          return (score / maxScore) * 100 < 40;
        }).length;

        // Check if we need a new page for statistics
        if (finalY > doc.internal.pageSize.getHeight() - 60) {
          doc.addPage();
          finalY = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text('Statistiques', 14, finalY + 10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total: ${totalGrades} notes`, 14, finalY + 18);
        doc.text(`Moyenne générale: ${averageScore.toFixed(2)}/20`, 14, finalY + 25);
        doc.text(`Excellent (≥80%): ${excellentCount}`, 14, finalY + 32);
        doc.text(`Bien (60-79%): ${goodCount}`, 14, finalY + 39);
        doc.text(`Moyen (40-59%): ${averageCount}`, 14, finalY + 46);
        doc.text(`Insuffisant (<40%): ${poorCount}`, 14, finalY + 53);
      }

      const filename = `notes_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      toast.success('Notes exportées en PDF avec succès !');
    } catch (error: any) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error(`Erreur lors de l'export PDF: ${error.message || 'Erreur inconnue'}`);
    }
  };

  const handleExportGrades = (format: 'csv' | 'json' | 'pdf') => {
    switch (format) {
      case 'csv':
        exportGradesToCSV();
        break;
      case 'json':
        exportGradesToJSON();
        break;
      case 'pdf':
        exportGradesToPDF();
        break;
    }
  };

  // Export functions for Absences
  const exportAbsencesToCSV = () => {
    if (!filteredAbsences || filteredAbsences.length === 0) {
      toast.error('Aucune absence à exporter');
      return;
    }

    try {
      const headers = ['Élève', 'Classe', 'Matière', 'Date', 'Statut', 'Justifiée', 'Raison', 'Enseignant'];
      const csvContent =
        '\ufeff' + // BOM for UTF-8
        headers.join(';') +
        '\n' +
        filteredAbsences
          .map((absence: any) =>
            [
              `"${absence.student.user.firstName} ${absence.student.user.lastName}"`,
              `"${absence.student.class?.name || 'N/A'}"`,
              `"${absence.course.name}"`,
              format(new Date(absence.date), 'dd/MM/yyyy', { locale: fr }),
              `"${absence.status}"`,
              absence.excused ? 'Oui' : 'Non',
              `"${(absence.reason || '').replace(/"/g, '""')}"`,
              `"${absence.teacher.user.firstName} ${absence.teacher.user.lastName}"`,
            ].join(';')
          )
          .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `absences_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Absences exportées en CSV avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  const exportAbsencesToJSON = () => {
    if (!filteredAbsences || filteredAbsences.length === 0) {
      toast.error('Aucune absence à exporter');
      return;
    }

    try {
      const jsonData = filteredAbsences.map((absence: any) => ({
        id: absence.id,
        élève: `${absence.student.user.firstName} ${absence.student.user.lastName}`,
        classe: absence.student.class?.name || 'N/A',
        matière: absence.course.name,
        date: format(new Date(absence.date), 'dd/MM/yyyy', { locale: fr }),
        statut: absence.status,
        justifiée: absence.excused,
        raison: absence.reason || '',
        enseignant: `${absence.teacher.user.firstName} ${absence.teacher.user.lastName}`,
      }));

      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `absences_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Absences exportées en JSON avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export JSON:', error);
      toast.error('Erreur lors de l\'export JSON');
    }
  };

  const exportAbsencesToPDF = () => {
    if (!filteredAbsences || filteredAbsences.length === 0) {
      toast.error('Aucune absence à exporter');
      return;
    }

    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const currentDate = new Date().toLocaleDateString('fr-FR');
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246);
      doc.text('School Manager', 14, 20);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Rapport des Absences', 14, 30);
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Généré le ${currentDate}`, 14, 37);

      const tableData = filteredAbsences.map((absence: any) => [
        `${absence.student.user.firstName} ${absence.student.user.lastName}`,
        absence.student.class?.name || 'N/A',
        absence.course.name,
        format(new Date(absence.date), 'dd/MM/yyyy', { locale: fr }),
        absence.status,
        absence.excused ? 'Oui' : 'Non',
        absence.reason || 'N/A',
        `${absence.teacher.user.firstName} ${absence.teacher.user.lastName}`,
      ]);

      const useAutoTable = (options: any) => {
        if (typeof (doc as any).autoTable === 'function') {
          (doc as any).autoTable(options);
        } else if (typeof autoTable === 'function') {
          autoTable(doc, options);
        } else {
          throw new Error('autoTable is not available');
        }
      };

      useAutoTable({
        head: [['Élève', 'Classe', 'Matière', 'Date', 'Statut', 'Justifiée', 'Raison', 'Enseignant']],
        body: tableData,
        startY: 45,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });

      doc.save(`absences_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Absences exportées en PDF avec succès !');
    } catch (error: any) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error(`Erreur lors de l'export PDF: ${error.message || 'Erreur inconnue'}`);
    }
  };

  const handleExportAbsences = (format: 'csv' | 'json' | 'pdf') => {
    switch (format) {
      case 'csv':
        exportAbsencesToCSV();
        break;
      case 'json':
        exportAbsencesToJSON();
        break;
      case 'pdf':
        exportAbsencesToPDF();
        break;
    }
  };

  // Export functions for Assignments
  const exportAssignmentsToCSV = () => {
    if (!filteredAssignments || filteredAssignments.length === 0) {
      toast.error('Aucun devoir à exporter');
      return;
    }

    try {
      const headers = ['Titre', 'Matière', 'Classe', 'Enseignant', 'Date d\'échéance', 'Soumissions', 'Taux', 'Description'];
      const csvContent =
        '\ufeff' + // BOM for UTF-8
        headers.join(';') +
        '\n' +
        filteredAssignments
          .map((assignment: any) => {
            const submittedCount = assignment.students?.filter((s: any) => s.submitted).length || 0;
            const totalCount = assignment.students?.length || 0;
            const rate = totalCount > 0 ? ((submittedCount / totalCount) * 100).toFixed(1) : '0';
            return [
              `"${assignment.title.replace(/"/g, '""')}"`,
              `"${assignment.course.name}"`,
              `"${assignment.course.class?.name || 'N/A'}"`,
              `"${assignment.teacher.user.firstName} ${assignment.teacher.user.lastName}"`,
              format(new Date(assignment.dueDate), 'dd/MM/yyyy', { locale: fr }),
              `${submittedCount}/${totalCount}`,
              `${rate}%`,
              `"${(assignment.description || '').replace(/"/g, '""')}"`,
            ].join(';');
          })
          .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `devoirs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Devoirs exportés en CSV avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  const exportAssignmentsToJSON = () => {
    if (!filteredAssignments || filteredAssignments.length === 0) {
      toast.error('Aucun devoir à exporter');
      return;
    }

    try {
      const jsonData = filteredAssignments.map((assignment: any) => {
        const submittedCount = assignment.students?.filter((s: any) => s.submitted).length || 0;
        const totalCount = assignment.students?.length || 0;
        return {
          id: assignment.id,
          titre: assignment.title,
          matière: assignment.course.name,
          classe: assignment.course.class?.name || 'N/A',
          enseignant: `${assignment.teacher.user.firstName} ${assignment.teacher.user.lastName}`,
          dateÉchéance: format(new Date(assignment.dueDate), 'dd/MM/yyyy', { locale: fr }),
          soumissions: `${submittedCount}/${totalCount}`,
          taux: totalCount > 0 ? ((submittedCount / totalCount) * 100).toFixed(1) : '0',
          description: assignment.description || '',
        };
      });

      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `devoirs_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Devoirs exportés en JSON avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export JSON:', error);
      toast.error('Erreur lors de l\'export JSON');
    }
  };

  const exportAssignmentsToPDF = () => {
    if (!filteredAssignments || filteredAssignments.length === 0) {
      toast.error('Aucun devoir à exporter');
      return;
    }

    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const currentDate = new Date().toLocaleDateString('fr-FR');
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246);
      doc.text('School Manager', 14, 20);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Rapport des Devoirs', 14, 30);
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Généré le ${currentDate}`, 14, 37);

      const tableData = filteredAssignments.map((assignment: any) => {
        const submittedCount = assignment.students?.filter((s: any) => s.submitted).length || 0;
        const totalCount = assignment.students?.length || 0;
        const rate = totalCount > 0 ? ((submittedCount / totalCount) * 100).toFixed(1) : '0';
        return [
          assignment.title.substring(0, 30),
          assignment.course.name.substring(0, 20),
          (assignment.course.class?.name || 'N/A').substring(0, 15),
          `${assignment.teacher.user.firstName} ${assignment.teacher.user.lastName}`.substring(0, 20),
          format(new Date(assignment.dueDate), 'dd/MM/yyyy', { locale: fr }),
          `${submittedCount}/${totalCount}`,
          `${rate}%`,
        ];
      });

      const useAutoTable = (options: any) => {
        if (typeof (doc as any).autoTable === 'function') {
          (doc as any).autoTable(options);
        } else if (typeof autoTable === 'function') {
          autoTable(doc, options);
        } else {
          throw new Error('autoTable is not available');
        }
      };

      useAutoTable({
        head: [['Titre', 'Matière', 'Classe', 'Enseignant', 'Date d\'échéance', 'Soumissions', 'Taux']],
        body: tableData,
        startY: 45,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });

      doc.save(`devoirs_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Devoirs exportés en PDF avec succès !');
    } catch (error: any) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error(`Erreur lors de l'export PDF: ${error.message || 'Erreur inconnue'}`);
    }
  };

  const handleExportAssignments = (format: 'csv' | 'json' | 'pdf') => {
    switch (format) {
      case 'csv':
        exportAssignmentsToCSV();
        break;
      case 'json':
        exportAssignmentsToJSON();
        break;
      case 'pdf':
        exportAssignmentsToPDF();
        break;
    }
  };

  const tabs = attendanceModule
    ? [
        {
          id: 'absences' as ManagementTab,
          label: 'Absences & présences',
          icon: FiCalendar,
          color: 'from-orange-500 to-orange-600',
          count: absences?.length || 0,
        },
      ]
    : gradingModule
      ? [
          {
            id: 'grades' as ManagementTab,
            label: 'Notes par matière',
            icon: FiClipboard,
            color: 'from-blue-500 to-blue-600',
            count: grades?.length || 0,
          },
          {
            id: 'reportCards' as ManagementTab,
            label: 'Bulletins',
            icon: FiFileText,
            color: 'from-green-500 to-green-600',
            count: null,
          },
        ]
      : [
          {
            id: 'grades' as ManagementTab,
            label: 'Notes',
            icon: FiClipboard,
            color: 'from-blue-500 to-blue-600',
            count: grades?.length || 0,
          },
          {
            id: 'reportCards' as ManagementTab,
            label: 'Bulletins',
            icon: FiFileText,
            color: 'from-green-500 to-green-600',
            count: null,
          },
          {
            id: 'absences' as ManagementTab,
            label: 'Absences',
            icon: FiCalendar,
            color: 'from-orange-500 to-orange-600',
            count: absences?.length || 0,
          },
          {
            id: 'assignments' as ManagementTab,
            label: 'Devoirs',
            icon: FiUpload,
            color: 'from-purple-500 to-purple-600',
            count: assignments?.length || 0,
          },
        ];

  // Filter data based on search query
  const filteredGrades = grades?.filter((grade: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      grade.student.user.firstName.toLowerCase().includes(searchLower) ||
      grade.student.user.lastName.toLowerCase().includes(searchLower) ||
      grade.course.name.toLowerCase().includes(searchLower) ||
      grade.title.toLowerCase().includes(searchLower)
    );
  }) || [];

  const filteredAbsences = absences?.filter((absence: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      absence.student.user.firstName.toLowerCase().includes(searchLower) ||
      absence.student.user.lastName.toLowerCase().includes(searchLower) ||
      absence.course.name.toLowerCase().includes(searchLower)
    );
  }) || [];

  const filteredAssignments = assignments?.filter((assignment: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      assignment.title.toLowerCase().includes(searchLower) ||
      assignment.course.name.toLowerCase().includes(searchLower) ||
      assignment.course.class.name.toLowerCase().includes(searchLower)
    );
  }) || [];

  const getGradeColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-blue-600 bg-blue-100';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PRESENT: { label: 'Présent', color: 'bg-green-100 text-green-800' },
      ABSENT: { label: 'Absent', color: 'bg-red-100 text-red-800' },
      LATE: { label: 'Retard', color: 'bg-yellow-100 text-yellow-800' },
      EXCUSED: { label: 'Excusé', color: 'bg-blue-100 text-blue-800' },
    };
    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card
        className={
          attendanceModule
            ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white border-0'
            : gradingModule
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
        }
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black mb-2">
              {attendanceModule
                ? 'Suivi des absences & présences'
                : gradingModule
                  ? 'Saisie des notes & bulletins'
                  : 'Gestion Complète'}
            </h2>
            <p className="text-blue-100 text-lg">
              {attendanceModule
                ? 'Consultez les absences, justifications et exports pour votre établissement.'
                : gradingModule
                  ? 'Filtrez par classe et par matière, saisissez les évaluations et générez les bulletins PDF.'
                  : 'Centralisez toutes les données académiques en un seul endroit'}
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {!attendanceModule && (
              <div className="text-right">
                <div className="text-2xl font-bold">{grades?.length || 0}</div>
                <div className="text-sm text-blue-100">Notes</div>
              </div>
            )}
            {!gradingModule && (
              <>
                <div className="text-right">
                  <div className="text-2xl font-bold">{absences?.length || 0}</div>
                  <div className="text-sm text-blue-100">Absences</div>
                </div>
                {!attendanceModule && (
                  <div className="text-right">
                    <div className="text-2xl font-bold">{assignments?.length || 0}</div>
                    <div className="text-sm text-blue-100">Devoirs</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      {tabs.length > 1 && (
      <Card>
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105`
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span>{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {isActive && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Rechercher..."
            />
          </div>
          <FilterDropdown
            label="Classe"
            value={selectedClass}
            onChange={setSelectedClass}
            options={[
              { value: 'all', label: 'Toutes les classes' },
              ...(classes?.map((c: any) => ({ value: c.id, label: c.name })) || []),
            ]}
          />
          <FilterDropdown
            label="Matière"
            value={selectedCourse}
            onChange={setSelectedCourse}
            options={[
              { value: 'all', label: 'Toutes les matières' },
              ...(courses?.map((c: any) => ({ value: c.id, label: c.name })) || []),
            ]}
          />
        </div>
      </Card>

      {/* Content */}
      <div className="animate-slide-up">
        {activeTab === 'grades' && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Gestion des Notes</h3>
              <div className="flex items-center space-x-2">
                <Button onClick={() => setIsAddGradeModalOpen(true)}>
                  <FiPlus className="w-4 h-4 mr-2" />
                  Ajouter une note
                </Button>
                <div className="relative group">
                  <Button variant="outline">
                    <FiDownload className="w-4 h-4 mr-2" />
                    Exporter
                  </Button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleExportGrades('csv')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <FiFileText className="w-4 h-4 text-green-600" />
                        <span>Exporter en CSV</span>
                      </button>
                      <button
                        onClick={() => handleExportGrades('json')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <FiFileText className="w-4 h-4 text-blue-600" />
                        <span>Exporter en JSON</span>
                      </button>
                      <button
                        onClick={() => handleExportGrades('pdf')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <FiFileText className="w-4 h-4 text-red-600" />
                        <span>Exporter en PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {gradesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des notes...</p>
              </div>
            ) : filteredGrades.length === 0 ? (
              <div className="text-center py-12">
                <FiClipboard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucune note trouvée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Élève</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Classe</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Matière</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Évaluation</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Note</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Enseignant</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGrades.map((grade: any) => (
                      <tr key={grade.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <FiUser className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {grade.student.user.firstName} {grade.student.user.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className="bg-blue-100 text-blue-800">
                            {grade.student.class.name}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <FiBook className="w-4 h-4 text-gray-400" />
                            <span>{grade.course.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm">{grade.title}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getGradeColor(grade.score, grade.maxScore)}>
                            {grade.score.toFixed(2)} / {grade.maxScore}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {format(new Date(grade.date), 'dd/MM/yyyy', { locale: fr })}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {grade.teacher.user.firstName} {grade.teacher.user.lastName}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewGrade(grade.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Voir les détails"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedGradeId(grade.id);
                                setIsAddGradeModalOpen(true);
                              }}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'reportCards' && (
          <>
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Génération de Bulletins</h2>
                <p className="text-gray-600 mt-1">Générez les bulletins de notes pour une classe et une période</p>
              </div>
              <Button onClick={() => setIsGenerateReportCardModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                <FiFileText className="w-5 h-5 mr-2" />
                Générer des bulletins
              </Button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <FiAlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium mb-1">Informations</p>
                  <p className="text-sm text-blue-700">
                    La génération de bulletins permet de créer des bulletins PDF pour tous les élèves d'une classe.
                    Les moyennes sont calculées automatiquement à partir des notes de la période sélectionnée.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Bulletins récents</h3>
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Trimestre 1 - 2024</p>
                      <p className="text-sm text-gray-600">Généré le 15/01/2024</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <FiDownload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Trimestre 2 - 2024</p>
                      <p className="text-sm text-gray-600">Généré le 15/04/2024</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <FiDownload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="md:col-span-2">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Statistiques des Bulletins</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">156</div>
                  <div className="text-sm text-gray-600">Bulletins générés</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">12.5</div>
                  <div className="text-sm text-gray-600">Moyenne générale</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">45%</div>
                  <div className="text-sm text-gray-600">Taux de réussite</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">23</div>
                  <div className="text-sm text-gray-600">Mentions</div>
                </div>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'absences' && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Gestion des Absences</h3>
              <div className="flex items-center space-x-2">
                <Button onClick={() => setIsAddAbsenceModalOpen(true)}>
                  <FiPlus className="w-4 h-4 mr-2" />
                  Ajouter une absence
                </Button>
                <div className="relative">
                  <Button variant="outline" onClick={() => {
                    const menu = document.getElementById('export-absences-menu');
                    menu?.classList.toggle('hidden');
                  }}>
                    <FiDownload className="w-4 h-4 mr-2" />
                    Exporter
                  </Button>
                  <div id="export-absences-menu" className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={() => {
                        handleExportAbsences('csv');
                        document.getElementById('export-absences-menu')?.classList.add('hidden');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <FiFileText className="w-4 h-4 text-green-600" />
                      <span>Exporter en CSV</span>
                    </button>
                    <button
                      onClick={() => {
                        handleExportAbsences('json');
                        document.getElementById('export-absences-menu')?.classList.add('hidden');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <FiFileText className="w-4 h-4 text-blue-600" />
                      <span>Exporter en JSON</span>
                    </button>
                    <button
                      onClick={() => {
                        handleExportAbsences('pdf');
                        document.getElementById('export-absences-menu')?.classList.add('hidden');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <FiFileText className="w-4 h-4 text-red-600" />
                      <span>Exporter en PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {absencesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des absences...</p>
              </div>
            ) : filteredAbsences.length === 0 ? (
              <div className="text-center py-12">
                <FiCalendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucune absence trouvée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Élève</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Classe</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Matière</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Justifié</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Enseignant</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAbsences.map((absence: any) => (
                      <tr key={absence.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <FiUser className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {absence.student.user.firstName} {absence.student.user.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className="bg-blue-100 text-blue-800">
                            {absence.student.class.name}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <FiBook className="w-4 h-4 text-gray-400" />
                            <span>{absence.course.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {format(new Date(absence.date), 'dd/MM/yyyy', { locale: fr })}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(absence.status)}
                        </td>
                        <td className="py-3 px-4">
                          {absence.excused ? (
                            <Badge className="bg-green-100 text-green-800">
                              <FiCheckCircle className="w-3 h-3 mr-1 inline" />
                              Oui
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <FiXCircle className="w-3 h-3 mr-1 inline" />
                              Non
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {absence.teacher.user.firstName} {absence.teacher.user.lastName}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewAbsence(absence.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Voir les détails"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditAbsence(absence.id)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAbsence(absence.id, `${absence.student.user.firstName} ${absence.student.user.lastName}`)}
                              disabled={deleteAbsenceMutation.isPending}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Supprimer"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'assignments' && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Gestion des Devoirs</h3>
              <div className="flex items-center space-x-2">
                <Button onClick={() => setIsAddAssignmentModalOpen(true)}>
                  <FiPlus className="w-4 h-4 mr-2" />
                  Ajouter un devoir
                </Button>
                <div className="relative">
                  <Button variant="outline" onClick={() => {
                    const menu = document.getElementById('export-assignments-menu');
                    menu?.classList.toggle('hidden');
                  }}>
                    <FiDownload className="w-4 h-4 mr-2" />
                    Exporter
                  </Button>
                  <div id="export-assignments-menu" className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={() => {
                        handleExportAssignments('csv');
                        document.getElementById('export-assignments-menu')?.classList.add('hidden');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <FiFileText className="w-4 h-4 text-green-600" />
                      <span>Exporter en CSV</span>
                    </button>
                    <button
                      onClick={() => {
                        handleExportAssignments('json');
                        document.getElementById('export-assignments-menu')?.classList.add('hidden');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <FiFileText className="w-4 h-4 text-blue-600" />
                      <span>Exporter en JSON</span>
                    </button>
                    <button
                      onClick={() => {
                        handleExportAssignments('pdf');
                        document.getElementById('export-assignments-menu')?.classList.add('hidden');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <FiFileText className="w-4 h-4 text-red-600" />
                      <span>Exporter en PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {assignmentsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des devoirs...</p>
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="text-center py-12">
                <FiUpload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucun devoir trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAssignments.map((assignment: any) => {
                  const submittedCount = assignment.students?.filter((s: any) => s.submitted).length || 0;
                  const totalCount = assignment.students?.length || 0;
                  const isOverdue = new Date(assignment.dueDate) < new Date();
                  
                  return (
                    <Card key={assignment.id} className={`hover:shadow-lg transition-shadow ${isOverdue ? 'border-2 border-red-200' : ''}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-1">{assignment.title}</h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <FiBook className="w-4 h-4" />
                            <span>{assignment.course.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                            <Badge className="bg-blue-100 text-blue-800">
                              {assignment.course.class.name}
                            </Badge>
                          </div>
                        </div>
                        {isOverdue && (
                          <Badge className="bg-red-100 text-red-800">
                            <FiAlertCircle className="w-3 h-3 mr-1 inline" />
                            Échu
                          </Badge>
                        )}
                      </div>
                      
                      {assignment.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{assignment.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <FiClock className="w-4 h-4" />
                          <span>Échéance: {format(new Date(assignment.dueDate), 'dd/MM/yyyy', { locale: fr })}</span>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Soumissions</span>
                          <span>{submittedCount} / {totalCount}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${totalCount > 0 ? (submittedCount / totalCount) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleViewAssignment(assignment.id)}
                        >
                          <FiEye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditAssignment(assignment.id)}
                        >
                          <FiEdit className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id, assignment.title)}
                          disabled={deleteAssignmentMutation.isPending}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Supprimer"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Modals */}
      <AddGradeModal
        isOpen={isAddGradeModalOpen}
        onClose={() => {
          setIsAddGradeModalOpen(false);
          setSelectedGradeId(null);
        }}
        gradeId={selectedGradeId}
      />

      {/* Grade Details Modal */}
      {selectedGradeId && (
        <GradeDetailsModal
          isOpen={isGradeDetailsModalOpen}
          onClose={() => {
            setIsGradeDetailsModalOpen(false);
            setSelectedGradeId(null);
          }}
          gradeId={selectedGradeId}
          onEdit={() => {
            setIsGradeDetailsModalOpen(false);
            setIsAddGradeModalOpen(true);
          }}
        />
      )}

      {/* Absence Modals */}
      <AddAbsenceModal
        isOpen={isAddAbsenceModalOpen}
        onClose={() => {
          setIsAddAbsenceModalOpen(false);
          setSelectedAbsenceId(null);
        }}
        absenceId={selectedAbsenceId}
      />
      {selectedAbsenceId && (
        <AbsenceDetailsModal
          isOpen={isAbsenceDetailsModalOpen}
          onClose={() => {
            setIsAbsenceDetailsModalOpen(false);
            setSelectedAbsenceId(null);
          }}
          absenceId={selectedAbsenceId}
          onEdit={() => {
            setIsAbsenceDetailsModalOpen(false);
            setIsAddAbsenceModalOpen(true);
          }}
        />
      )}

      {/* Report Card Modal */}
      <GenerateReportCardModal
        isOpen={isGenerateReportCardModalOpen}
        onClose={() => setIsGenerateReportCardModalOpen(false)}
      />

      {/* Assignment Modals */}
      <AddAssignmentModal
        isOpen={isAddAssignmentModalOpen}
        onClose={() => {
          setIsAddAssignmentModalOpen(false);
          setSelectedAssignmentId(null);
        }}
        assignmentId={selectedAssignmentId}
      />
      {selectedAssignmentId && (
        <AssignmentDetailsModal
          isOpen={isAssignmentDetailsModalOpen}
          onClose={() => {
            setIsAssignmentDetailsModalOpen(false);
            setSelectedAssignmentId(null);
          }}
          assignmentId={selectedAssignmentId}
          onEdit={() => {
            setIsAssignmentDetailsModalOpen(false);
            setIsAddAssignmentModalOpen(true);
          }}
        />
      )}
    </div>
  );
};

export default CompleteManagement;

