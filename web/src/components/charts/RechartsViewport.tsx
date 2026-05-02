"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  cloneElement,
  type ReactElement,
} from "react";

type RechartsViewportProps = {
  /** Hauteur fixe en px */
  height: number;
  className?: string;
  children: ReactElement;
};

/**
 * Mesure le conteneur puis passe width/height aux graphiques Recharts.
 * ResponsiveContainer peut rester à 0×0 dans une grille flex si la largeur
 * n’est pas encore disponible au premier ResizeObserver.
 */
export function RechartsViewport({ height, className = "", children }: RechartsViewportProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let attempts = 0;
    const maxAttempts = 30;

    const update = () => {
      const rawW = el.clientWidth;
      const rawH = el.clientHeight || height;
      if (rawW < 2 && attempts < maxAttempts) {
        attempts += 1;
        raf = requestAnimationFrame(update);
        return;
      }
      const w = Math.max(2, Math.floor(rawW));
      const h = Math.max(2, Math.floor(rawH));
      setDims((prev) =>
        prev && prev.width === w && prev.height === h ? prev : { width: w, height: h }
      );
    };

    update();
    const ro = new ResizeObserver(() => {
      attempts = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [height]);

  return (
    <div
      ref={ref}
      className={`w-full min-w-[260px] min-h-0 max-w-full ${className}`}
      style={{ height, minHeight: height }}
    >
      {dims && dims.width >= 2 ? (
        cloneElement(children, {
          width: dims.width,
          height: dims.height,
        } as Record<string, unknown>)
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-white via-slate-50/90 to-indigo-50/40 text-xs font-semibold text-slate-500"
          aria-hidden
        >
          <span className="h-8 w-8 animate-pulse rounded-full bg-gradient-to-br from-indigo-200 to-violet-200 opacity-80" />
          Préparation du graphique…
        </div>
      )}
    </div>
  );
}
