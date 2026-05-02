import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import SearchBar from '../ui/SearchBar';
import FilterDropdown from '../ui/FilterDropdown';
import toast from 'react-hot-toast';
import {
  FiShield,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiUser,
  FiGlobe,
  FiDatabase,
  FiKey,
  FiRefreshCw,
  FiDownload,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiEdit,
  FiUnlock,
  FiLock as FiLockIcon,
  FiFileText,
  FiBarChart,
  FiActivity,
} from 'react-icons/fi';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

type SecurityTab = 'overview' | 'login-logs' | 'security-events' | 'users' | 'privacy' | 'compliance';

const SecurityPrivacyManagement = () => {
  const [activeTab, setActiveTab] = useState<SecurityTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEventDetailsModalOpen, setIsEventDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isLogDetailsModalOpen, setIsLogDetailsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch data
  const { data: securityStats } = useQuery({
    queryKey: ['admin-security-stats'],
    queryFn: adminApi.getSecurityStats,
  });

  const { data: loginLogs } = useQuery({
    queryKey: ['admin-login-logs'],
    queryFn: () => adminApi.getLoginLogs({ limit: 50 }),
  });

  const { data: securityEvents } = useQuery({
    queryKey: ['admin-security-events', selectedSeverity],
    queryFn: () =>
      adminApi.getSecurityEvents({
        ...(selectedSeverity !== 'all' && { severity: selectedSeverity }),
        limit: 50,
      }),
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.getAllUsers(),
  });

  // Mutations
  const changePasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      adminApi.changeUserPassword(userId, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-security-events'] });
      toast.success('Mot de passe modifié avec succès');
      setIsPasswordModalOpen(false);
      setSelectedUser(null);
      setNewPassword('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification du mot de passe');
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminApi.changeUserStatus(userId, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-security-events'] });
      toast.success(`Compte ${variables.isActive ? 'activé' : 'désactivé'} avec succès`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification du statut');
    },
  });

  const tabs = [
    { id: 'overview' as SecurityTab, label: 'Vue d\'ensemble', icon: FiBarChart },
    { id: 'login-logs' as SecurityTab, label: 'Logs de Connexion', icon: FiActivity },
    { id: 'security-events' as SecurityTab, label: 'Événements Sécurité', icon: FiShield },
    { id: 'users' as SecurityTab, label: 'Gestion Utilisateurs', icon: FiUser },
    { id: 'privacy' as SecurityTab, label: 'Confidentialité', icon: FiLock },
    { id: 'compliance' as SecurityTab, label: 'Conformité', icon: FiCheckCircle },
  ];

  const filteredLoginLogs = loginLogs?.filter((log: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      log.email.toLowerCase().includes(searchLower) ||
      log.user?.firstName?.toLowerCase().includes(searchLower) ||
      log.user?.lastName?.toLowerCase().includes(searchLower) ||
      log.ipAddress?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const filteredSecurityEvents = securityEvents?.filter((event: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      event.description.toLowerCase().includes(searchLower) ||
      event.user?.email?.toLowerCase().includes(searchLower) ||
      event.type.toLowerCase().includes(searchLower) ||
      event.ipAddress?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const filteredUsers = users?.filter((user: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower)
    );
  }) || [];

  const getSeverityBadge = (severity: string) => {
    const severityMap: Record<string, { label: string; color: string }> = {
      info: { label: 'Info', color: 'bg-blue-100 text-blue-800' },
      warning: { label: 'Avertissement', color: 'bg-yellow-100 text-yellow-800' },
      error: { label: 'Erreur', color: 'bg-orange-100 text-orange-800' },
      critical: { label: 'Critique', color: 'bg-red-100 text-red-800' },
    };
    const severityInfo = severityMap[severity] || { label: severity, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={severityInfo.color}>{severityInfo.label}</Badge>;
  };

  const handleChangePassword = () => {
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    changePasswordMutation.mutate({ userId: selectedUser.id, password: newPassword });
  };

  // Export functions for Login Logs
  const exportLoginLogsToCSV = () => {
    try {
      const headers = ['Utilisateur', 'Email', 'Statut', 'Adresse IP', 'Date', 'Raison'];
      const csvContent =
        '\ufeff' +
        '# School Manager - Logs de Connexion\n' +
        `# Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}\n` +
        '#\n' +
        headers.join(';') +
        '\n' +
        (filteredLoginLogs || [])
          .map((log: any) =>
            [
              log.user ? `${log.user.firstName} ${log.user.lastName}` : 'N/A',
              log.email || 'N/A',
              log.success ? 'Réussi' : 'Échoué',
              log.ipAddress || 'N/A',
              format(new Date(log.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr }),
              log.reason || '-',
            ].join(';')
          )
          .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `logs-connexion-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Export CSV réussi !');
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  const exportLoginLogsToJSON = () => {
    try {
      const jsonData = {
        application: 'School Manager',
        logo: 'SM',
        dateExport: format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr }),
        total: filteredLoginLogs?.length || 0,
        logs: (filteredLoginLogs || []).map((log: any) => ({
          utilisateur: log.user ? `${log.user.firstName} ${log.user.lastName}` : null,
          email: log.email,
          statut: log.success ? 'Réussi' : 'Échoué',
          adresseIP: log.ipAddress,
          date: format(new Date(log.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr }),
          raison: log.reason || null,
        })),
      };

      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `logs-connexion-${format(new Date(), 'yyyy-MM-dd')}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Export JSON réussi !');
    } catch (error) {
      console.error('Erreur lors de l\'export JSON:', error);
      toast.error('Erreur lors de l\'export JSON');
    }
  };

  const exportLoginLogsToPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const currentDate = new Date().toLocaleDateString('fr-FR');

      // Logo textuel stylisé
      doc.setFillColor(220, 38, 38);
      doc.roundedRect(14, 10, 40, 12, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SM', 34, 18, { align: 'center' });
      
      // Titre
      doc.setTextColor(220, 38, 38);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('School Manager', 60, 18);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text('Logs de Connexion', 60, 25);
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

      const tableData = (filteredLoginLogs || []).map((log: any) => [
        log.user ? `${log.user.firstName} ${log.user.lastName}` : 'N/A',
        log.email || 'N/A',
        log.success ? 'Réussi' : 'Échoué',
        log.ipAddress || 'N/A',
        format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr }),
      ]);

      useAutoTable({
        startY: 38,
        head: [['Utilisateur', 'Email', 'Statut', 'Adresse IP', 'Date']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });

      doc.save(`logs-connexion-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Export PDF réussi !');
    } catch (error: any) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error(`Erreur lors de l'export PDF: ${error.message || 'Erreur inconnue'}`);
    }
  };

  // Export functions for Security Events
  const exportSecurityEventsToCSV = () => {
    try {
      const headers = ['Type', 'Sévérité', 'Description', 'Utilisateur', 'Adresse IP', 'Date'];
      const csvContent =
        '\ufeff' +
        '# School Manager - Événements de Sécurité\n' +
        `# Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}\n` +
        '#\n' +
        headers.join(';') +
        '\n' +
        (filteredSecurityEvents || [])
          .map((event: any) =>
            [
              event.type || 'N/A',
              event.severity || 'N/A',
              event.description || 'N/A',
              event.user?.email || 'N/A',
              event.ipAddress || 'N/A',
              format(new Date(event.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr }),
            ].join(';')
          )
          .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `evenements-securite-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Export CSV réussi !');
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  const exportSecurityEventsToJSON = () => {
    try {
      const jsonData = {
        application: 'School Manager',
        logo: 'SM',
        dateExport: format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr }),
        total: filteredSecurityEvents?.length || 0,
        événements: (filteredSecurityEvents || []).map((event: any) => ({
          type: event.type,
          sévérité: event.severity,
          description: event.description,
          utilisateur: event.user?.email || null,
          adresseIP: event.ipAddress || null,
          date: format(new Date(event.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr }),
        })),
      };

      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `evenements-securite-${format(new Date(), 'yyyy-MM-dd')}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Export JSON réussi !');
    } catch (error) {
      console.error('Erreur lors de l\'export JSON:', error);
      toast.error('Erreur lors de l\'export JSON');
    }
  };

  const exportSecurityEventsToPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const currentDate = new Date().toLocaleDateString('fr-FR');

      // Logo textuel stylisé
      doc.setFillColor(220, 38, 38);
      doc.roundedRect(14, 10, 40, 12, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SM', 34, 18, { align: 'center' });
      
      // Titre
      doc.setTextColor(220, 38, 38);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('School Manager', 60, 18);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text('Événements de Sécurité', 60, 25);
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

      const tableData = (filteredSecurityEvents || []).map((event: any) => [
        event.type || 'N/A',
        event.severity || 'N/A',
        event.description?.substring(0, 40) + (event.description?.length > 40 ? '...' : '') || 'N/A',
        event.user?.email || 'N/A',
        format(new Date(event.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr }),
      ]);

      useAutoTable({
        startY: 38,
        head: [['Type', 'Sévérité', 'Description', 'Utilisateur', 'Date']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });

      doc.save(`evenements-securite-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Export PDF réussi !');
    } catch (error: any) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error(`Erreur lors de l'export PDF: ${error.message || 'Erreur inconnue'}`);
    }
  };

  // Export functions for Users
  const exportUsersToCSV = () => {
    try {
      const headers = ['Nom', 'Prénom', 'Email', 'Rôle', 'Statut'];
      const csvContent =
        '\ufeff' +
        '# School Manager - Liste des Utilisateurs\n' +
        `# Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}\n` +
        '#\n' +
        headers.join(';') +
        '\n' +
        (filteredUsers || [])
          .map((user: any) =>
            [
              user.lastName || 'N/A',
              user.firstName || 'N/A',
              user.email || 'N/A',
              user.role || 'N/A',
              user.isActive ? 'Actif' : 'Inactif',
            ].join(';')
          )
          .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `utilisateurs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Export CSV réussi !');
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  const exportUsersToJSON = () => {
    try {
      const jsonData = {
        application: 'School Manager',
        logo: 'SM',
        dateExport: format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr }),
        total: filteredUsers?.length || 0,
        utilisateurs: (filteredUsers || []).map((user: any) => ({
          nom: user.lastName,
          prénom: user.firstName,
          email: user.email,
          rôle: user.role,
          statut: user.isActive ? 'Actif' : 'Inactif',
        })),
      };

      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `utilisateurs-${format(new Date(), 'yyyy-MM-dd')}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Export JSON réussi !');
    } catch (error) {
      console.error('Erreur lors de l\'export JSON:', error);
      toast.error('Erreur lors de l\'export JSON');
    }
  };

  const exportUsersToPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const currentDate = new Date().toLocaleDateString('fr-FR');

      // Logo textuel stylisé
      doc.setFillColor(220, 38, 38);
      doc.roundedRect(14, 10, 40, 12, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SM', 34, 18, { align: 'center' });
      
      // Titre
      doc.setTextColor(220, 38, 38);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('School Manager', 60, 18);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text('Liste des Utilisateurs', 60, 25);
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

      const tableData = (filteredUsers || []).map((user: any) => [
        `${user.firstName || ''} ${user.lastName || ''}`,
        user.email || 'N/A',
        user.role || 'N/A',
        user.isActive ? 'Actif' : 'Inactif',
      ]);

      useAutoTable({
        startY: 38,
        head: [['Nom complet', 'Email', 'Rôle', 'Statut']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });

      doc.save(`utilisateurs-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Export PDF réussi !');
    } catch (error: any) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error(`Erreur lors de l'export PDF: ${error.message || 'Erreur inconnue'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-red-600 to-rose-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black mb-2">Sécurité & Confidentialité</h2>
            <p className="text-red-100 text-lg">
              Protection des données avec authentification robuste
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{securityStats?.totalLogins || 0}</div>
              <div className="text-sm text-red-100">Connexions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{securityStats?.recentEvents || 0}</div>
              <div className="text-sm text-red-100">Événements (7j)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{securityStats?.criticalEvents || 0}</div>
              <div className="text-sm text-red-100">Critiques</div>
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
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Filters */}
      {(activeTab === 'login-logs' || activeTab === 'security-events' || activeTab === 'users') && (
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Rechercher..."
              />
            </div>
            {activeTab === 'security-events' && (
              <FilterDropdown
                label="Sévérité"
                value={selectedSeverity}
                onChange={setSelectedSeverity}
                options={[
                  { value: 'all', label: 'Toutes' },
                  { value: 'info', label: 'Info' },
                  { value: 'warning', label: 'Avertissement' },
                  { value: 'error', label: 'Erreur' },
                  { value: 'critical', label: 'Critique' },
                ]}
              />
            )}
          </div>
        </Card>
      )}

      {/* Content */}
      <div className="animate-slide-up">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistiques de sécurité */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Taux de Réussite</p>
                    <p className="text-3xl font-bold text-green-600">
                      {securityStats?.successRate?.toFixed(1) || '0.0'}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {securityStats?.successfulLogins || 0} / {securityStats?.totalLogins || 0}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center">
                    <FiCheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Échecs de Connexion</p>
                    <p className="text-3xl font-bold text-red-600">
                      {securityStats?.failedLogins || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Tentatives échouées</p>
                  </div>
                  <div className="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center">
                    <FiXCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Événements Récents</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {securityStats?.recentEvents || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">7 derniers jours</p>
                  </div>
                  <div className="w-16 h-16 bg-yellow-600 rounded-xl flex items-center justify-center">
                    <FiActivity className="w-8 h-8 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Événements Critiques</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {securityStats?.criticalEvents || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Nécessitent attention</p>
                  </div>
                  <div className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center">
                    <FiAlertCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Recommandations de sécurité */}
            <Card>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recommandations de Sécurité</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <FiShield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Authentification à deux facteurs</h4>
                    <p className="text-sm text-gray-600">
                      Activez l'authentification à deux facteurs pour renforcer la sécurité des comptes administrateurs.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <FiLock className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Mots de passe forts</h4>
                    <p className="text-sm text-gray-600">
                      Assurez-vous que tous les utilisateurs utilisent des mots de passe complexes (minimum 8 caractères).
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <FiClock className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Sessions actives</h4>
                    <p className="text-sm text-gray-600">
                      Configurez un délai d'expiration des sessions pour limiter les risques de sécurité.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'login-logs' && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Logs de Connexion ({filteredLoginLogs.length})
              </h3>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={exportLoginLogsToCSV}>
                  <FiDownload className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button variant="secondary" size="sm" onClick={exportLoginLogsToJSON}>
                  <FiDownload className="w-4 h-4 mr-2" />
                  JSON
                </Button>
                <Button variant="secondary" size="sm" onClick={exportLoginLogsToPDF}>
                  <FiDownload className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
            {filteredLoginLogs.length === 0 ? (
              <div className="text-center py-12">
                <FiActivity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucun log de connexion trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Utilisateur</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Adresse IP</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Raison</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoginLogs.map((log: any) => (
                      <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <FiUser className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {log.user?.firstName} {log.user?.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{log.email}</td>
                        <td className="py-3 px-4">
                          {log.success ? (
                            <Badge className="bg-green-100 text-green-800">
                              <FiCheckCircle className="w-3 h-3 mr-1 inline" />
                              Réussi
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <FiXCircle className="w-3 h-3 mr-1 inline" />
                              Échoué
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{log.ipAddress || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {format(new Date(log.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{log.reason || '-'}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              setSelectedLog(log);
                              setIsLogDetailsModalOpen(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir les détails"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'security-events' && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Événements de Sécurité ({filteredSecurityEvents.length})
              </h3>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={exportSecurityEventsToCSV}>
                  <FiDownload className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button variant="secondary" size="sm" onClick={exportSecurityEventsToJSON}>
                  <FiDownload className="w-4 h-4 mr-2" />
                  JSON
                </Button>
                <Button variant="secondary" size="sm" onClick={exportSecurityEventsToPDF}>
                  <FiDownload className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
            {filteredSecurityEvents.length === 0 ? (
              <div className="text-center py-12">
                <FiShield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucun événement de sécurité trouvé</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSecurityEvents.map((event: any) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg border-2 ${
                      event.severity === 'critical'
                        ? 'bg-red-50 border-red-200'
                        : event.severity === 'error'
                        ? 'bg-orange-50 border-orange-200'
                        : event.severity === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getSeverityBadge(event.severity)}
                          <span className="text-sm font-semibold text-gray-800">{event.type}</span>
                        </div>
                        <p className="text-gray-700 mb-2">{event.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {event.user && (
                            <div className="flex items-center">
                              <FiUser className="w-3 h-3 mr-1" />
                              {event.user.email}
                            </div>
                          )}
                          {event.ipAddress && (
                            <div className="flex items-center">
                              <FiGlobe className="w-3 h-3 mr-1" />
                              {event.ipAddress}
                            </div>
                          )}
                          <div className="flex items-center">
                            <FiClock className="w-3 h-3 mr-1" />
                            {format(new Date(event.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsEventDetailsModalOpen(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ml-4"
                        title="Voir les détails"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'users' && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Gestion des Utilisateurs ({filteredUsers.length})
              </h3>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={exportUsersToCSV}>
                  <FiDownload className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button variant="secondary" size="sm" onClick={exportUsersToJSON}>
                  <FiDownload className="w-4 h-4 mr-2" />
                  JSON
                </Button>
                <Button variant="secondary" size="sm" onClick={exportUsersToPDF}>
                  <FiDownload className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <FiUser className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Aucun utilisateur trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Utilisateur</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Rôle</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user: any) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <FiUser className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {user.firstName} {user.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <Badge className="bg-indigo-100 text-indigo-800">{user.role}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          {user.isActive ? (
                            <Badge className="bg-green-100 text-green-800">
                              <FiCheckCircle className="w-3 h-3 mr-1 inline" />
                              Actif
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <FiXCircle className="w-3 h-3 mr-1 inline" />
                              Inactif
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsPasswordModalOpen(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Changer le mot de passe"
                            >
                              <FiKey className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                changeStatusMutation.mutate({
                                  userId: user.id,
                                  isActive: !user.isActive,
                                })
                              }
                              className={`p-2 rounded-lg transition-colors ${
                                user.isActive
                                  ? 'text-red-600 hover:bg-red-50'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={user.isActive ? 'Désactiver' : 'Activer'}
                            >
                              {user.isActive ? (
                                <FiLockIcon className="w-4 h-4" />
                              ) : (
                                <FiUnlock className="w-4 h-4" />
                              )}
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

        {activeTab === 'privacy' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Protection des Données</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <FiDatabase className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-800">Chiffrement des données</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Toutes les données sensibles sont chiffrées en transit et au repos.
                  </p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <FiLock className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-gray-800">Mots de passe sécurisés</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Les mots de passe sont hachés avec bcrypt avant stockage.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <FiShield className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-800">Contrôle d'accès</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Système RBAC pour limiter l'accès aux données selon les rôles.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Confidentialité</h3>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <FiEye className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-semibold text-gray-800">Visibilité des données</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Seuls les utilisateurs autorisés peuvent accéder aux données.
                  </p>
                </div>
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <FiFileText className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-semibold text-gray-800">Journalisation</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Tous les accès et modifications sont enregistrés dans les logs.
                  </p>
                </div>
                <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <FiRefreshCw className="w-5 h-5 text-pink-600" />
                    <h4 className="font-semibold text-gray-800">Sauvegarde automatique</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Sauvegardes régulières pour protéger contre la perte de données.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FiCheckCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Conformité RGPD</h3>
                  <p className="text-gray-600 mb-4">
                    L'application respecte les exigences du Règlement Général sur la Protection des Données (RGPD).
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-1">Droit à l'oubli</h4>
                      <p className="text-xs text-gray-600">Suppression des données à la demande</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-1">Portabilité des données</h4>
                      <p className="text-xs text-gray-600">Export des données personnelles</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-1">Consentement</h4>
                      <p className="text-xs text-gray-600">Gestion des consentements utilisateurs</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-1">Transparence</h4>
                      <p className="text-xs text-gray-600">Information claire sur l'utilisation des données</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Audit de Sécurité</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-800">Dernière vérification</h4>
                    <p className="text-sm text-gray-600">15/01/2024</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Conforme</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-800">Prochaine vérification</h4>
                    <p className="text-sm text-gray-600">15/04/2024</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Planifiée</Badge>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setSelectedUser(null);
          setNewPassword('');
        }}
        title="Changer le mot de passe"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Utilisateur</p>
              <p className="font-semibold text-gray-800">
                {selectedUser.firstName} {selectedUser.lastName}
              </p>
              <p className="text-sm text-gray-600">{selectedUser.email}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nouveau mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Le mot de passe doit contenir au moins 6 caractères
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setSelectedUser(null);
                  setNewPassword('');
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending || newPassword.length < 6}
                className="bg-red-600 hover:bg-red-700"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Modification...
                  </>
                ) : (
                  <>
                    <FiKey className="w-4 h-4 mr-2" />
                    Modifier
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Log Details Modal */}
      <Modal
        isOpen={isLogDetailsModalOpen}
        onClose={() => {
          setIsLogDetailsModalOpen(false);
          setSelectedLog(null);
        }}
        title="Détails du Log de Connexion"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Utilisateur</p>
                <p className="font-semibold text-gray-800">
                  {selectedLog.user ? `${selectedLog.user.firstName} ${selectedLog.user.lastName}` : 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-semibold text-gray-800">{selectedLog.email}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Statut</p>
                {selectedLog.success ? (
                  <Badge className="bg-green-100 text-green-800">
                    <FiCheckCircle className="w-3 h-3 mr-1 inline" />
                    Réussi
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    <FiXCircle className="w-3 h-3 mr-1 inline" />
                    Échoué
                  </Badge>
                )}
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Adresse IP</p>
                <p className="font-semibold text-gray-800">{selectedLog.ipAddress || 'N/A'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <p className="font-semibold text-gray-800">
                  {format(new Date(selectedLog.createdAt), 'dd/MM/yyyy à HH:mm:ss', { locale: fr })}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Raison</p>
                <p className="font-semibold text-gray-800">{selectedLog.reason || '-'}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsLogDetailsModalOpen(false);
                  setSelectedLog(null);
                }}
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Event Details Modal */}
      <Modal
        isOpen={isEventDetailsModalOpen}
        onClose={() => {
          setIsEventDetailsModalOpen(false);
          setSelectedEvent(null);
        }}
        title="Détails de l'Événement de Sécurité"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Type</p>
              <p className="font-semibold text-gray-800">{selectedEvent.type}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Sévérité</p>
              <div className="mt-1">{getSeverityBadge(selectedEvent.severity)}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Description</p>
              <p className="font-semibold text-gray-800">{selectedEvent.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Utilisateur</p>
                <p className="font-semibold text-gray-800">
                  {selectedEvent.user?.email || 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Adresse IP</p>
                <p className="font-semibold text-gray-800">{selectedEvent.ipAddress || 'N/A'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg col-span-2">
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <p className="font-semibold text-gray-800">
                  {format(new Date(selectedEvent.createdAt), 'dd/MM/yyyy à HH:mm:ss', { locale: fr })}
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEventDetailsModalOpen(false);
                  setSelectedEvent(null);
                }}
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SecurityPrivacyManagement;

