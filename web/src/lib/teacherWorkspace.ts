export const TEACHER_LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Congé annuel',
  SICK: 'Arrêt maladie',
  PERSONAL: 'Congé personnel',
  TRAINING: 'Formation',
  OTHER: 'Autre',
};

export const TEACHER_LEAVE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvé',
  REJECTED: 'Refusé',
  CANCELLED: 'Annulé',
};

export function leaveStatusBadgeVariant(
  s: string
): 'success' | 'warning' | 'danger' | 'info' | 'default' | 'secondary' {
  switch (s) {
    case 'APPROVED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'REJECTED':
      return 'danger';
    case 'CANCELLED':
      return 'secondary';
    default:
      return 'default';
  }
}
