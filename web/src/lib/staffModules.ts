import type { IconType } from 'react-icons';

import {

  FiBook,

  FiBookOpen,

  FiCheckCircle,

  FiClipboard,

  FiDollarSign,

  FiHeart,

  FiLayers,

  FiLayout,

  FiMonitor,

  FiTool,

  FiUserCheck,

  FiUsers,

} from 'react-icons/fi';

import type { SupportStaffKindKey } from '@/views/staff/staffSpaceConfig';



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

  health_log: 'Infirmerie',

  library: 'Bibliothèque',

  digital_library: 'Bibliothèque numérique',

  it_requests: 'Support informatique',

  maintenance_requests: 'Maintenance',

};



export const STAFF_MODULE_DESCRIPTIONS: Record<StaffModuleId, string> = {

  overview: 'Missions et organisation de votre poste',

  counter: 'Recherche élève, encaissement espèces ou virement au guichet',

  admissions: 'Pré-inscriptions, suivi des dossiers et classe proposée',

  appointments: 'Planning des entretiens parents–enseignants',

  student_registry: 'Recherche élève, coordonnées familles et pièces d’identité',

  treasury: 'Encours, impayés, encaissements du jour et du mois',

  validations: 'Notes et moyennes — 3e étape (directeur des études)',

  academic_overview: 'Effectifs, moyennes par classe et validations en attente',

  class_councils: 'Sessions, PV, décisions et recommandations',

  health_log: 'Consultations, liaison familles, suivi infirmerie',

  library: 'Catalogue, emprunts et retours',

  digital_library: 'E-books, PDF, ressources pédagogiques en ligne',

  it_requests: 'Demandes et incidents informatiques',

  maintenance_requests: 'Signalements et interventions bâtiment',

};



type StaffTabMeta = {

  id: StaffModuleId;

  label: string;

  icon: IconType;

  color: string;

  description: string;

};



const TAB_META: Record<StaffModuleId, Omit<StaffTabMeta, 'id'>> = {

  overview: {

    label: STAFF_MODULE_LABELS.overview,

    icon: FiLayout,

    color: 'from-teal-600 to-emerald-700',

    description: STAFF_MODULE_DESCRIPTIONS.overview,

  },

  counter: {

    label: STAFF_MODULE_LABELS.counter,

    icon: FiDollarSign,

    color: 'from-emerald-500 to-teal-600',

    description: STAFF_MODULE_DESCRIPTIONS.counter,

  },

  admissions: {

    label: STAFF_MODULE_LABELS.admissions,

    icon: FiUserCheck,

    color: 'from-sky-500 to-blue-600',

    description: STAFF_MODULE_DESCRIPTIONS.admissions,

  },

  appointments: {

    label: STAFF_MODULE_LABELS.appointments,

    icon: FiUsers,

    color: 'from-cyan-500 to-teal-600',

    description: STAFF_MODULE_DESCRIPTIONS.appointments,

  },

  student_registry: {

    label: STAFF_MODULE_LABELS.student_registry,

    icon: FiClipboard,

    color: 'from-indigo-500 to-violet-600',

    description: STAFF_MODULE_DESCRIPTIONS.student_registry,

  },

  treasury: {

    label: STAFF_MODULE_LABELS.treasury,

    icon: FiDollarSign,

    color: 'from-amber-500 to-orange-600',

    description: STAFF_MODULE_DESCRIPTIONS.treasury,

  },

  validations: {

    label: STAFF_MODULE_LABELS.validations,

    icon: FiCheckCircle,

    color: 'from-indigo-500 to-violet-600',

    description: STAFF_MODULE_DESCRIPTIONS.validations,

  },

  academic_overview: {

    label: STAFF_MODULE_LABELS.academic_overview,

    icon: FiLayers,

    color: 'from-violet-500 to-purple-600',

    description: STAFF_MODULE_DESCRIPTIONS.academic_overview,

  },

  class_councils: {

    label: STAFF_MODULE_LABELS.class_councils,

    icon: FiBookOpen,

    color: 'from-fuchsia-500 to-pink-600',

    description: STAFF_MODULE_DESCRIPTIONS.class_councils,

  },

  health_log: {

    label: STAFF_MODULE_LABELS.health_log,

    icon: FiHeart,

    color: 'from-rose-500 to-pink-600',

    description: STAFF_MODULE_DESCRIPTIONS.health_log,

  },

  library: {

    label: STAFF_MODULE_LABELS.library,

    icon: FiClipboard,

    color: 'from-amber-500 to-orange-600',

    description: STAFF_MODULE_DESCRIPTIONS.library,

  },

  digital_library: {

    label: STAFF_MODULE_LABELS.digital_library,

    icon: FiBook,

    color: 'from-sky-500 to-indigo-600',

    description: STAFF_MODULE_DESCRIPTIONS.digital_library,

  },

  it_requests: {

    label: STAFF_MODULE_LABELS.it_requests,

    icon: FiMonitor,

    color: 'from-blue-500 to-cyan-600',

    description: STAFF_MODULE_DESCRIPTIONS.it_requests,

  },

  maintenance_requests: {

    label: STAFF_MODULE_LABELS.maintenance_requests,

    icon: FiTool,

    color: 'from-stone-500 to-slate-600',

    description: STAFF_MODULE_DESCRIPTIONS.maintenance_requests,

  },

};



export function getEligibleModulesForSupportKind(kind: SupportStaffKindKey): StaffModuleId[] {
  switch (kind) {

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



/** Tous les modules du menu latéral STAFF (hors vue d'ensemble). */
export function getAllConfigurableStaffModules(): StaffModuleId[] {
  return STAFF_MODULE_IDS.filter((id) => id !== 'overview');
}

export function resolveVisibleStaffModules(
  kind: SupportStaffKindKey,
  stored: string[] | null | undefined,
): StaffModuleId[] {
  if (!stored?.length) return getEligibleModulesForSupportKind(kind);

  const picked = stored.filter((id): id is StaffModuleId =>
    (STAFF_MODULE_IDS as readonly string[]).includes(id),
  );
  if (!picked.includes('overview')) picked.unshift('overview');
  return picked.length ? picked : ['overview'];
}



export function getStaffTabsFromModules(moduleIds: StaffModuleId[]): StaffTabMeta[] {

  return moduleIds.map((id) => ({ id, ...TAB_META[id] }));

}



export function isStaffModuleTab(value: string | null, visible: StaffModuleId[]): value is StaffModuleId {

  return !!value && visible.includes(value as StaffModuleId);

}


