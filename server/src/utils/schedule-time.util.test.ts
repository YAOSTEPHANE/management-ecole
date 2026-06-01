import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  normalizeScheduleTime,
  scheduleOverlapsSlot,
  scheduleSlotDurationHours,
} from './schedule-time.util';

describe('normalizeScheduleTime', () => {
  it('pad les heures et accepte H:mm', () => {
    assert.equal(normalizeScheduleTime('7:00'), '07:00');
    assert.equal(normalizeScheduleTime('08:30'), '08:30');
  });

  it('rejette les formats invalides', () => {
    assert.equal(normalizeScheduleTime(''), null);
    assert.equal(normalizeScheduleTime('abc'), null);
    assert.equal(normalizeScheduleTime('12'), null);
  });
});

describe('scheduleOverlapsSlot', () => {
  it('détecte un cours 08:30–09:30 sur le créneau 08:30–09:01', () => {
    assert.equal(scheduleOverlapsSlot('08:30', '09:30', '08:30', '09:01'), true);
  });

  it('normalise 7:00 pour comparaison de créneaux', () => {
    assert.equal(scheduleOverlapsSlot('7:00', '8:00', '07:00', '07:01'), true);
  });

  it('détecte un cours 08:07–08:45 sur la minute 08:07', () => {
    assert.equal(scheduleOverlapsSlot('08:07', '08:45', '08:07', '08:08'), true);
  });
});

describe('scheduleSlotDurationHours', () => {
  it('calcule 1,5 h pour 08:00–09:30', () => {
    assert.equal(scheduleSlotDurationHours('08:00', '09:30'), 1.5);
  });
});
