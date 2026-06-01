/** Normalise une heure « H:mm » ou « HH:mm » vers « HH:mm » (24h). */
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

/** Créneau [start, end) chevauche l’intervalle [slotStart, slotEnd) (précision minute). */
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

/** Durée d'un créneau en heures (ex. 08:00–09:30 → 1,5). */
export function scheduleSlotDurationHours(startTime: string, endTime: string): number {
  const s = scheduleTimeToMinutes(startTime);
  const e = scheduleTimeToMinutes(endTime);
  if (s === null || e === null || e <= s) return 0;
  return (e - s) / 60;
}

/** @deprecated Utiliser scheduleOverlapsSlot */
export const scheduleOverlapsHalfHour = scheduleOverlapsSlot;
