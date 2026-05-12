/** Paires [from, to] pour dégradés SVG — cohérentes sur tous les graphiques */
export const PREMIUM_GRADIENT_PAIRS: readonly [string, string][] = [
  ['#6366f1', '#8b5cf6'],
  ['#0ea5e9', '#2563eb'],
  ['#10b981', '#059669'],
  ['#f59e0b', '#ea580c'],
  ['#ec4899', '#db2777'],
  ['#06b6d4', '#0891b2'],
  ['#a855f7', '#7c3aed'],
  ['#14b8a6', '#0d9488'],
];

export const PREMIUM_SOLID = PREMIUM_GRADIENT_PAIRS.map(([a, b]) => a);

/** Palette institutionnelle des tableaux de bord : uniquement bleu / rouge */
export const CHART_BLUE = '#2563eb';
export const CHART_RED = '#dc2626';

/** Alternance bleu (pair) / rouge (impair) pour séries sans sémantique fixe */
export function chartBlueRed(index: number): string {
  return index % 2 === 0 ? CHART_BLUE : CHART_RED;
}

export const CHART_GRID = {
  stroke: '#e2e8f0',
  strokeDasharray: '4 8' as const,
  strokeOpacity: 0.85,
  vertical: false,
};

/** Grille plus légère pour cartes « ultra-premium » */
export const CHART_GRID_SOFT = {
  stroke: '#f1f5f9',
  strokeDasharray: '3 10' as const,
  strokeOpacity: 0.95,
  vertical: false,
};

export const CHART_AXIS_TICK = {
  fill: '#64748b',
  fontSize: 10,
  fontWeight: 500,
};

export const CHART_MARGIN_COMPACT = { top: 12, right: 12, left: 4, bottom: 4 };
export const CHART_MARGIN_TILTED = { top: 12, right: 12, left: 4, bottom: 72 };
/** Composed (bar + axe % à droite) */
export const CHART_MARGIN_COMPOSED = { top: 16, right: 20, left: 8, bottom: 8 };

/** Durée d’animation Recharts (ms) — tableaux de bord et rapports */
export const CHART_ANIMATION_MS = 720;

export const CHART_ANIMATION_EASING = 'ease-out' as const;
