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
        <aside className="hidden lg:flex w-72 flex-col shrink-0 sticky top-16 h-[calc(100vh-4rem)] bg-white/75 backdrop-blur-xl border-r border-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.25)]">
          <div className="p-4 flex flex-col flex-1 min-h-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.14em] px-3 py-2 shrink-0">
              Espace enseignant
            </p>
            <nav className="space-y-1.5 flex-1 overflow-y-auto min-h-0 pr-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => changeTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg shadow-emerald-500/20`
                        : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'opacity-100' : 'opacity-80'}`} />
                    <span className="truncate text-left">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-16 z-20 bg-white/80 backdrop-blur-xl border-b border-white shadow-[0_20px_30px_-25px_rgba(15,23,42,0.45)] shrink-0">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="font-display text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                      {getGreeting()}, {user?.firstName}
                    </h1>
                    <p className="text-slate-500 text-sm md:text-base mt-1">
                      Espace pédagogique, emploi du temps, RH et suivi des élèves
                    </p>
                    <p className="text-xs text-slate-400 mt-1 tabular-nums">
                      {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-semibold">
                    <FiTrendingUp className="w-4 h-4" />
                    Portail enseignant
                  </div>
                </div>

                <div className="lg:hidden flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => changeTab(tab.id)}
                        className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                          isActive
                            ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-full max-w-xl">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FiSearch className="w-5 h-5" />
                  </div>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher cours, élèves, devoirs…"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/90 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-400"
                    aria-label="Recherche dans l’espace enseignant"
                  />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-[1200px] mx-auto space-y-6">
              <div className={`rounded-2xl bg-gradient-to-r ${activeMeta.color} p-[1px] shadow-lg shadow-emerald-500/10`}>
                <div className="rounded-[15px] bg-white/95 backdrop-blur-xl px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-r ${activeMeta.color} text-white flex items-center justify-center shadow-md shrink-0`}
                    >
                      <ActiveTabIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-slate-900">{activeMeta.label}</h2>
                      <p className="text-sm text-slate-500 mt-0.5">{activeMeta.description}</p>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1.5 ml-auto px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 shrink-0">
                      <FiCommand className="w-3.5 h-3.5" />
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
