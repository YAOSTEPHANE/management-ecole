import cron from 'node-cron';
import { runAppointmentReminders } from '../utils/appointment-reminders.util';

function isScheduledAppointmentRemindersEnabled(): boolean {
  const v = process.env.ENABLE_SCHEDULED_APPOINTMENT_REMINDERS?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function getCronExpression(): string {
  const expr = process.env.APPOINTMENT_REMINDERS_CRON?.trim();
  if (expr && cron.validate(expr)) return expr;
  return '*/15 * * * *';
}

/**
 * Rappels J-24h et H-1 pour les rendez-vous confirmés.
 * Désactivé par défaut ; un seul worker API en production recommandé.
 */
export function startScheduledAppointmentReminders(): void {
  if (process.env.VERCEL === '1') return;
  if (!isScheduledAppointmentRemindersEnabled()) return;

  const expression = getCronExpression();
  if (!cron.validate(expression)) {
    console.warn(
      `[Rappels RDV] APPOINTMENT_REMINDERS_CRON invalide (${expression}) — désactivé.`
    );
    return;
  }

  cron.schedule(expression, async () => {
    try {
      const r = await runAppointmentReminders();
      if (r.reminded24h > 0 || r.reminded1h > 0) {
        console.log(
          `[Rappels RDV] OK — ~24h: ${r.reminded24h}, ~1h: ${r.reminded1h}.`
        );
      }
    } catch (e) {
      console.error('[Rappels RDV] Erreur :', e);
    }
  });

  console.log(`[Rappels RDV] Planification activée (cron: ${expression}).`);
}
