import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Layout from '../../components/Layout';
import StudentsList from '../../components/admin/StudentsList';
import ClassesList from '../../components/admin/ClassesList';
import TeachersList from '../../components/admin/TeachersList';
import EducatorsList from '../../components/admin/EducatorsList';
import DashboardStats from '../../components/admin/DashboardStats';
import AllActivities from './AllActivities';
import AllNotifications from './AllNotifications';
import CompleteManagement from '../../components/admin/CompleteManagement';
import MultiRolesManagement from '../../components/admin/MultiRolesManagement';
import PedagogicalTracking from '../../components/admin/PedagogicalTracking';
import CommunicationHubModule from '../../components/admin/CommunicationHubModule';
import AdvancedAnalytics from '../../components/admin/AdvancedAnalytics';
import ScheduleManagement from '../../components/admin/ScheduleManagement';
import AcademicManagement from '../../components/admin/AcademicManagement';
import GradingEvaluationManagement from '../../components/admin/GradingEvaluationManagement';
import FeesManagementModule from '../../components/admin/FeesManagementModule';
import AdministrativeManagement from '../../components/admin/AdministrativeManagement';
import AdmissionsManagement from '../../components/admin/AdmissionsManagement';
import SecurityPrivacyManagement from '../../components/admin/SecurityPrivacyManagement';
import PerformanceManagement from '../../components/admin/PerformanceManagement';
import TuitionFeesManagement from '../../components/admin/TuitionFeesManagement';
import PaymentsManagement from '../../components/admin/PaymentsManagement';
import NFCStudentScanner from '../../components/admin/NFCStudentScanner';
import NFCTeacherScanner from '../../components/admin/NFCTeacherScanner';
import PointageEleves from '../../components/admin/PointageEleves';
import AttendanceManagementModule from '../../components/admin/AttendanceManagementModule';
import HRManagementModule from '../../components/admin/hr/HRManagementModule';
import LibraryManagementModule from '../../components/admin/library/LibraryManagementModule';
import MaterialManagementModule from '../../components/admin/material/MaterialManagementModule';
import ReportsStatisticsModule from '../../components/admin/reports/ReportsStatisticsModule';
import AdminSidebar from '../../components/admin/AdminSidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AddStudentModal from '../../components/admin/AddStudentModal';
import AddClassModal from '../../components/admin/AddClassModal';
import AddTeacherModal from '../../components/admin/AddTeacherModal';
import AddEducatorModal from '../../components/admin/AddEducatorModal';
import GenerateReportModal from '../../components/admin/GenerateReportModal';
import ExportDataModal from '../../components/admin/ExportDataModal';
import SettingsModal from '../../components/admin/SettingsModal';
import { 
  FiLayout, 
  FiUsers, 
  FiBook, 
  FiUserCheck, 
  FiSettings,
  FiBarChart,
  FiCalendar,
  FiBell,
  FiSearch,
  FiAward,
  FiBriefcase,
  FiShield,
  FiZap,
  FiDollarSign,
  FiWifi,
  FiActivity,
  FiInbox,
  FiUserPlus,
  FiLayers,
  FiEdit3,
  FiCreditCard,
  FiCheckSquare,
  FiPackage,
  FiBookOpen,
  FiTool,
  FiPieChart,
  FiCommand,
  FiArrowRight,
  FiMenu,
} from 'react-icons/fi';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';

const VALID_TAB_IDS = [
  'dashboard',
  'activities',
  'notifications',
  'students',
  'academic',
  'grading',
  'classes',
  'teachers',
  'educators',
  'management',
  'roles',
  'pedagogical',
  'communication',
  'library',
  'material',
  'reports',
  'analytics',
  'schedule',
  'pointage',
  'attendance',
  'hr',
  'administrative',
  'admissions',
  'fees',
  'tuition-fees',
  'payments',
  'nfc-scanner',
  'security',
  'performance',
  'settings',
] as const;

type TabItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const path = pathname ?? '';
    if (path.includes('/activities')) {
      setActiveTab('activities');
      return;
    }
    if (path.includes('/notifications')) {
      setActiveTab('notifications');
      return;
    }
    const tab = searchParams?.get('tab');
    if (tab && VALID_TAB_IDS.includes(tab as (typeof VALID_TAB_IDS)[number])) {
      setActiveTab(tab);
      return;
    }
    setActiveTab('dashboard');
  }, [pathname, searchParams]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [isAddEducatorModalOpen, setIsAddEducatorModalOpen] = useState(false);
  const [isGenerateReportModalOpen, setIsGenerateReportModalOpen] = useState(false);
  const [isExportDataModalOpen, setIsExportDataModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: FiLayout, color: 'from-blue-500 to-blue-600', description: 'Vue d’ensemble et indicateurs' },
    { id: 'activities', label: 'Activités', icon: FiActivity, color: 'from-sky-500 to-sky-600', description: 'Historique des activités récentes' },
    { id: 'notifications', label: 'Notifications', icon: FiInbox, color: 'from-amber-500 to-amber-600', description: 'Toutes les notifications' },
    { id: 'students', label: 'Élèves', icon: FiUsers, color: 'from-green-500 to-green-600', description: 'Gestion des élèves' },
    { id: 'academic', label: 'Gestion académique', icon: FiLayers, color: 'from-violet-500 to-violet-600', description: 'Classes, matières, emploi du temps et calendrier' },
    { id: 'grading', label: 'Notation & évaluation', icon: FiEdit3, color: 'from-fuchsia-500 to-fuchsia-600', description: 'Notes, moyennes, bulletins PDF et rapports' },
    { id: 'classes', label: 'Classes', icon: FiBook, color: 'from-purple-500 to-purple-600', description: 'Gestion des classes' },
    { id: 'teachers', label: 'Enseignants', icon: FiUserCheck, color: 'from-indigo-500 to-indigo-600', description: 'Gestion des enseignants' },
    { id: 'educators', label: 'Éducateurs', icon: FiShield, color: 'from-purple-500 to-purple-600', description: 'Gestion des éducateurs' },
    { id: 'management', label: 'Gestion complète', icon: FiBarChart, color: 'from-cyan-500 to-cyan-600', description: 'Notes, absences, devoirs et bulletins' },
    { id: 'roles', label: 'Multi-rôles', icon: FiUsers, color: 'from-pink-500 to-pink-600', description: 'Utilisateurs et rôles' },
    { id: 'pedagogical', label: 'Suivi pédagogique', icon: FiAward, color: 'from-yellow-500 to-yellow-600', description: 'Suivi pédagogique et indicateurs' },
    { id: 'communication', label: 'Communication', icon: FiBell, color: 'from-rose-500 to-rose-600', description: 'Messagerie, alertes, circulaires, actualités et demandes' },
    { id: 'library', label: 'Bibliothèque', icon: FiBookOpen, color: 'from-sky-500 to-indigo-600', description: 'Catalogue, emprunts, réservations, pénalités et inventaire' },
    { id: 'material', label: 'Gestion matérielle', icon: FiTool, color: 'from-slate-500 to-slate-700', description: 'Salles, inventaire, maintenance et allocations de matériel' },
    { id: 'reports', label: 'Rapports & statistiques', icon: FiPieChart, color: 'from-cyan-500 to-blue-700', description: 'Tableaux de bord, finances, académique, inscriptions et performances' },
    { id: 'analytics', label: 'Analytique avancée', icon: FiBarChart, color: 'from-emerald-500 to-emerald-600', description: 'Statistiques et analyses' },
    { id: 'schedule', label: 'Emploi du temps', icon: FiCalendar, color: 'from-orange-500 to-orange-600', description: 'Emplois du temps' },
    { id: 'pointage', label: 'Pointage des élèves', icon: FiUserCheck, color: 'from-emerald-500 to-emerald-600', description: 'Pointage des élèves par badge NFC' },
    { id: 'attendance', label: 'Gestion des présences', icon: FiCheckSquare, color: 'from-teal-500 to-cyan-600', description: 'Appel, absences, rapports d’assiduité et notifications aux parents' },
    { id: 'hr', label: 'Ressources humaines', icon: FiPackage, color: 'from-rose-500 to-pink-600', description: 'Contrats, paie indicative, avantages, évaluations et congés' },
    { id: 'administrative', label: 'Gestion administrative', icon: FiBriefcase, color: 'from-teal-500 to-teal-600', description: 'Vue d’ensemble administrative' },
    { id: 'admissions', label: 'Inscriptions & admissions', icon: FiUserPlus, color: 'from-violet-500 to-violet-600', description: 'Pré-inscriptions en ligne et finalisation des dossiers' },
    { id: 'fees', label: 'Gestion des frais', icon: FiCreditCard, color: 'from-teal-500 to-teal-600', description: 'Facturation, paiements, rappels, reçus et historique' },
    { id: 'tuition-fees', label: 'Frais de scolarité', icon: FiDollarSign, color: 'from-amber-500 to-amber-600', description: 'Frais de scolarité' },
    { id: 'payments', label: 'Paiements', icon: FiDollarSign, color: 'from-green-500 to-green-600', description: 'Paiements reçus' },
    { id: 'nfc-scanner', label: 'Scanner NFC', icon: FiWifi, color: 'from-cyan-500 to-cyan-600', description: 'Association des badges NFC' },
    { id: 'security', label: 'Sécurité & confidentialité', icon: FiShield, color: 'from-red-500 to-red-600', description: 'Sécurité et confidentialité' },
    { id: 'performance', label: 'Performance & rapidité', icon: FiZap, color: 'from-yellow-500 to-yellow-600', description: 'Performance et monitoring' },
    { id: 'settings', label: 'Paramètres', icon: FiSettings, color: 'from-gray-500 to-gray-600', description: 'Paramètres de l’établissement' },
  ];

  const mainTabs = tabs.filter((t) => t.id !== 'activities' && t.id !== 'notifications');
  const bottomTabs = tabs.filter((t) => t.id === 'activities' || t.id === 'notifications');
  const activeTabMeta = tabs.find((t) => t.id === activeTab) ?? tabs[0];
  const ActiveTabIcon = activeTabMeta.icon;
  const quickActions = useMemo(
    () => [
      { label: 'Ajouter un élève', action: () => setIsAddStudentModalOpen(true) },
      { label: 'Créer une classe', action: () => setIsAddClassModalOpen(true) },
      { label: 'Ajouter un enseignant', action: () => setIsAddTeacherModalOpen(true) },
      { label: 'Exporter des données', action: () => setIsExportDataModalOpen(true) },
    ],
    []
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const changeTab = (tabId: string) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('tab', tabId);
    router.replace(`/admin?${params.toString()}`);
  };

  return (
    <Layout user={user} onLogout={logout} role="ADMIN">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/50">
        <AdminSidebar
          mainTabs={mainTabs}
          bottomTabs={bottomTabs}
          activeTab={activeTab}
          onTabChange={changeTab}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((o) => !o)}
        />

        <div className="lg:pl-64 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-16 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm shadow-slate-900/5">
            <div className="px-2.5 sm:px-5 py-1.5 sm:py-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen((o) => !o)}
                    className="lg:hidden p-1.5 rounded-md hover:bg-slate-100 transition-colors text-slate-700 shrink-0 min-h-[34px] min-w-[34px] flex items-center justify-center"
                    aria-label="Ouvrir le menu de navigation"
                  >
                    <FiMenu className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <h1 className="font-display text-sm sm:text-base md:text-lg font-bold text-slate-900 tracking-tight break-words leading-tight">
                      {getGreeting()}, {user?.firstName}
                    </h1>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0 line-clamp-1">
                      Pilotage — stratégique, opérationnel et conformité
                    </p>
                    <p className="text-[8px] sm:text-[9px] text-slate-400 mt-0 tabular-nums">
                      {format(new Date(), "EEE d MMM yyyy • HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
                <div className="relative w-full sm:w-56 shrink-0">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">
                    <FiSearch className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                      }
                    }}
                    placeholder="Rechercher… (Entrée)"
                    className="w-full pl-8 pr-2 py-1 sm:py-1.5 bg-white/90 border border-slate-200 rounded-md text-[10px] sm:text-xs focus:ring-1 focus:ring-indigo-500/25 focus:border-indigo-400"
                  />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-2.5 sm:px-5 py-3 sm:py-4 overflow-y-auto overflow-x-hidden pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="max-w-[1200px] mx-auto space-y-3 sm:space-y-4">
              <div className={`rounded-xl bg-gradient-to-r ${activeTabMeta.color} p-px shadow-sm`}>
                <div className="rounded-[11px] bg-white/95 backdrop-blur-xl px-3 py-2 sm:px-4 sm:py-2.5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className={`mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-gradient-to-r ${activeTabMeta.color} text-white flex items-center justify-center shadow-sm`}>
                        <ActiveTabIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900">{activeTabMeta.label}</h2>
                        <p className="text-[9px] sm:text-xs text-slate-500 mt-0 line-clamp-2">{activeTabMeta.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-700">
                        <FiCommand className="w-3 h-3" />
                        Admin
                      </span>
                      {quickActions.slice(0, 2).map((qa) => (
                        <button
                          key={qa.label}
                          type="button"
                          onClick={qa.action}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          {qa.label}
                          <FiArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {activeTab === 'activities' ? (
                <AllActivities />
              ) : activeTab === 'notifications' ? (
                <AllNotifications />
              ) : activeTab === 'dashboard' && (
                <DashboardStats 
                  onAddStudent={() => setIsAddStudentModalOpen(true)}
                  onCreateClass={() => setIsAddClassModalOpen(true)}
                  onAddTeacher={() => setIsAddTeacherModalOpen(true)}
                  onAddEducator={() => setIsAddEducatorModalOpen(true)}
                  onGenerateReport={() => setIsGenerateReportModalOpen(true)}
                  onExportData={() => setIsExportDataModalOpen(true)}
                  onSettings={() => setIsSettingsModalOpen(true)}
                />
              )}
              {activeTab === 'students' && <StudentsList searchQuery={searchQuery} />}
              {activeTab === 'academic' && <AcademicManagement />}
              {activeTab === 'grading' && <GradingEvaluationManagement />}
              {activeTab === 'classes' && <ClassesList searchQuery={searchQuery} />}
              {activeTab === 'teachers' && <TeachersList searchQuery={searchQuery} />}
              {activeTab === 'educators' && <EducatorsList searchQuery={searchQuery} />}
              {activeTab === 'management' && <CompleteManagement />}
              {activeTab === 'roles' && <MultiRolesManagement />}
              {activeTab === 'pedagogical' && <PedagogicalTracking />}
              {activeTab === 'communication' && <CommunicationHubModule />}
              {activeTab === 'library' && <LibraryManagementModule />}
              {activeTab === 'material' && <MaterialManagementModule />}
              {activeTab === 'reports' && <ReportsStatisticsModule />}
              {activeTab === 'analytics' && <AdvancedAnalytics />}
              {activeTab === 'schedule' && <ScheduleManagement />}
              {activeTab === 'pointage' && <PointageEleves />}
              {activeTab === 'attendance' && <AttendanceManagementModule />}
              {activeTab === 'hr' && <HRManagementModule />}
              {activeTab === 'administrative' && <AdministrativeManagement />}
              {activeTab === 'admissions' && <AdmissionsManagement />}
              {activeTab === 'fees' && <FeesManagementModule />}
              {activeTab === 'tuition-fees' && <TuitionFeesManagement />}
              {activeTab === 'payments' && <PaymentsManagement />}
              {activeTab === 'nfc-scanner' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2">Scanner NFC - Élèves</h3>
                      <NFCStudentScanner />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2">Scanner NFC - Enseignants</h3>
                      <NFCTeacherScanner />
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'security' && <SecurityPrivacyManagement />}
              {activeTab === 'performance' && <PerformanceManagement />}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <Card variant="premium" className="bg-gradient-to-r from-slate-700 to-slate-800 text-white border-none">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-3xl font-black mb-2">Paramètres</h2>
                        <p className="text-gray-200 text-lg">
                          Configurez votre établissement scolaire
                        </p>
                      </div>
                      <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                        <FiSettings className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </Card>
                  
                  <Card variant="premium">
                    <div className="text-center py-12">
                      <FiSettings className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Gestion des Paramètres</h3>
                      <p className="text-gray-600 mb-6">
                        Accédez à tous les paramètres de configuration de votre établissement
                      </p>
                      <Button
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-4 text-lg"
                      >
                        <FiSettings className="w-5 h-5 mr-2" />
                        Ouvrir les Paramètres
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </main>
        </div>
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
      <AddEducatorModal
        isOpen={isAddEducatorModalOpen}
        onClose={() => setIsAddEducatorModalOpen(false)}
      />
      <GenerateReportModal
        isOpen={isGenerateReportModalOpen}
        onClose={() => setIsGenerateReportModalOpen(false)}
      />
      <ExportDataModal
        isOpen={isExportDataModalOpen}
        onClose={() => setIsExportDataModalOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </Layout>
  );
};

export default AdminDashboard;

