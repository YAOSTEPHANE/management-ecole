import type { Role } from '@prisma/client';
import { assertStaffHasModule } from './staff-visible-modules.util';

export async function assertHealthModuleAccess(userId: string, role: Role): Promise<void> {
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return;
  if (role === 'STAFF') {
    await assertStaffHasModule(userId, 'health_log');
    return;
  }
  const err = new Error('HEALTH_FORBIDDEN');
  (err as Error & { statusCode?: number }).statusCode = 403;
  throw err;
}

export const VISIT_OUTCOME_LABELS: Record<string, string> = {
  RETURN_TO_CLASS: 'Retour en classe',
  SENT_HOME: 'Retour à domicile',
  PARENT_PICKUP: 'Récupération par un parent',
  REFERRED_HOSPITAL: 'Orientation hôpital / SAMU',
  REST_INFIRMARY: 'Repos à l’infirmierie',
  OTHER: 'Autre',
};

export const CAMPAIGN_KIND_LABELS: Record<string, string> = {
  VACCINATION: 'Campagne de vaccination',
  HEALTH_CHECKUP: 'Bilan de santé',
  AWARENESS: 'Sensibilisation santé',
  EMERGENCY_PREP: 'Gestion des urgences / exercice',
};
