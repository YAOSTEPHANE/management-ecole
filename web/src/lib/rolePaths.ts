/** Chemin du tableau de bord selon le rôle JWT. */
export function getRoleDashboardPath(role: string): string {
  const normalized = role.toUpperCase();
  switch (normalized) {
    case 'SUPER_ADMIN':
      return '/super-admin';
    case 'ADMIN':
      return '/admin';
    case 'TEACHER':
      return '/teacher';
    case 'STUDENT':
      return '/student';
    case 'PARENT':
      return '/parent';
    case 'EDUCATOR':
      return '/educator';
    case 'STAFF':
      return '/staff';
    default:
      return `/${role.toLowerCase().replace(/_/g, '-')}`;
  }
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super administrateur',
  ADMIN: 'Administrateur',
  TEACHER: 'Enseignant',
  STUDENT: 'Élève',
  PARENT: 'Parent',
  EDUCATOR: 'Éducateur',
  STAFF: 'Personnel',
};
