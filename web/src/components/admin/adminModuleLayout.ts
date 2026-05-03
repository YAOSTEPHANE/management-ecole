/**
 * Typographie et grilles compactes pour les modules admin (sidebar).
 * Aligné sur « Gestion académique » et « Notation & évaluation ».
 */
export const ADM = {
  root: 'space-y-5 text-sm',
  section: 'space-y-4',
  h2: 'text-base font-semibold text-gray-900',
  intro: 'text-xs text-gray-500 mt-0.5 leading-relaxed',
  tabRow: 'flex flex-wrap gap-2 border-b border-gray-200 pb-2',
  tabIcon: 'w-3.5 h-3.5 shrink-0 opacity-80',
  tabBtn: (active: boolean, activeClass: string) =>
    `inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
      active ? activeClass : 'text-gray-600 hover:bg-gray-100'
    }`,
  grid3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3',
  grid4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3',
  grid5: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3',
  statCard: 'p-2.5 sm:p-3',
  statLabel: 'text-[10px] font-medium text-gray-500 uppercase tracking-wide leading-tight',
  statVal: 'text-lg font-bold text-gray-900 mt-0.5 tabular-nums leading-none',
  statValTone: 'text-lg font-bold mt-0.5 tabular-nums leading-none',
  statHint: 'text-[11px] text-gray-500 mt-1 leading-snug',
  olSm: 'text-[11px] text-gray-700 mt-1.5 space-y-0.5 list-decimal list-inside leading-snug',
  helpCard: 'p-4 border border-gray-200',
  helpTitle: 'text-sm font-semibold text-gray-900 mb-1.5',
  helpOl: 'text-xs text-gray-700 space-y-1.5 list-decimal list-inside leading-relaxed',
  helpUl: 'text-xs text-gray-600 space-y-1.5 list-disc list-inside leading-relaxed',
  /** Modules avec bandeau dégradé + onglets larges */
  pageRoot: 'space-y-5 text-sm',
  heroTitle: 'text-xl sm:text-2xl font-black mb-1 leading-tight',
  heroSub: 'text-sm leading-snug',
  heroStatNum: 'text-lg font-bold tabular-nums',
  heroStatLbl: 'text-xs',
  bigTabRow: 'flex items-center space-x-2 overflow-x-auto scrollbar-hide pb-2',
  bigTabBtn: (active: boolean, activeGradient: string) =>
    `relative group flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-all duration-300 whitespace-nowrap ${
      active ? `${activeGradient} text-white shadow-lg` : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`,
  bigTabIcon: 'w-4 h-4',
} as const;
