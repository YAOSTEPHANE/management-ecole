import type { TeacherEngagementKind } from '@prisma/client';

export const TEACHER_ENGAGEMENT_KIND_VALUES: TeacherEngagementKind[] = ['PERMANENT', 'VACATAIRE'];

const LABELS: Record<TeacherEngagementKind, string> = {
  PERMANENT: 'Permanent',
  VACATAIRE: 'Vacataire',
};

export function isTeacherEngagementKind(value: unknown): value is TeacherEngagementKind {
  return typeof value === 'string' && TEACHER_ENGAGEMENT_KIND_VALUES.includes(value as TeacherEngagementKind);
}

export function teacherEngagementKindLabel(kind: TeacherEngagementKind | string | null | undefined): string {
  if (!kind || !isTeacherEngagementKind(kind)) return '—';
  return LABELS[kind];
}

export function normalizeTeacherEngagementKind(
  value: unknown,
  fallback: TeacherEngagementKind = 'PERMANENT'
): TeacherEngagementKind {
  return isTeacherEngagementKind(value) ? value : fallback;
}
