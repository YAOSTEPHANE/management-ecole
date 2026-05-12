export type EnrollmentStatusValue = 'ACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'ARCHIVED';

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatusValue, string> = {
  ACTIVE: 'Inscription active',
  SUSPENDED: 'Inscription suspendue',
  GRADUATED: 'Diplômé·e',
  ARCHIVED: 'Dossier archivé',
};

export function enrollmentBadgeVariant(
  status: EnrollmentStatusValue | string | undefined
): 'success' | 'danger' | 'warning' | 'info' | 'default' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'SUSPENDED':
      return 'danger';
    case 'GRADUATED':
      return 'info';
    case 'ARCHIVED':
      return 'warning';
    default:
      return 'default';
  }
}
