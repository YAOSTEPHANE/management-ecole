export type EnrollmentStatusValue = 'ACTIVE' | 'SUSPENDED' | 'GRADUATED';

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatusValue, string> = {
  ACTIVE: 'Inscription active',
  SUSPENDED: 'Inscription suspendue',
  GRADUATED: 'Diplômé·e',
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
    default:
      return 'default';
  }
}
