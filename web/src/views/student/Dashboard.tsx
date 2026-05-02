import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '../../components/Layout';
import StudentOverview from '../../components/student/StudentOverview';
import StudentProfile from '../../components/student/StudentProfile';
import StudentGrades from '../../components/student/StudentGrades';
import StudentSchedule from '../../components/student/StudentSchedule';
import StudentAbsences from '../../components/student/StudentAbsences';
import StudentAssignments from '../../components/student/StudentAssignments';
import StudentConduct from '../../components/student/StudentConduct';
import StudentPayments from '../../components/student/StudentPayments';
import StudentAcademicHistory from '../../components/student/StudentAcademicHistory';
import IdentityDocumentsPanel from '../../components/identity/IdentityDocumentsPanel';
import SchoolCommunication from '../../components/portal/SchoolCommunication';
import {
  FiLayout,
  FiUser,
  FiAward,
  FiCalendar,
  FiAlertCircle,
  FiFileText,
  FiSearch,
  FiBook,
  FiStar,
  FiX,
  FiFilter,
  FiDollarSign,
  FiArchive,
  FiCreditCard,
  FiMessageCircle,
  FiCommand,
} from 'react-icons/fi';
import Card from '../../components/ui/Card';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { inactiveModuleIconClass } from '../../lib/navModuleIconClass';

const VALID_TAB_IDS = [
  'overview',
  'profile',
  'academic-history',
  'identity-documents',
  'grades',
  'schedule',
  'absences',
  'assignments',
  'conduct',
  'payments',
  'messages',
] as const;

type TabId = (typeof VALID_TAB_IDS)[number];

