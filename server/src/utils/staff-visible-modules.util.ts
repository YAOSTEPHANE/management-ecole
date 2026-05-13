import type { StaffCategory, SupportStaffKind } from '@prisma/client';
import prisma from './prisma';

/** Identifiants des modules de l’espace personnel STAFF. */
export const STAFF_MODULE_IDS = [
  'overview',
  'counter',
  'admissions',
  'appointments',
  'student_registry',
  'treasury',
  'validations',
  'academic_overview',
  'class_councils',
  'health_log',
  'library',
  'digital_library',
  'it_requests',
  'maintenance_requests',
] as const;

export type StaffModuleId = (typeof STAFF_MODULE_IDS)[number];

const MODULE_SET = new Set<string>(STAFF_MODULE_IDS);

export const STAFF_MODULE_LABELS: Record<StaffModuleId, string> = {
  overview: 'Vue d’ensemble',
  counter: 'Guichet scolarité',
  admissions: 'Inscriptions & admissions',
  appointments: 'Rendez-vous parents',
  student_registry: 'Registre élèves',
  treasury: 'Trésorerie & frais',
  validations: 'Validations notes & moyennes',
  academic_overview: 'Pilotage pédagogique',
  class_councils: 'Conseils de classe',
  health_log: 'Infirmerie — consultations',
  library: 'Bibliothèque — prêts',
  digital_library: 'Bibliothèque numérique',
  it_requests: 'Support informatique',
  maintenance_requests: 'Maintenance & travaux',
};

/** Modules éligibles selon le métier (supportKind). */
export function getEligibleModulesForSupportKind(
  supportKind: SupportStaffKind | null | undefined,
): StaffModuleId[] {
  if (!supportKind) return ['overview'];
  switch (supportKind) {
    case 'SECRETARY':
      return ['overview', 'counter', 'admissions', 'appointments', 'student_registry'];
    case 'BURSAR':
    case 'ACCOUNTANT':
      return ['overview', 'counter', 'treasury'];
    case 'STUDIES_DIRECTOR':
      return ['overview', 'validations', 'academic_overview', 'class_councils'];
    case 'NURSE':
      return ['overview', 'health_log'];
    case 'LIBRARIAN':
      return ['overview', 'library', 'digital_library'];
    case 'IT':
      return ['overview', 'it_requests'];
    case 'MAINTENANCE':
      return ['overview', 'maintenance_requests'];
    default:
      return ['overview'];
  }
}

export function getEligibleModulesForStaffMember(
  staffCategory: StaffCategory,
  supportKind: SupportStaffKind | null | undefined,
): StaffModuleId[] {
  if (staffCategory === 'SUPPORT') {
    return getEligibleModulesForSupportKind(supportKind);
  }
  return ['overview'];
}

export function sanitizeVisibleStaffModules(
  staffCategory: StaffCategory,
  supportKind: SupportStaffKind | null | undefined,
  requested: unknown,
): StaffModuleId[] {
  if (staffCategory !== 'SUPPORT') {
    return ['overview'];
  }
  if (!Array.isArray(requested) || requested.length === 0) {
    return getEligibleModulesForStaffMember(staffCategory, supportKind);
  }
  const picked = requested
    .map((v) => String(v).trim())
    .filter((id): id is StaffModuleId => MODULE_SET.has(id) && id !== 'overview');
  const withOverview = new Set<StaffModuleId>(['overview', ...picked]);
  return [...withOverview];
}

export function resolveVisibleStaffModules(
  staffCategory: StaffCategory,
  supportKind: SupportStaffKind | null | undefined,
  stored: string[] | null | undefined,
): StaffModuleId[] {
  if (staffCategory !== 'SUPPORT') {
    return ['overview'];
  }
  if (!stored || stored.length === 0) {
    return getEligibleModulesForStaffMember(staffCategory, supportKind);
  }
  const picked = stored.filter((id): id is StaffModuleId => MODULE_SET.has(id));
  if (!picked.includes('overview')) {
    picked.unshift('overview');
  }
  return picked.length > 0 ? picked : ['overview'];
}

export async function getStaffMemberModuleContext(userId: string) {
  const staff = await prisma.staffMember.findUnique({
    where: { userId },
    select: {
      id: true,
      staffCategory: true,
      supportKind: true,
      visibleStaffModules: true,
    },
  });
  if (!staff) return null;
  const visibleModules = resolveVisibleStaffModules(
    staff.staffCategory,
    staff.supportKind,
    staff.visibleStaffModules,
  );
  return { staff, visibleModules };
}

export async function assertStaffHasModule(userId: string, moduleId: StaffModuleId): Promise<void> {
  const ctx = await getStaffMemberModuleContext(userId);
  if (!ctx) {
    const err = new Error('STAFF_PROFILE_NOT_FOUND');
    (err as Error & { statusCode?: number }).statusCode = 403;
    throw err;
  }
  if (!ctx.visibleModules.includes(moduleId)) {
    const err = new Error('MODULE_NOT_ALLOWED');
    (err as Error & { statusCode?: number }).statusCode = 403;
    throw err;
  }
}
