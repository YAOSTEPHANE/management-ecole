import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import StudentsList from './StudentsList';
import ClassesList from './ClassesList';
import TeachersList from './TeachersList';
import AddStudentModal from './AddStudentModal';
import AddClassModal from './AddClassModal';
import AddTeacherModal from './AddTeacherModal';
import {
  FiUsers,
  FiBook,
  FiUserCheck,
  FiPlus,
  FiBarChart,
  FiTrendingUp,
  FiFileText,
  FiDownload,
  FiSearch,
  FiFilter,
  FiBriefcase,
  FiAward,
  FiCalendar,
  FiMail,
  FiPhone,
  FiMapPin,
} from 'react-icons/fi';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

type AdminTab = 'overview' | 'students' | 'classes' | 'teachers' | 'reports';

const AdministrativeManagement = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);

  // Fetch data
  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminApi.getDashboard,
  });

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: adminApi.getStudents,
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: adminApi.getClasses,
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: adminApi.getTeachers,
  });

  const tabs = [
    { id: 'overview' as AdminTab, label: 'Vue d\'ensemble', icon: FiBarChart },
    { id: 'students' as AdminTab, label: 'Élèves', icon: FiUsers },
    { id: 'classes' as AdminTab, label: 'Classes', icon: FiBook },
    { id: 'teachers' as AdminTab, label: 'Enseignants', icon: FiUserCheck },
    { id: 'reports' as AdminTab, label: 'Rapports', icon: FiFileText },
  ];

  // Export functions for Students
  const exportStudentsToCSV = () => {
    try {
      const headers = ['ID', 'Nom', 'Prénom', 'Email', 'Téléphone', 'Classe', 'Niveau', 'Année scolaire'];
      const csvContent =
        '\ufeff' + // BOM for UTF-8
        '# School Manager - Rapport des Élèves\n' +
        `# Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}\n` +
        '#\n' +
        headers.join(';') +
        '\n' +
        (students || [])
          .map((s: any) =>
            [
              s.studentId || s.id,
              s.user?.lastName || 'N/A',
              s.user?.firstName || 'N/A',
              s.user?.email || 'N/A',
              s.user?.phone || 'N/A',
              s.class?.name || 'N/A',
              s.class?.level || 'N/A',
              s.class?.academicYear || 'N/A',
            ].join(';')
          )
          .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `rapport-eleves-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Rapport des élèves exporté en CSV avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  const exportStudentsToJSON = () => {
    try {
      const jsonData = {
        application: 'School Manager',
        logo: 'SM',
        dateExport: format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr }),
        total: students?.length || 0,
        élèves: (students || []).map((s: any) => ({
          id: s.id,
          studentId: s.studentId,
          nom: s.user?.lastName,
          prénom: s.user?.firstName,
          email: s.user?.email,
          téléphone: s.user?.phone,
          classe: s.class?.name,
          niveau: s.class?.level,
          annéeScolaire: s.class?.academicYear,
          dateNaissance: s.dateOfBirth,
          adresse: s.address,
        })),
      };

      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `rapport-eleves-${format(new Date(), 'yyyy-MM-dd')}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Rapport des élèves exporté en JSON avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export JSON:', error);
      toast.error('Erreur lors de l\'export JSON');
    }
  };

  const exportStudentsToPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const currentDate = new Date().toLocaleDateString('fr-FR');

      // Logo textuel stylisé
      doc.setFillColor(59, 130, 246);
      doc.roundedRect(14, 10, 40, 12, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SM', 34, 18, { align: 'center' });
      
      // Titre
      doc.setTextColor(59, 130, 246);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('School Manager', 60, 18);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text('Rapport des Élèves', 60, 25);
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Généré le ${currentDate}`, 60, 30);

      const useAutoTable = (options: any) => {
        if (typeof (doc as any).autoTable === 'function') {
          (doc as any).autoTable(options);
        } else if (typeof autoTable === 'function') {
          autoTable(doc, options);
        } else {
          throw new Error('autoTable is not available');
        }
      };

      const tableData = (students || []).map((s: any) => [
        s.studentId || s.id,
        `${s.user?.firstName || ''} ${s.user?.lastName || ''}`,
        s.user?.email || 'N/A',
        s.class?.name || 'N/A',
        s.class?.level || 'N/A',
      ]);

      useAutoTable({
        startY: 38,
        head: [['ID', 'Nom complet', 'Email', 'Classe', 'Niveau']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });

      doc.save(`rapport-eleves-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Rapport des élèves exporté en PDF avec succès !');
    } catch (error: any) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error(`Erreur lors de l'export PDF: ${error.message || 'Erreur inconnue'}`);
    }
  };

  // Export functions for Classes
  const exportClassesToCSV = () => {
    try {
      const headers = ['Nom', 'Niveau', 'Année scolaire', 'Nombre d\'élèves', 'Enseignant principal'];
      const csvContent =
        '\ufeff' +
        '# School Manager - Rapport des Classes\n' +
        `# Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}\n` +
        '#\n' +
        headers.join(';') +
        '\n' +
        (classes || [])
          .map((c: any) =>
            [
              c.name,
              c.level || 'N/A',
              c.academicYear || 'N/A',
              c._count?.students || 0,
              c.teacher?.user ? `${c.teacher.user.firstName} ${c.teacher.user.lastName}` : 'N/A',
            ].join(';')
          )
          .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `rapport-classes-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Rapport des classes exporté en CSV avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  const exportClassesToJSON = () => {
    try {
      const jsonData = {
        application: 'School Manager',
        logo: 'SM',
        dateExport: format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr }),
        total: classes?.length || 0,
        classes: (classes || []).map((c: any) => ({
          nom: c.name,
          niveau: c.level,
          annéeScolaire: c.academicYear,
          nombreÉlèves: c._count?.students || 0,
          enseignantPrincipal: c.teacher?.user
            ? `${c.teacher.user.firstName} ${c.teacher.user.lastName}`
            : null,
        })),
      };

      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `rapport-classes-${format(new Date(), 'yyyy-MM-dd')}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Rapport des classes exporté en JSON avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export JSON:', error);
      toast.error('Erreur lors de l\'export JSON');
    }
  };

  const exportClassesToPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const currentDate = new Date().toLocaleDateString('fr-FR');

      // Logo textuel stylisé
      doc.setFillColor(139, 92, 246);
      doc.roundedRect(14, 10, 40, 12, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SM', 34, 18, { align: 'center' });
      
      // Titre
      doc.setTextColor(139, 92, 246);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('School Manager', 60, 18);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text('Rapport des Classes', 60, 25);
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Généré le ${currentDate}`, 60, 30);

      const useAutoTable = (options: any) => {
        if (typeof (doc as any).autoTable === 'function') {
          (doc as any).autoTable(options);
        } else if (typeof autoTable === 'function') {
          autoTable(doc, options);
        } else {
          throw new Error('autoTable is not available');
        }
      };

      const tableData = (classes || []).map((c: any) => [
        c.name,
        c.level || 'N/A',
        c.academicYear || 'N/A',
        c._count?.students || 0,
        c.teacher?.user ? `${c.teacher.user.firstName} ${c.teacher.user.lastName}` : 'N/A',
      ]);

      useAutoTable({
        startY: 38,
        head: [['Nom', 'Niveau', 'Année scolaire', 'Nombre d\'élèves', 'Enseignant principal']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });

      doc.save(`rapport-classes-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Rapport des classes exporté en PDF avec succès !');
    } catch (error: any) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error(`Erreur lors de l'export PDF: ${error.message || 'Erreur inconnue'}`);
    }
  };

  // Export functions for Teachers
  const exportTeachersToCSV = () => {
    try {
      const headers = ['Nom', 'Prénom', 'Email', 'Téléphone', 'Spécialité', 'Classes assignées'];
      const csvContent =
        '\ufeff' +
        '# School Manager - Rapport du Personnel\n' +
        `# Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}\n` +
        '#\n' +
        headers.join(';') +
        '\n' +
        (teachers || [])
          .map((t: any) =>
            [
              t.user?.lastName || 'N/A',
              t.user?.firstName || 'N/A',
              t.user?.email || 'N/A',
              t.user?.phone || 'N/A',
              t.specialization || 'N/A',
              t.classes?.map((c: any) => c.name).join(', ') || 'Aucune',
            ].join(';')
          )
          .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `rapport-enseignants-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Rapport des enseignants exporté en CSV avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  const exportTeachersToJSON = () => {
    try {
      const jsonData = {
        application: 'School Manager',
        logo: 'SM',
        dateExport: format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr }),
        total: teachers?.length || 0,
        enseignants: (teachers || []).map((t: any) => ({
          nom: t.user?.lastName,
          prénom: t.user?.firstName,
          email: t.user?.email,
          téléphone: t.user?.phone,
          spécialité: t.specialization,
          classesAssignées: t.classes?.map((c: any) => c.name) || [],
        })),
      };

      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `rapport-enseignants-${format(new Date(), 'yyyy-MM-dd')}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Rapport des enseignants exporté en JSON avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export JSON:', error);
      toast.error('Erreur lors de l\'export JSON');
    }
  };

  const exportTeachersToPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const currentDate = new Date().toLocaleDateString('fr-FR');

      // Logo textuel stylisé
      doc.setFillColor(99, 102, 241);
      doc.roundedRect(14, 10, 40, 12, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SM', 34, 18, { align: 'center' });
      
      // Titre
      doc.setTextColor(99, 102, 241);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('School Manager', 60, 18);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text('Rapport du Personnel', 60, 25);
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Généré le ${currentDate}`, 60, 30);

      const useAutoTable = (options: any) => {
        if (typeof (doc as any).autoTable === 'function') {
          (doc as any).autoTable(options);
        } else if (typeof autoTable === 'function') {
          autoTable(doc, options);
        } else {
          throw new Error('autoTable is not available');
        }
      };

      const tableData = (teachers || []).map((t: any) => [
        `${t.user?.firstName || ''} ${t.user?.lastName || ''}`,
        t.user?.email || 'N/A',
        t.specialization || 'N/A',
        t.classes?.map((c: any) => c.name).join(', ') || 'Aucune',
      ]);

      useAutoTable({
        startY: 38,
        head: [['Nom complet', 'Email', 'Spécialité', 'Classes assignées']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });

      doc.save(`rapport-enseignants-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Rapport des enseignants exporté en PDF avec succès !');
    } catch (error: any) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error(`Erreur lors de l'export PDF: ${error.message || 'Erreur inconnue'}`);
    }
  };

  // Export functions for Global Report
  const exportGlobalToCSV = () => {
    try {
      const csvContent =
        '\ufeff' +
        '# School Manager - Rapport Global Administratif\n' +
        `# Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}\n` +
        '#\n' +
        '=== RAPPORT GLOBAL ADMINISTRATIF ===\n' +
        `Date: ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}\n\n` +
        '=== ÉLÈVES ===\n' +
        'ID;Nom;Prénom;Email;Téléphone;Classe;Niveau\n' +
        (students || [])
          .map((s: any) =>
            [
              s.studentId || s.id,
              s.user?.lastName || 'N/A',
              s.user?.firstName || 'N/A',
              s.user?.email || 'N/A',
              s.user?.phone || 'N/A',
              s.class?.name || 'N/A',
              s.class?.level || 'N/A',
            ].join(';')
          )
          .join('\n') +
        '\n\n=== CLASSES ===\n' +
        'Nom;Niveau;Année scolaire;Nombre d\'élèves\n' +
        (classes || [])
          .map((c: any) =>
            [c.name, c.level || 'N/A', c.academicYear || 'N/A', c._count?.students || 0].join(';')
          )
          .join('\n') +
        '\n\n=== ENSEIGNANTS ===\n' +
        'Nom;Prénom;Email;Spécialité\n' +
        (teachers || [])
          .map((t: any) =>
            [
              t.user?.lastName || 'N/A',
              t.user?.firstName || 'N/A',
              t.user?.email || 'N/A',
              t.specialization || 'N/A',
            ].join(';')
          )
          .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `rapport-global-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Rapport global exporté en CSV avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  const exportGlobalToJSON = () => {
    try {
      const jsonData = {
        application: 'School Manager',
        logo: 'SM',
        dateExport: format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr }),
        statistiques: {
          totalÉlèves: students?.length || 0,
          totalClasses: classes?.length || 0,
          totalEnseignants: teachers?.length || 0,
        },
        élèves: (students || []).map((s: any) => ({
          id: s.id,
          studentId: s.studentId,
          nom: s.user?.lastName,
          prénom: s.user?.firstName,
          email: s.user?.email,
          classe: s.class?.name,
        })),
        classes: (classes || []).map((c: any) => ({
          nom: c.name,
          niveau: c.level,
          annéeScolaire: c.academicYear,
          nombreÉlèves: c._count?.students || 0,
        })),
        enseignants: (teachers || []).map((t: any) => ({
          nom: t.user?.lastName,
          prénom: t.user?.firstName,
          email: t.user?.email,
          spécialité: t.specialization,
        })),
      };

      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `rapport-global-${format(new Date(), 'yyyy-MM-dd')}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Rapport global exporté en JSON avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export JSON:', error);
      toast.error('Erreur lors de l\'export JSON');
    }
  };

  const exportGlobalToPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const currentDate = new Date().toLocaleDateString('fr-FR');

      // Logo textuel stylisé
      doc.setFillColor(139, 92, 246);
      doc.roundedRect(14, 10, 40, 12, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SM', 34, 18, { align: 'center' });
      
      // Titre
      doc.setTextColor(139, 92, 246);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('School Manager', 60, 18);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text('Rapport Global Administratif', 60, 25);
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Généré le ${currentDate}`, 60, 30);

      const useAutoTable = (options: any) => {
        if (typeof (doc as any).autoTable === 'function') {
          (doc as any).autoTable(options);
        } else if (typeof autoTable === 'function') {
          autoTable(doc, options);
        } else {
          throw new Error('autoTable is not available');
        }
      };

      // Statistiques
      let yPos = 38;
      doc.setFontSize(14);
      doc.text('Statistiques', 14, yPos);
      yPos += 10;
      const statsData = [
        ['Total Élèves', stats?.totalStudents || 0],
        ['Total Classes', stats?.totalClasses || 0],
        ['Total Enseignants', stats?.totalTeachers || 0],
      ];
      useAutoTable({
        startY: yPos,
        head: [['Indicateur', 'Valeur']],
        body: statsData,
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 14, right: 14 },
      });

      // Élèves
      yPos = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(14);
      doc.text('Élèves', 14, yPos);
      yPos += 10;
      const studentsData = (students || []).slice(0, 20).map((s: any) => [
        s.studentId || s.id,
        `${s.user?.firstName || ''} ${s.user?.lastName || ''}`,
        s.class?.name || 'N/A',
      ]);
      useAutoTable({
        startY: yPos,
        head: [['ID', 'Nom complet', 'Classe']],
        body: studentsData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });

      // Classes
      yPos = (doc as any).lastAutoTable.finalY + 20;
      if (yPos > 180) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.text('Classes', 14, yPos);
      yPos += 10;
      const classesData = (classes || []).map((c: any) => [
        c.name,
        c.level || 'N/A',
        c._count?.students || 0,
      ]);
      useAutoTable({
        startY: yPos,
        head: [['Nom', 'Niveau', 'Nombre d\'élèves']],
        body: classesData,
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });

      // Enseignants
      yPos = (doc as any).lastAutoTable.finalY + 20;
      if (yPos > 180) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.text('Enseignants', 14, yPos);
      yPos += 10;
      const teachersData = (teachers || []).map((t: any) => [
        `${t.user?.firstName || ''} ${t.user?.lastName || ''}`,
        t.specialization || 'N/A',
      ]);
      useAutoTable({
        startY: yPos,
        head: [['Nom complet', 'Spécialité']],
        body: teachersData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });

      doc.save(`rapport-global-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Rapport global exporté en PDF avec succès !');
    } catch (error: any) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error(`Erreur lors de l'export PDF: ${error.message || 'Erreur inconnue'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black mb-2">Gestion Administrative</h2>
            <p className="text-indigo-100 text-lg">
              Gérez les inscriptions, le personnel et les ressources de l'établissement
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
              <div className="text-sm text-indigo-100">Élèves</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats?.totalTeachers || 0}</div>
              <div className="text-sm text-indigo-100">Enseignants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
              <div className="text-sm text-indigo-100">Classes</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
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
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span>{tab.label}</span>
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Content */}
      <div className="animate-slide-up">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Élèves</p>
                    <p className="text-3xl font-bold text-blue-600">{stats?.totalStudents || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats?.activeStudents || 0} actifs
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
                    <FiUsers className="w-8 h-8 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Classes</p>
                    <p className="text-3xl font-bold text-purple-600">{stats?.totalClasses || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Classes actives</p>
                  </div>
                  <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center">
                    <FiBook className="w-8 h-8 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Enseignants</p>
                    <p className="text-3xl font-bold text-indigo-600">{stats?.totalTeachers || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Personnel actif</p>
                  </div>
                  <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <FiUserCheck className="w-8 h-8 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Parents</p>
                    <p className="text-3xl font-bold text-green-600">{stats?.totalParents || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Comptes parents</p>
                  </div>
                  <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center">
                    <FiUsers className="w-8 h-8 text-white" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Actions rapides */}
            <Card>
              <h3 className="text-xl font-bold text-gray-800 mb-6">Actions Rapides</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setIsAddStudentModalOpen(true)}
                  className="group p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl hover:border-green-400 hover:shadow-lg transition-all duration-300 text-left"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FiUsers className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-800">Ajouter un élève</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Enregistrer un nouvel élève dans le système
                  </p>
                </button>

                <button
                  onClick={() => setIsAddClassModalOpen(true)}
                  className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all duration-300 text-left"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FiBook className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-800">Créer une classe</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Créer une nouvelle classe et assigner un enseignant
                  </p>
                </button>

                <button
                  onClick={() => setIsAddTeacherModalOpen(true)}
                  className="group p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-xl hover:border-indigo-400 hover:shadow-lg transition-all duration-300 text-left"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FiUserCheck className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-800">Ajouter un enseignant</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Enregistrer un nouvel enseignant dans le système
                  </p>
                </button>
              </div>
            </Card>

            {/* Résumé récent */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Élèves récemment ajoutés</h3>
                {students && students.length > 0 ? (
                  <div className="space-y-3">
                    {students.slice(0, 5).map((student: any) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <FiUsers className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {student.user.firstName} {student.user.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{student.studentId}</p>
                          </div>
                        </div>
                        {student.class && (
                          <Badge className="bg-blue-100 text-blue-800">
                            {student.class.name}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Aucun élève enregistré</p>
                )}
              </Card>

              <Card>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Classes récemment créées</h3>
                {classes && classes.length > 0 ? (
                  <div className="space-y-3">
                    {classes.slice(0, 5).map((cls: any) => (
                      <div
                        key={cls.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <FiBook className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{cls.name}</p>
                            <p className="text-xs text-gray-500">{cls.level} - {cls.academicYear}</p>
                          </div>
                        </div>
                        <Badge className="bg-indigo-100 text-indigo-800">
                          {cls._count?.students || 0} élèves
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Aucune classe créée</p>
                )}
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Gestion des Élèves</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportStudentsToCSV()}
                    className="flex items-center gap-2"
                  >
                    <FiDownload className="w-4 h-4" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportStudentsToJSON()}
                    className="flex items-center gap-2"
                  >
                    <FiDownload className="w-4 h-4" />
                    JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportStudentsToPDF()}
                    className="flex items-center gap-2"
                  >
                    <FiDownload className="w-4 h-4" />
                    PDF
                  </Button>
                </div>
              </div>
            </Card>
            <StudentsList searchQuery={searchQuery} />
          </div>
        )}
        {activeTab === 'classes' && (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Gestion des Classes</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportClassesToCSV()}
                    className="flex items-center gap-2"
                  >
                    <FiDownload className="w-4 h-4" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportClassesToJSON()}
                    className="flex items-center gap-2"
                  >
                    <FiDownload className="w-4 h-4" />
                    JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportClassesToPDF()}
                    className="flex items-center gap-2"
                  >
                    <FiDownload className="w-4 h-4" />
                    PDF
                  </Button>
                </div>
              </div>
            </Card>
            <ClassesList searchQuery={searchQuery} />
          </div>
        )}
        {activeTab === 'teachers' && (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Gestion des Enseignants</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportTeachersToCSV()}
                    className="flex items-center gap-2"
                  >
                    <FiDownload className="w-4 h-4" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportTeachersToJSON()}
                    className="flex items-center gap-2"
                  >
                    <FiDownload className="w-4 h-4" />
                    JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportTeachersToPDF()}
                    className="flex items-center gap-2"
                  >
                    <FiDownload className="w-4 h-4" />
                    PDF
                  </Button>
                </div>
              </div>
            </Card>
            <TeachersList searchQuery={searchQuery} />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-xl font-bold text-gray-800 mb-6">Rapports Administratifs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Rapport des Élèves */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover:shadow-xl transition-all">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
                      <FiUsers className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 mb-1">Rapport des Élèves</h4>
                      <p className="text-sm text-gray-600">Liste complète des élèves</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => exportStudentsToCSV()}
                    className="flex-1 min-w-[100px]"
                  >
                    <FiDownload className="w-4 h-4 mr-2" />
                    <span>CSV</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => exportStudentsToJSON()}
                    className="flex-1 min-w-[100px]"
                  >
                    <FiDownload className="w-4 h-4 mr-2" />
                    <span>JSON</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => exportStudentsToPDF()}
                    className="flex-1 min-w-[100px]"
                  >
                    <FiDownload className="w-4 h-4 mr-2" />
                    <span>PDF</span>
                  </Button>
                  </div>
                </Card>

                {/* Rapport des Classes */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 hover:shadow-xl transition-all">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center">
                      <FiBook className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 mb-1">Rapport des Classes</h4>
                      <p className="text-sm text-gray-600">Statistiques par classe</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => exportClassesToCSV()}
                      className="flex-1 min-w-[100px]"
                    >
                      <FiDownload className="w-4 h-4 mr-2" />
                      <span>CSV</span>
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => exportClassesToJSON()}
                      className="flex-1 min-w-[100px]"
                    >
                      <FiDownload className="w-4 h-4 mr-2" />
                      <span>JSON</span>
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => exportClassesToPDF()}
                      className="flex-1 min-w-[100px]"
                    >
                      <FiDownload className="w-4 h-4 mr-2" />
                      <span>PDF</span>
                    </Button>
                  </div>
                </Card>

                {/* Rapport du Personnel */}
                <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 hover:shadow-xl transition-all">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center">
                      <FiUserCheck className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 mb-1">Rapport du Personnel</h4>
                      <p className="text-sm text-gray-600">Liste des enseignants</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => exportTeachersToCSV()}
                      className="flex-1 min-w-[100px]"
                    >
                      <FiDownload className="w-4 h-4 mr-2" />
                      <span>CSV</span>
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => exportTeachersToJSON()}
                      className="flex-1 min-w-[100px]"
                    >
                      <FiDownload className="w-4 h-4 mr-2" />
                      <span>JSON</span>
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => exportTeachersToPDF()}
                      className="flex-1 min-w-[100px]"
                    >
                      <FiDownload className="w-4 h-4 mr-2" />
                      <span>PDF</span>
                    </Button>
                  </div>
                </Card>
              </div>
            </Card>

            {/* Rapport global */}
            <Card>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Rapport Global</h3>
              <p className="text-gray-600 mb-4">
                Exportez toutes les données administratives en un seul fichier
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => exportGlobalToCSV()}
                  className="flex-1"
                >
                  <FiDownload className="w-4 h-4 mr-2" />
                  Exporter tout en CSV
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => exportGlobalToJSON()}
                  className="flex-1"
                >
                  <FiDownload className="w-4 h-4 mr-2" />
                  Exporter tout en JSON
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => exportGlobalToPDF()}
                  className="flex-1"
                >
                  <FiDownload className="w-4 h-4 mr-2" />
                  Exporter tout en PDF
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
      />
      <AddClassModal
        isOpen={isAddClassModalOpen}
        onClose={() => setIsAddClassModalOpen(false)}
      />
      <AddTeacherModal
        isOpen={isAddTeacherModalOpen}
        onClose={() => setIsAddTeacherModalOpen(false)}
      />
    </div>
  );
};

export default AdministrativeManagement;

