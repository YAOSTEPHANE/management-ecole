export type TeacherEngagementKindValue = 'PERMANENT' | 'VACATAIRE';

export const TEACHER_ENGAGEMENT_KIND_OPTIONS: {
  value: TeacherEngagementKindValue;
  label: string;
  description: string;
}[] = [
  {
    value: 'PERMANENT',
    label: 'Permanent',
    description: 'Enseignant titulaire ou à temps plein dans l’établissement',
  },
  {
    value: 'VACATAIRE',
    label: 'Vacataire',
    description: 'Intervention ponctuelle ou à l’heure (vacation)',
  },
];

export function normalizeTeacherEngagementKind(
  value: unknown,
  fallback: TeacherEngagementKindValue = 'PERMANENT'
): TeacherEngagementKindValue {
  return value === 'VACATAIRE' || value === 'PERMANENT' ? value : fallback;
}

export function getTeacherEngagementKindLabel(value: unknown): string {
  const k = normalizeTeacherEngagementKind(value, 'PERMANENT');
  return TEACHER_ENGAGEMENT_KIND_OPTIONS.find((o) => o.value === k)?.label ?? '—';
}

export function getTeacherEngagementBadgeVariant(
  value: unknown
): 'success' | 'warning' | 'default' {
  return normalizeTeacherEngagementKind(value) === 'VACATAIRE' ? 'warning' : 'success';
}
