import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '../../components/Layout';
import TeacherOverview from '../../components/teacher/TeacherOverview';
import CoursesList from '../../components/teacher/CoursesList';
import GradesManager from '../../components/teacher/GradesManager';
import AttendanceManager from '../../components/teacher/AttendanceManager';
import AssignmentsManager from '../../components/teacher/AssignmentsManager';
import TeacherConduct from '../../components/teacher/TeacherConduct';
import TeacherPersonalProfile from '../../components/teacher/TeacherPersonalProfile';
import TeacherScheduleTab from '../../components/teacher/TeacherScheduleTab';
import TeacherSubjectsTab from '../../components/teacher/TeacherSubjectsTab';
import TeacherEvaluationsTab from '../../components/teacher/TeacherEvaluationsTab';
import TeacherLeavesTab from '../../components/teacher/TeacherLeavesTab';
import {
  FiLayout,
  FiBook,
  FiClipboard,
  FiUserCheck,
  FiFileText,
  FiSearch,
  FiTrendingUp,
  FiShield,
  FiUser,
  FiCalendar,
  FiLayers,
  FiStar,
  FiSun,
  FiCommand,
} from 'react-icons/fi';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { inactiveModuleIconClass } from '../../lib/navModuleIconClass';

const VALID_TAB_IDS = [
  'overview',
  'profile',
  'schedule',
  'subjects',
  'evaluation',
  'leaves',
  'courses',
  'grades',
  'attendance',
  'assignments',
  'conduct',
] as const;

type TabId = (typeof VALID_TAB_IDS)[number];

type TabDef = {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
};

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: TabDef[] = useMemo(
    () => [
      { id: 'overview', label: 'Vue d’ensemble', icon: FiLayout, color: 'from-emerald-500 to-teal-600', description: 'Synthèse pédagogique et charges de travail' },
      { id: 'profile', label: 'Profil & infos', icon: FiUser, color: 'from-teal-500 to-cyan-600', description: 'Coordonnées et informations professionnelles' },
      { id: 'schedule', label: 'Emploi du temps', icon: FiCalendar, color: 'from-green-500 to-emerald-600', description: 'Planning des cours et créneaux' },
      { id: 'subjects', label: 'Matières', icon: FiLayers, color: 'from-lime-500 to-green-600', description: 'Matières enseignées et rattachements' },
      { id: 'evaluation', label: 'Évaluation RH', icon: FiStar, color: 'from-amber-500 to-orange-600', description: 'Entretiens et évaluations internes' },
      { id: 'leaves', label: 'Congés & absences', icon: FiSun, color: 'from-sky-500 to-teal-600', description: 'Demandes de congé et absences' },
      { id: 'courses', label: 'Mes cours', icon: FiBook, color: 'from-emerald-600 to-green-700', description: 'Groupes, contenus et suivi par classe' },
      { id: 'grades', label: 'Notes', icon: FiClipboard, color: 'from-violet-500 to-purple-600', description: 'Saisie et suivi des évaluations' },
      { id: 'attendance', label: 'Présences', icon: FiUserCheck, color: 'from-cyan-500 to-teal-600', description: 'Appels et assiduité' },
      { id: 'assignments', label: 'Devoirs', icon: FiFileText, color: 'from-indigo-500 to-blue-600', description: 'Travaux donnés et rendus' },
      { id: 'conduct', label: 'Conduite', icon: FiShield, color: 'from-rose-500 to-pink-600', description: 'Appréciations de comportement' },
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
    router.replace(`/teacher?${params.toString()}`);
  };

  const activeMeta = tabs.find((t) => t.id === activeTab) ?? tabs[0];
  const ActiveTabIcon = activeMeta.icon;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <Layout user={user} onLogout={logout} role="TEACHER">
      <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-emerald-50/50">
        <aside className="hidden lg:flex w-64 flex-col shrink-0 sticky top-16 h-[calc(100vh-4rem)] bg-white/75 backdrop-blur-xl border-r border-slate-200/80 shadow-sm">
          <div className="p-2 flex flex-col flex-1 min-h-0">
            <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 shrink-0">
              Enseignant
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
                      Pédagogie, emploi du temps, RH
                    </p>
                    <p className="text-[8px] sm:text-[9px] text-slate-400 mt-0 tabular-nums">
                      {format(new Date(), "EEE d MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-[9px] font-semibold shrink-0">
                    <FiTrendingUp className="w-3 h-3" />
                    Enseignant
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

                <div className="relative w-full max-w-xl">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">
                    <FiSearch className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher cours, élèves, devoirs…"
                    className="w-full pl-8 pr-2.5 py-1 sm:py-1.5 bg-white/90 border border-slate-200 rounded-md text-[10px] sm:text-xs focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-400"
                    aria-label="Recherche dans l’espace enseignant"
                  />
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
                      Enseignant
                    </span>
                  </div>
                </div>
              </div>

              <div className="animate-slide-up">
                {activeTab === 'overview' && <TeacherOverview />}
                {activeTab === 'profile' && <TeacherPersonalProfile />}
                {activeTab === 'schedule' && <TeacherScheduleTab />}
                {activeTab === 'subjects' && <TeacherSubjectsTab />}
                {activeTab === 'evaluation' && <TeacherEvaluationsTab />}
                {activeTab === 'leaves' && <TeacherLeavesTab />}
                {activeTab === 'courses' && <CoursesList searchQuery={searchQuery} />}
                {activeTab === 'grades' && <GradesManager searchQuery={searchQuery} />}
                {activeTab === 'attendance' && <AttendanceManager searchQuery={searchQuery} />}
                {activeTab === 'assignments' && <AssignmentsManager searchQuery={searchQuery} />}
                {activeTab === 'conduct' && <TeacherConduct />}
              </div>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherDashboard;
