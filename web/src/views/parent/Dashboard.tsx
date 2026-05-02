import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '../../components/Layout';
import ParentSidebar, { type ParentNavItem } from '../../components/parent/ParentSidebar';
import ParentOverview from '../../components/parent/ParentOverview';
import ChildrenList from '../../components/parent/ChildrenList';
import ChildGrades from '../../components/parent/ChildGrades';
import ChildAbsences from '../../components/parent/ChildAbsences';
import ChildSchedule from '../../components/parent/ChildSchedule';
import ChildAssignments from '../../components/parent/ChildAssignments';
import ChildPayments from '../../components/parent/ChildPayments';
import ChildReportCards from '../../components/parent/ChildReportCards';
import ChildConduct from '../../components/parent/ChildConduct';
import SchoolCommunication from '../../components/portal/SchoolCommunication';
import Card from '../../components/ui/Card';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import {
  FiSearch,
  FiHeart,
  FiMenu,
  FiAward,
  FiAlertCircle,
  FiFileText,
  FiCalendar,
  FiShield,
  FiCreditCard,
  FiUsers,
  FiLayout,
  FiBook,
  FiMessageCircle,
  FiCommand,
} from 'react-icons/fi';

const VALID_PARENT_TABS = [
  'overview',
  'communication',
  'children',
  'grades',
  'absences',
  'assignments',
  'schedule',
  'report-cards',
  'conduct',
  'payments',
] as const;

type ParentTabId = (typeof VALID_PARENT_TABS)[number];

