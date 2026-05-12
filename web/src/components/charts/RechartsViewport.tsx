"use client";

import React, { useLayoutEffect, useRef, useState, type ReactElement } from "react";

type RechartsViewportProps = {
  /** Hauteur fixe en px */
  height: number;
  className?: string;
  /** Enfant unique : PieChart, BarChart, ComposedChart, etc. */
  children: ReactElement;
};

/** Si le parent n’a pas encore de largeur mesurable (premier frame). */
const FALLBACK_WIDTH = 320;

const MIN_USABLE_WIDTH = 24;

/**
 * Conteneur pour Recharts **sans** `ResponsiveContainer`.
 *
 * `ResponsiveContainer` + largeur fixe ou erratique peut produire une largeur **supérieure**
 * à la colonne réelle : sous une carte `overflow-hidden`, le SVG peut être entièrement
 * décalé et sembler « vide ». On mesure la boîte avec `ResizeObserver` et on injecte
 * `width` / `height` directement dans le composant Chart enfant.
 */
export function RechartsViewport({ height, className = "", children }: RechartsViewportProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(FALLBACK_WIDTH);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.floor(rect.width);
      if (w >= MIN_USABLE_WIDTH) {
        setChartWidth(w);
      } else {
        setChartWidth((prev) => (prev >= MIN_USABLE_WIDTH ? prev : FALLBACK_WIDTH));
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const chart = React.isValidElement(children)
    ? React.cloneElement(children as ReactElement<{ width?: number; height?: number }>, {
        width: chartWidth,
        height,
      })
    : children;

  return (
    <div
      ref={wrapRef}
      className={`w-full max-w-full ${className}`}
      style={{
        height,
        minHeight: height,
        minWidth: 0,
        position: "relative",
      }}
    >
      {chart}
    </div>
  );
}
