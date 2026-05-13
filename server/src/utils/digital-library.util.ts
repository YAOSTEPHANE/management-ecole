import type { DigitalLibraryResourceKind, Role } from '@prisma/client';
import prisma from './prisma';

const PORTAL_ROLES = new Set<Role>(['STUDENT', 'TEACHER', 'PARENT', 'EDUCATOR', 'STAFF', 'ADMIN', 'SUPER_ADMIN']);

export function canRoleAccessDigitalResource(role: Role, allowedRoles: string[]): boolean {
  if (!PORTAL_ROLES.has(role)) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(role);
}

export async function getDigitalResourceForUser(resourceId: string, userId: string, role: Role) {
  const resource = await prisma.digitalLibraryResource.findUnique({
    where: { id: resourceId },
  });
  if (!resource || !resource.isActive) return null;
  if (!canRoleAccessDigitalResource(role, resource.allowedRoles)) return null;
  return resource;
}

export const DIGITAL_KIND_LABELS: Record<DigitalLibraryResourceKind, string> = {
  EBOOK: 'E-book',
  PDF: 'Document PDF',
  PEDAGOGICAL: 'Ressource pédagogique',
};
