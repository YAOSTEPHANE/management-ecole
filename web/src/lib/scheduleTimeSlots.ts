/** Heure de début de la journée scolaire (premier créneau emploi du temps). */
export const DEFAULT_SCHEDULE_START = '07:00';
export const SCHEDULE_DAY_END = '18:00';

/** Intervalle d’étiquettes sur la grille (lisibilité). */
export const SCHEDULE_GRID_LABEL_EVERY_MINUTES = 15;

export function normalizeScheduleTime(value: string): string | null {
  const trimmed = value.trim();
  const m = trimmed.match(/^(\d{1,2})[:h.](\d{2})$/i);
  if (!m) return null;
  const hh = Math.min(23, parseInt(m[1], 10));
  const mm = Math.min(59, parseInt(m[2], 10));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function scheduleTimeToMinutes(value: string): number | null {
  const normalized = normalizeScheduleTime(value);
  if (!normalized) return null;
  const [h, m] = normalized.split(':').map(Number);
  return h * 60 + m;
}

/** Génère les marqueurs HH:mm de start à end inclus, par pas de stepMinutes. */
export function buildScheduleTimeSlots(
  start = DEFAULT_SCHEDULE_START,
  end = SCHEDULE_DAY_END,
  stepMinutes = 1,
): string[] {
  const startMin = scheduleTimeToMinutes(start);
  const endMin = scheduleTimeToMinutes(end);
  if (startMin === null || endMin === null || endMin < startMin) return [];

  const slots: string[] = [];
  for (let cursor = startMin; cursor <= endMin; cursor += stepMinutes) {
    const hh = Math.floor(cursor / 60);
    const mm = cursor % 60;
    slots.push(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  }
  return slots;
}

/** Créneaux minute par minute (7h → 18h) pour grilles et comparaisons. */
export const SCHEDULE_TIME_SLOTS = buildScheduleTimeSlots();

/** Créneau [start, end) chevauche l’intervalle [slotStart, slotEnd). */
export function scheduleOverlapsSlot(
  startTime: string,
  endTime: string,
  slotStart: string,
  slotEnd: string,
): boolean {
  const s = scheduleTimeToMinutes(startTime);
  const e = scheduleTimeToMinutes(endTime);
  const slotS = scheduleTimeToMinutes(slotStart);
  const slotE = scheduleTimeToMinutes(slotEnd);
  if (s === null || e === null || slotS === null || slotE === null) return false;
  if (e <= s) return false;
  return s < slotE && slotS < e;
}

/** @deprecated Utiliser scheduleOverlapsSlot */
export const scheduleOverlapsHalfHour = scheduleOverlapsSlot;

export function scheduleSlotDurationHours(startTime: string, endTime: string): number {
  const s = scheduleTimeToMinutes(startTime);
  const e = scheduleTimeToMinutes(endTime);
  if (s === null || e === null || e <= s) return 0;
  return (e - s) / 60;
}

export function isScheduleGridLabelMinute(
  time: string,
  everyMinutes = SCHEDULE_GRID_LABEL_EVERY_MINUTES,
): boolean {
  const mins = scheduleTimeToMinutes(time);
  const dayStart = scheduleTimeToMinutes(DEFAULT_SCHEDULE_START);
  if (mins === null || dayStart === null) return false;
  return (mins - dayStart) % everyMinutes === 0;
}

/** Affiche le cours sur la ligne correspondant à son heure de début exacte. */
export function scheduleStartsAtMinute(startTime: string, gridMinute: string): boolean {
  const start = normalizeScheduleTime(startTime);
  const slot = normalizeScheduleTime(gridMinute);
  return start !== null && slot !== null && start === slot;
}

/** Pixels par minute pour les grilles en position absolue. */
export const SCHEDULE_TIMELINE_PX_PER_MINUTE = 2;

export function scheduleTimelineHeightPx(
  start = DEFAULT_SCHEDULE_START,
  end = SCHEDULE_DAY_END,
  pxPerMinute = SCHEDULE_TIMELINE_PX_PER_MINUTE,
): number {
  const s = scheduleTimeToMinutes(start);
  const e = scheduleTimeToMinutes(end);
  if (s === null || e === null || e <= s) return 0;
  return (e - s) * pxPerMinute;
}

export function scheduleTimelineTopPx(
  time: string,
  dayStart = DEFAULT_SCHEDULE_START,
  pxPerMinute = SCHEDULE_TIMELINE_PX_PER_MINUTE,
): number | null {
  const t = scheduleTimeToMinutes(time);
  const start = scheduleTimeToMinutes(dayStart);
  if (t === null || start === null || t < start) return null;
  return (t - start) * pxPerMinute;
}