const ParentDashboard = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: ParentNavItem[] = useMemo(
    () => [
      { id: 'overview', label: 'Vue d’ensemble', icon: FiLayout, requiresChild: false, color: 'from-orange-500 to-amber-600' },
      { id: 'communication', label: 'Messages école', icon: FiMessageCircle, requiresChild: false, color: 'from-amber-500 to-yellow-600' },
      { id: 'children', label: 'Mes enfants', icon: FiUsers, requiresChild: false, color: 'from-orange-600 to-rose-500' },
      { id: 'grades', label: 'Notes', icon: FiAward, requiresChild: true, color: 'from-amber-600 to-orange-600' },
      { id: 'absences', label: 'Absences', icon: FiAlertCircle, requiresChild: true, color: 'from-orange-500 to-red-500' },
      { id: 'assignments', label: 'Devoirs', icon: FiFileText, requiresChild: true, color: 'from-yellow-500 to-amber-600' },
      { id: 'schedule', label: 'Emploi du temps', icon: FiCalendar, requiresChild: true, color: 'from-amber-500 to-orange-500' },
      { id: 'report-cards', label: 'Bulletins', icon: FiBook, requiresChild: true, color: 'from-orange-700 to-amber-700' },
      { id: 'conduct', label: 'Conduite', icon: FiShield, requiresChild: true, color: 'from-rose-500 to-orange-600' },
      { id: 'payments', label: 'Paiements', icon: FiCreditCard, requiresChild: true, color: 'from-emerald-600 to-amber-600' },
    ],
    []
  );

  const tabDescriptions: Record<string, string> = useMemo(
    () => ({
      overview: 'Vue d’ensemble de la scolarité et raccourcis utiles',
      communication: 'Échanges avec l’école et notifications',
      children: 'Liste de vos enfants et sélection du profil actif',
      grades: 'Notes et résultats de l’enfant sélectionné',
      absences: 'Assiduité et justifications',
      assignments: 'Devoirs et travaux à rendre',
      schedule: 'Emploi du temps hebdomadaire',
      'report-cards': 'Bulletins et bilans',
      conduct: 'Appréciations et conduite',
      payments: 'Frais scolaires et règlements',
    }),
    []
  );

  useEffect(() => {
    const t = searchParams?.get('tab');
    if (t && VALID_PARENT_TABS.includes(t as ParentTabId)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const changeTab = (tabId: string) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('tab', tabId);
    router.replace(`/parent?${params.toString()}`);
  };

  const activeMeta = navItems.find((n) => n.id === activeTab) ?? navItems[0];
  const ActiveTabIcon = activeMeta.icon;
  const activeDescription = tabDescriptions[activeTab] ?? tabDescriptions.overview;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <Layout user={user} onLogout={logout} role="PARENT">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/40 to-amber-50/30">
        <ParentSidebar
          items={navItems}
          activeTab={activeTab}
          onTabChange={changeTab}
          selectedChild={selectedChild}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="lg:pl-64">
          <header className="sticky top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm shadow-slate-900/5">
            <div className="px-2.5 sm:px-5 lg:px-6 py-1.5 sm:py-2">
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1.5 md:gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="lg:hidden p-1.5 rounded-md hover:bg-slate-100 transition-colors text-slate-700 shrink-0 min-h-[34px] min-w-[34px] flex items-center justify-center"
                      aria-label="Ouvrir le menu"
                    >
                      <FiMenu className="w-4 h-4" />
                    </button>
                    <div className="min-w-0">
                      <h1 className="font-display text-sm sm:text-base md:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                        {getGreeting()}, {user?.firstName}
                      </h1>
                      <p className="text-slate-500 text-[9px] sm:text-[10px] mt-0 line-clamp-1">
                        Scolarité de vos enfants
                      </p>
                      <p className="text-[8px] sm:text-[9px] text-slate-400 mt-0 tabular-nums">
                        {format(new Date(), "EEE d MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-900 text-[9px] font-semibold shrink-0">
                    <FiHeart className="w-3 h-3" />
                    Parent
                  </div>
                </div>

                <div className="relative w-full max-w-xl">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">
                    <FiSearch className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher…"
                    className="w-full pl-8 pr-2.5 py-1 sm:py-1.5 bg-white/90 border border-slate-200 rounded-md text-[10px] sm:text-xs focus:ring-1 focus:ring-orange-500/20 focus:border-orange-400"
                    aria-label="Recherche dans l’espace parent"
                  />
                </div>
              </div>
            </div>
          </header>

          <main className="px-2.5 sm:px-5 lg:px-6 py-3 sm:py-4 pb-[max(1rem,env(safe-area-inset-bottom))] overflow-x-hidden">
            <div className="max-w-[1200px] mx-auto space-y-3 sm:space-y-4">
              <div className={`rounded-xl bg-gradient-to-r ${activeMeta.color} p-px shadow-sm`}>
                <div className="rounded-[11px] bg-white/95 backdrop-blur-xl px-3 py-2 sm:px-4 sm:py-2.5">
                  <div className="flex items-start gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-r ${activeMeta.color} text-white flex items-center justify-center shadow-sm shrink-0`}
                    >
                      <ActiveTabIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-bold text-slate-900">{activeMeta.label}</h2>
                      <p className="text-[9px] sm:text-xs text-slate-500 mt-0 line-clamp-2">{activeDescription}</p>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1 ml-auto px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-700 shrink-0">
                      <FiCommand className="w-3 h-3" />
                      Parent
                    </span>
                  </div>
                </div>
              </div>

              <div className="animate-slide-up">
                {activeTab === 'overview' && <ParentOverview />}
                {activeTab === 'communication' && (
                  <SchoolCommunication role="parent" contextStudentId={selectedChild} />
                )}
                {activeTab === 'children' && (
                  <ChildrenList
                    onSelectChild={setSelectedChild}
                    selectedChild={selectedChild}
                    searchQuery={searchQuery}
                  />
                )}
                {activeTab === 'grades' &&
                  (selectedChild ? (
                    <ChildGrades studentId={selectedChild} searchQuery={searchQuery} />
                  ) : (
                    <Card>
                      <div className="text-center py-12 text-slate-500">
                        <p className="text-lg mb-2 font-medium text-slate-700">Sélectionnez un enfant</p>
                        <p className="text-sm">Choisissez un enfant dans « Mes enfants » pour voir ses notes.</p>
                      </div>
                    </Card>
                  ))}
                {activeTab === 'absences' &&
                  (selectedChild ? (
                    <ChildAbsences studentId={selectedChild} searchQuery={searchQuery} />
                  ) : (
                    <Card>
                      <div className="text-center py-12 text-slate-500">
                        <p className="text-lg mb-2 font-medium text-slate-700">Sélectionnez un enfant</p>
                        <p className="text-sm">Choisissez un enfant dans « Mes enfants » pour voir ses absences.</p>
                      </div>
                    </Card>
                  ))}
                {activeTab === 'assignments' &&
                  (selectedChild ? (
                    <ChildAssignments studentId={selectedChild} searchQuery={searchQuery} />
                  ) : (
                    <Card>
                      <div className="text-center py-12 text-slate-500">
                        <p className="text-lg mb-2 font-medium text-slate-700">Sélectionnez un enfant</p>
                        <p className="text-sm">Choisissez un enfant dans « Mes enfants » pour voir ses devoirs.</p>
                      </div>
                    </Card>
                  ))}
                {activeTab === 'schedule' &&
                  (selectedChild ? (
                    <ChildSchedule studentId={selectedChild} searchQuery={searchQuery} />
                  ) : (
                    <Card>
                      <div className="text-center py-12 text-slate-500">
                        <p className="text-lg mb-2 font-medium text-slate-700">Sélectionnez un enfant</p>
                        <p className="text-sm">Choisissez un enfant dans « Mes enfants » pour voir son emploi du temps.</p>
                      </div>
                    </Card>
                  ))}
                {activeTab === 'report-cards' &&
                  (selectedChild ? (
                    <ChildReportCards studentId={selectedChild} />
                  ) : (
                    <Card>
                      <div className="text-center py-12 text-slate-500">
                        <p className="text-lg mb-2 font-medium text-slate-700">Sélectionnez un enfant</p>
                        <p className="text-sm">Choisissez un enfant dans « Mes enfants » pour voir ses bulletins.</p>
                      </div>
                    </Card>
                  ))}
                {activeTab === 'conduct' &&
                  (selectedChild ? (
                    <ChildConduct studentId={selectedChild} />
                  ) : (
                    <Card>
                      <div className="text-center py-12 text-slate-500">
                        <p className="text-lg mb-2 font-medium text-slate-700">Sélectionnez un enfant</p>
                        <p className="text-sm">Choisissez un enfant dans « Mes enfants » pour voir sa conduite.</p>
                      </div>
                    </Card>
                  ))}
                {activeTab === 'payments' &&
                  (selectedChild ? (
                    <ChildPayments studentId={selectedChild} />
                  ) : (
                    <Card>
                      <div className="text-center py-12 text-slate-500">
                        <p className="text-lg mb-2 font-medium text-slate-700">Sélectionnez un enfant</p>
                        <p className="text-sm">Choisissez un enfant dans « Mes enfants » pour gérer ses paiements.</p>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default ParentDashboard;
