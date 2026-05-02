"use client";

import { Sector } from "recharts";

type PieSectorProps = {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
};

/**
 * Secteur actif du donut : halo extérieur + bord blanc (effet « lift » premium).
 */
export function PremiumPieActiveShape(raw: PieSectorProps) {
  const {
    cx = 0,
    cy = 0,
    innerRadius = 0,
    outerRadius = 0,
    startAngle = 0,
    endAngle = 0,
    fill = "#6366f1",
  } = raw;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 12}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        fillOpacity={0.22}
        stroke="transparent"
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={3}
        style={{ filter: "drop-shadow(0 8px 16px rgba(15, 23, 42, 0.18))" }}
      />
    </g>
  );
}
