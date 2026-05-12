import { randomBytes } from 'crypto';

/** Identifiant URL-safe unique pour la carte étudiant numérique (non devinable). */
export function generateDigitalCardPublicId(): string {
  return `sc_${randomBytes(18).toString('base64url').replace(/=+$/, '')}`;
}
