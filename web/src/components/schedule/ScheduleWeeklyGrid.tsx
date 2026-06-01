'use client';

import { useMemo } from 'react';
import {
  DEFAULT_SCHEDULE_START,
  SCHEDULE_DAY_END,
  SCHEDULE_TIMELINE_PX_PER_MINUTE,
  scheduleSlotDurationHours,
  scheduleTimeToMinutes,
  scheduleTimelineHeightPx,
  scheduleTimelineTopPx,
} from '@/lib/scheduleTimeSlots';

export type ScheduleGridSlot = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  courseName: string;
  courseCode?: string;
  teacherName?: string;
  room?: string | null;
};

const WEEK_DAYS = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
] as const;

type ScheduleWeeklyGridProps = {
  slots: ScheduleGridSlot[];
  title?: string;
};

export default function ScheduleWeeklyGrid({ slots, title }: ScheduleWeeklyGridProps) {
  const activeDays = useMemo(() => {
    const used = new Set(slots.map((s) => s.dayOfWeek));
    const days = WEEK_DAYS.filter((d) => used.has(d.value));
    return days.length > 0 ? days : WEEK_DAYS.slice(0, 5);
  }, [slots]);

  const byDay = useMemo(() => {
    const map: Record<number, ScheduleGridSlot[]> = {};
    for (const day of activeDays) {
      map[day.value] = slots
        .filter((s) => s.dayOfWeek === day.value)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [slots, activeDays]);

  const timelineHeight = scheduleTimelineHeightPx(
    DEFAULT_SCHEDULE_START,
    SCHEDULE_DAY_END,
    SCHEDULE_TIMELINE_PX_PER_MINUTE,
  );

  const hourLabels = useMemo(() => {
    const start = scheduleTimeToMinutes(DEFAULT_SCHEDULE_START);
    const end = scheduleTimeToMinutes(SCHEDULE_DAY_END);
    if (start === null || end === null) return [];
    const labels: { label: string; top: number }[] = [];
    for (let m = start; m <= end; m += 60) {
      const hh = Math.floor(m / 60);
      const mm = m % 60;
      labels.push({
        label: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
        top: (m - start) * SCHEDULE_TIMELINE_PX_PER_MINUTE,
      });
    }
    return labels;
  }, []);

  if (slots.length === 0) return null;

  return (
    <div className="space-y-2">
      {title ? <h3 className="text-sm font-bold text-stone-800">{title}</h3> : null}
      <div className="overflow-x-auto rounded-xl border border-stone-200/90 bg-white">
        <div
          className="grid min-w-[640px] gap-0"
          style={{
            gridTemplateColumns: `4rem repeat(${activeDays.length}, minmax(120px, 1fr))`,
          }}
        >
          <div className="border-b border-stone-200 bg-stone-50 px-2 py-2 text-xs font-semibold text-stone-700">
            Heure
          </div>
          {activeDays.map((day) => (
            <div
              key={day.value}
              className="border-b border-l border-stone-200 bg-stone-50 px-2 py-2 text-xs font-semibold text-stone-700"
            >
              {day.label}
            </div>
          ))}

          <div
            className="relative border-stone-200 bg-stone-50/80 text-[10px] text-stone-500"
            style={{ height: timelineHeight }}
          >
            {hourLabels.map(({ label, top }) => (
              <span
                key={label}
                className="absolute left-1 -translate-y-1/2 tabular-nums"
                style={{ top }}
              >
                {label}
              </span>
            ))}
          </div>

          {activeDays.map((day) => (
            <div
              key={day.value}
              className="relative border-l border-stone-200 bg-white"
              style={{ height: timelineHeight }}
            >
              {(byDay[day.value] ?? []).map((cellSlot) => {
                const top = scheduleTimelineTopPx(cellSlot.startTime);
                const durationMin = scheduleSlotDurationHours(cellSlot.startTime, cellSlot.endTime) * 60;
                const height = Math.max(durationMin * SCHEDULE_TIMELINE_PX_PER_MINUTE, 28);
                if (top === null) return null;

                return (
                  <div
                    key={cellSlot.id}
                    className="absolute inset-x-1 z-10 overflow-hidden rounded-lg border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-1.5 text-[11px] leading-snug shadow-sm"
                    style={{ top, height }}
                  >
                    <p className="font-semibold text-violet-950">{cellSlot.courseName}</p>
                    {cellSlot.teacherName ? (
                      <p className="truncate text-stone-600">{cellSlot.teacherName}</p>
                    ) : null}
                    <p className="tabular-nums text-stone-500">
                      {cellSlot.startTime}–{cellSlot.endTime}
                      {cellSlot.room ? ` · ${cellSlot.room}` : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
