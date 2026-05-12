export type StudentStateAssignmentValue = 'STATE_ASSIGNED' | 'NOT_STATE_ASSIGNED';

export const STATE_ASSIGNMENT_LABELS: Record<StudentStateAssignmentValue, string> = {
  STATE_ASSIGNED: "Affecté de l'État",
  NOT_STATE_ASSIGNED: 'Non affecté',
};

export function normalizeStateAssignment(
  value: string | null | undefined
): StudentStateAssignmentValue {
  return value === 'STATE_ASSIGNED' ? 'STATE_ASSIGNED' : 'NOT_STATE_ASSIGNED';
}

export function stateAssignmentBadgeVariant(
  value: StudentStateAssignmentValue | string | undefined
): 'success' | 'info' | 'default' {
  switch (value) {
    case 'STATE_ASSIGNED':
      return 'success';
    case 'NOT_STATE_ASSIGNED':
      return 'default';
    default:
      return 'default';
  }
}
