import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '../../components/Layout';
import EducatorOverview from '../../components/educator/EducatorOverview';
import StudentsList from '../../components/educator/StudentsList';
import ConductManager from '../../components/educator/ConductManager';
import { FiLayout, FiUsers, FiShield, FiSearch, FiTrendingUp, FiCommand } from 'react-icons/fi';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { inactiveModuleIconClass } from '../../lib/navModuleIconClass';

const VALID_TAB_IDS = ['overview', 'students', 'conduct'] as const;
type TabId = (typeof VALID_TAB_IDS)[number];

type TabDef = {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
};

const EducatorDashboard = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: TabDef[] = useMemo(
    () => [
      { id: 'overview', label: 'Vue d’ensemble', icon: FiLayout, color: 'from-violet-500 to-indigo-600', description: 'Indicateurs de conduite et priorités du jour' },
      { id: 'students', label: 'Élèves', icon: FiUsers, color: 'from-indigo-500 to-purple-600', description: 'Liste et profils des élèves suivis' },
      { id: 'conduct', label: 'Conduite', icon: FiShield, color: 'from-purple-500 to-fuchsia-600', description: 'Évaluations et historique comportemental' },
    ],
    []
  );

  useEffect(() => {
    const handleNavigateTab = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail && VALID_TAB_IDS.includes(detail as TabId)) {
        setActiveTab(detail as TabId);
        router.replace(`/educator?tab=${encodeURIComponent(detail)}`);
      }
    };

    window.addEventListener('navigate-tab', handleNavigateTab as EventListener);
    return () => {
      window.removeEventListener('navigate-tab', handleNavigateTab as EventListener);
    };
  }, [router]);

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
    router.replace(`/educator?${params.toString()}`);
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
    <Layout user={user} onLogout={logout} role="EDUCATOR">
      <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-violet-50/45">
        <aside className="hidden lg:flex w-64 flex-col shrink-0 sticky top-16 h-[calc(100vh-4rem)] bg-white/75 backdrop-blur-xl border-r border-slate-200/80 shadow-sm">
          <div className="p-2 flex flex-col flex-1 min-h-0">
            <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 shrink-0 leading-tight">
              Éducateur
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
                      Conduite et accompagnement
                    </p>
                    <p className="text-[8px] sm:text-[9px] text-slate-400 mt-0 tabular-nums">
                      {format(new Date(), "EEE d MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200/80 text-violet-900 text-[9px] font-semibold shrink-0">
                    <FiTrendingUp className="w-3 h-3" />
                    Éducateur
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
                            ? `bg-gradient-to-r ${tab.color} text-white shadow-sm`
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
                    placeholder="Rechercher un élève ou une fiche…"
                    className="w-full pl-8 pr-2.5 py-1 sm:py-1.5 bg-white/90 border border-slate-200 rounded-md text-[10px] sm:text-xs focus:ring-1 focus:ring-violet-500/20 focus:border-violet-400"
                    aria-label="Recherche dans l’espace éducateur"
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
                      Éducateur
                    </span>
                  </div>
                </div>
              </div>

              <div className="animate-slide-up">
                {activeTab === 'overview' && <EducatorOverview searchQuery={searchQuery} />}
                {activeTab === 'students' && <StudentsList searchQuery={searchQuery} />}
                {activeTab === 'conduct' && <ConductManager searchQuery={searchQuery} />}
              </div>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default EducatorDashboard;
