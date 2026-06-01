/** Utilisateur session (auth/me) avec profil personnel optionnel. */
export type SessionUserWithStaff = {
  role?: string;
  staffProfile?: { supportKind?: string | null } | null;
};

export function isSecretaryStaff(user: SessionUserWithStaff | null | undefined): boolean {
  if (!user || user.role !== 'STAFF') return false;
  return user.staffProfile?.supportKind === 'SECRETARY';
}

/** Suppression d’élèves ou de classes : réservée aux administrateurs (pas à la secrétaire). */
export function canDeleteStudentsOrClasses(user: SessionUserWithStaff | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
  if (isSecretaryStaff(user)) return false;
  return user.role === 'STAFF';
}
