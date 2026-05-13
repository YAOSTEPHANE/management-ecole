export const DIGITAL_LIBRARY_KINDS = ['EBOOK', 'PDF', 'PEDAGOGICAL'] as const;
export type DigitalLibraryKind = (typeof DIGITAL_LIBRARY_KINDS)[number];

export const DIGITAL_KIND_LABELS: Record<DigitalLibraryKind, string> = {
  EBOOK: 'E-book',
  PDF: 'Document PDF',
  PEDAGOGICAL: 'Ressource pédagogique',
};

export const DIGITAL_AUDIENCE_ROLES = ['STUDENT', 'TEACHER', 'PARENT', 'EDUCATOR', 'STAFF'] as const;

export const DIGITAL_ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Élèves',
  TEACHER: 'Enseignants',
  PARENT: 'Parents',
  EDUCATOR: 'Éducateurs',
  STAFF: 'Personnel',
};
