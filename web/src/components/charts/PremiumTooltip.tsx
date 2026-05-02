"use client";

type PayloadEntry = {
  name?: string;
  value?: number | string;
  dataKey?: string | number;
  color?: string;
  payload?: Record<string, unknown> & { fill?: string };
};

type PremiumTooltipProps = {
  active?: boolean;
  /** Recharts envoie un tableau typé largement — on le normalise en interne. */
  payload?: unknown;
  label?: string | number;
  valueSuffix?: string;
  valueLabel?: string;
};

/**
 * Tooltip type « glass » pour Recharts — fond flouté, bordure légère, typographie nette.
 * Props volontairement lâches pour rester compatible avec tous les graphiques Recharts.
 */
export function PremiumTooltip({
  active,
  payload,
  label,
  valueSuffix = "",
  valueLabel,
}: PremiumTooltipProps) {
  const rows = Array.isArray(payload) ? (payload as PayloadEntry[]) : [];
  if (!active || !rows.length) {
    return null;
  }

  return (
    <div className="relative min-w-[190px] max-w-[300px] rounded-2xl p-[1px] shadow-[0_28px_56px_-12px_rgba(15,23,42,0.35)] backdrop-blur-xl bg-gradient-to-br from-indigo-200/80 via-white/40 to-fuchsia-200/60">
      <div className="rounded-[15px] bg-white/[0.97] px-4 py-3.5 ring-1 ring-white/80">
      {label != null && label !== "" && (
        <p className="mb-2.5 border-b border-slate-100/90 pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
          {String(label)}
        </p>
      )}
      <ul className="space-y-2">
        {rows.map((entry, i) => {
          const name = entry.name ?? String(entry.dataKey ?? "Valeur");
          const val = entry.value;
          const color = entry.color ?? entry.payload?.fill ?? "#6366f1";
          const display =
            typeof val === "number"
              ? Number.isInteger(val)
                ? String(val)
                : val.toFixed(2)
              : String(val ?? "—");
          return (
            <li key={i} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm ring-2 ring-white"
                  style={{ background: color }}
                />
                <span className="font-medium">{name}</span>
              </span>
              <span className="tabular-nums font-bold text-slate-900">
                {display}
                {valueSuffix}
                {valueLabel ? ` ${valueLabel}` : ""}
              </span>
            </li>
          );
        })}
      </ul>
      </div>
    </div>
  );
}