type TabDef = {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
};

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [searchCategory, setSearchCategory] = useState<
    'all' | 'grades' | 'absences' | 'assignments' | 'schedule' | 'conduct'
  >('all');
  const [searchDateRange, setSearchDateRange] = useState<'all' | 'week' | 'month' | 'semester'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const tabs: TabDef[] = useMemo(
    () => [
      { id: 'overview', label: 'Vue d’ensemble', icon: FiLayout, color: 'from-violet-500 to-purple-600', description: 'Résumé de votre scolarité et accès rapides' },
      { id: 'profile', label: 'Profil', icon: FiUser, color: 'from-fuchsia-500 to-pink-600', description: 'Coordonnées et informations personnelles' },
      { id: 'academic-history', label: 'Historique scolaire', icon: FiArchive, color: 'from-indigo-500 to-violet-600', description: 'Parcours et données académiques' },
      { id: 'identity-documents', label: 'Documents d’identité', icon: FiCreditCard, color: 'from-slate-600 to-slate-800', description: 'Pièces officielles et justificatifs' },
      { id: 'grades', label: 'Notes', icon: FiAward, color: 'from-purple-500 to-fuchsia-600', description: 'Résultats et évaluations' },
      { id: 'schedule', label: 'Emploi du temps', icon: FiCalendar, color: 'from-pink-500 to-rose-600', description: 'Planning des cours' },
      { id: 'absences', label: 'Absences', icon: FiAlertCircle, color: 'from-amber-500 to-orange-600', description: 'Assiduité et justifications' },
      { id: 'assignments', label: 'Devoirs', icon: FiFileText, color: 'from-cyan-500 to-teal-600', description: 'Travaux à rendre et rendus' },
      { id: 'conduct', label: 'Conduite', icon: FiStar, color: 'from-rose-500 to-pink-600', description: 'Comportement et appréciations' },
      { id: 'payments', label: 'Paiements', icon: FiDollarSign, color: 'from-emerald-500 to-green-600', description: 'Frais et règlements en ligne' },
      { id: 'messages', label: 'Messages école', icon: FiMessageCircle, color: 'from-blue-500 to-indigo-600', description: 'Échanges avec l’administration' },
    ],
    []
  );

  useEffect(() => {
    const t = searchParams?.get('tab');
    if (t && VALID_TAB_IDS.includes(t as TabId)) {
      setActiveTab(t as TabId);
    }
  }, [searchParams]);

  const changeTab = (tabId: TabId) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('tab', tabId);
    router.replace(`/student?${params.toString()}`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSearchQuery('');
        setShowSearchFilters(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchFilters(false);
      }
    };
    if (showSearchFilters) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSearchFilters]);

  const activeMeta = tabs.find((t) => t.id === activeTab) ?? tabs[0];
  const ActiveTabIcon = activeMeta.icon;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const enrollmentStatus = (user as { studentProfile?: { enrollmentStatus?: string } } | null)
    ?.studentProfile?.enrollmentStatus;

  return (
    <Layout user={user} onLogout={logout} role="STUDENT">
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-fuchsia-50/40">
        {enrollmentStatus === 'GRADUATED' && (
          <div className="bg-sky-50/90 border-b border-sky-200/80 backdrop-blur-sm shrink-0">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <p className="text-sm text-sky-900">
                <span className="font-semibold">Profil diplômé·e</span> — vous conservez l’accès à cet espace pour
                consulter votre historique et vos documents.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-1 min-h-0">
          <aside className="hidden lg:flex w-64 flex-col shrink-0 sticky top-16 h-[calc(100vh-4rem)] bg-white/75 backdrop-blur-xl border-r border-slate-200/80 shadow-sm">
            <div className="p-2 flex flex-col flex-1 min-h-0">
              <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 shrink-0">
                Élève
              </p>
              <nav className="space-y-0.5 flex-1 overflow-y-auto min-h-0 pr-0.5 text-[10px] leading-tight">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => changeTab(tab.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md font-medium transition-all ${
                        isActive
                          ? `bg-gradient-to-r ${tab.color} text-white shadow-sm`
                          : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-white' : inactiveModuleIconClass(tab.color)
                        }`}
                      />
                      <span className="truncate text-left">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="flex-1 flex flex-col min-w-0">
            <header className="sticky top-16 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm shadow-slate-900/5 shrink-0">
              <div className="max-w-[1200px] mx-auto px-2.5 sm:px-5 lg:px-6 py-1.5 sm:py-2">
                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1.5 md:gap-2">
                    <div className="min-w-0">
                      <h1 className="font-display text-sm sm:text-base md:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                        {getGreeting()}, {user?.firstName}
                      </h1>
                      <p className="text-slate-500 text-[9px] sm:text-[10px] mt-0 line-clamp-1">
                        Progression et scolarité
                      </p>
                      <p className="text-[8px] sm:text-[9px] text-slate-400 mt-0 tabular-nums">
                        {format(new Date(), "EEE d MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-fuchsia-50 border border-fuchsia-200/80 text-fuchsia-900 text-[9px] font-semibold shrink-0">
                      <FiBook className="w-3 h-3" />
                      Élève
                    </div>
                  </div>

                  <div className="lg:hidden flex gap-1 overflow-x-auto scrollbar-hide pb-0.5 -mx-1 px-1 snap-x snap-mandatory scroll-pl-2 touch-pan-x overscroll-x-contain">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => changeTab(tab.id)}
                          className={`shrink-0 snap-start inline-flex items-center gap-1 px-2 py-1.5 min-h-[34px] rounded-md text-[9px] font-semibold ${
                            isActive
                              ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActive ? 'text-white' : inactiveModuleIconClass(tab.color)
                            }`}
                          />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative w-full max-w-xl" ref={searchContainerRef}>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">
                        <FiSearch className="w-3.5 h-3.5" />
                      </div>
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowSearchFilters(true)}
                        placeholder="Rechercher (Ctrl+K)…"
                        className="w-full pl-8 pr-24 py-1 sm:py-1.5 bg-white/90 border border-slate-200 rounded-md text-[10px] sm:text-xs focus:ring-1 focus:ring-fuchsia-500/20 focus:border-fuchsia-400"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          aria-label="Effacer la recherche"
                          title="Effacer la recherche"
                          onClick={() => {
                            setSearchQuery('');
                            setSearchCategory('all');
                            setSearchDateRange('all');
                          }}
                          className="absolute inset-y-0 right-12 pr-2 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          <FiX className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label={showSearchFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
                        title="Filtres de recherche"
                        onClick={() => setShowSearchFilters(!showSearchFilters)}
                        className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                          showSearchFilters || searchCategory !== 'all' || searchDateRange !== 'all'
                            ? 'text-fuchsia-600'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <FiFilter className="w-5 h-5" />
                      </button>
                    </div>

                    {showSearchFilters && (
                      <Card
                        variant="premium"
                        className="absolute top-full mt-2 w-full z-50 !p-4 border border-fuchsia-100/80"
                        hover={false}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-slate-900 text-sm">Filtres</h3>
                          <button
                            type="button"
                            aria-label="Fermer les filtres"
                            title="Fermer"
                            onClick={() => setShowSearchFilters(false)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <FiX className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { value: 'all' as const, label: 'Tout', icon: FiLayout },
                            { value: 'grades' as const, label: 'Notes', icon: FiAward },
                            { value: 'absences' as const, label: 'Absences', icon: FiAlertCircle },
                            { value: 'assignments' as const, label: 'Devoirs', icon: FiFileText },
                            { value: 'schedule' as const, label: 'EDT', icon: FiCalendar },
                            { value: 'conduct' as const, label: 'Conduite', icon: FiStar },
                          ].map((cat) => {
                            const Icon = cat.icon;
                            return (
                              <button
                                key={cat.value}
                                type="button"
                                onClick={() => {
                                  setSearchCategory(cat.value);
                                  if (cat.value !== 'all') {
                                    changeTab(cat.value);
                                  }
                                }}
                                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                                  searchCategory === cat.value
                                    ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-800'
                                    : 'border-slate-200 hover:border-fuchsia-200 text-slate-700'
                                }`}
                              >
                                <Icon className="w-4 h-4 mb-1" />
                                {cat.label}
                              </button>
                            );
                          })}
                        </div>
                        <label htmlFor="student-search-period" className="block text-xs font-medium text-slate-600 mt-3 mb-1">
                          Période
                        </label>
                        <select
                          id="student-search-period"
                          aria-label="Période pour la recherche"
                          value={searchDateRange}
                          onChange={(e) => setSearchDateRange(e.target.value as typeof searchDateRange)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                        >
                          <option value="all">Toutes les périodes</option>
                          <option value="week">7 derniers jours</option>
                          <option value="month">30 derniers jours</option>
                          <option value="semester">6 derniers mois</option>
                        </select>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 sm:px-5 lg:px-6 py-3 sm:py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
                        <p className="text-[9px] sm:text-xs text-slate-500 mt-0 line-clamp-2">{activeMeta.description}</p>
                      </div>
                      <span className="hidden sm:inline-flex items-center gap-1 ml-auto px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-700 shrink-0">
                        <FiCommand className="w-3 h-3" />
                        Élève
                      </span>
                    </div>
                  </div>
                </div>

                <div className="animate-slide-up">
                  {activeTab === 'overview' && (
                    <StudentOverview searchQuery={searchQuery} searchCategory={searchCategory} />
                  )}
                  {activeTab === 'profile' && <StudentProfile searchQuery={searchQuery} />}
                  {activeTab === 'academic-history' && <StudentAcademicHistory searchQuery={searchQuery} />}
                  {activeTab === 'identity-documents' && <IdentityDocumentsPanel mode="student" />}
                  {activeTab === 'grades' && (
                    <StudentGrades
                      searchQuery={searchQuery}
                      searchCategory={searchCategory}
                      searchDateRange={searchDateRange}
                    />
                  )}
                  {activeTab === 'schedule' && <StudentSchedule searchQuery={searchQuery} />}
                  {activeTab === 'absences' && (
                    <StudentAbsences searchQuery={searchQuery} searchDateRange={searchDateRange} />
                  )}
                  {activeTab === 'assignments' && (
                    <StudentAssignments
                      searchQuery={searchQuery}
                      searchCategory={searchCategory}
                      searchDateRange={searchDateRange}
                    />
                  )}
                  {activeTab === 'conduct' && <StudentConduct searchQuery={searchQuery} />}
                  {activeTab === 'payments' && <StudentPayments />}
                  {activeTab === 'messages' && <SchoolCommunication role="student" />}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
