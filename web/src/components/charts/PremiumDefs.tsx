import { PREMIUM_GRADIENT_PAIRS } from "./premiumPalette";

type PieGradientsProps = {
  count: number;
  idPrefix?: string;
};

/** Dégradés pour chaque secteur du camembert */
export function PieGradients({ count, idPrefix = "premium-pie" }: PieGradientsProps) {
  return (
    <defs>
      {Array.from({ length: count }).map((_, i) => {
        const [c0, c1] = PREMIUM_GRADIENT_PAIRS[i % PREMIUM_GRADIENT_PAIRS.length];
        return (
          <linearGradient
            key={i}
            id={`${idPrefix}-${i}`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0%" stopColor={c0} stopOpacity={1} />
            <stop offset="100%" stopColor={c1} stopOpacity={1} />
          </linearGradient>
        );
      })}
    </defs>
  );
}

type LineAreaGradientProps = {
  id: string;
  colorFrom?: string;
  colorTo?: string;
};

export function LineAreaGradient({
  id,
  colorFrom = "#6366f1",
  colorTo = "#a5b4fc",
}: LineAreaGradientProps) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={colorFrom} stopOpacity={0.35} />
        <stop offset="100%" stopColor={colorTo} stopOpacity={0.02} />
      </linearGradient>
    </defs>
  );
}

type BarGradientProps = { id: string; from?: string; to?: string };

export function BarGradientSingle({
  id,
  from = "#6366f1",
  to = "#8b5cf6",
}: BarGradientProps) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={from} />
        <stop offset="100%" stopColor={to} />
      </linearGradient>
    </defs>
  );
}

type MultiBarGradientsProps = { count: number; idPrefix?: string };

export function BarGradientsMulti({ count, idPrefix = "premium-bar" }: MultiBarGradientsProps) {
  return (
    <defs>
      {Array.from({ length: count }).map((_, i) => {
        const [c0, c1] = PREMIUM_GRADIENT_PAIRS[i % PREMIUM_GRADIENT_PAIRS.length];
        return (
          <linearGradient key={i} id={`${idPrefix}-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c0} />
            <stop offset="100%" stopColor={c1} />
          </linearGradient>
        );
      })}
    </defs>
  );
}

/** Dégradé radial pour radar / halos */
export function RadarFillGradient({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={id} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
        <stop offset="70%" stopColor="#8b5cf6" stopOpacity={0.15} />
        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
      </radialGradient>
    </defs>
  );
}

/** Ombre portée SVG pour barres / secteurs */
export function ChartDropShadowFilter({ id = "premium-chart-shadow" }: { id?: string }) {
  return (
    <defs>
      <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.12" />
      </filter>
    </defs>
  );
}

/** Ligne / courbe cumulative (axe secondaire) */
export function LineStrokeGradient({
  id,
  from = "#0ea5e9",
  to = "#6366f1",
}: {
  id: string;
  from?: string;
  to?: string;
}) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={from} />
        <stop offset="100%" stopColor={to} />
      </linearGradient>
    </defs>
  );
}
