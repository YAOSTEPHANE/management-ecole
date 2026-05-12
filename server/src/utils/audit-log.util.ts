import type { Request } from 'express';
import type { Prisma } from '@prisma/client';
import prisma from './prisma';
import { decryptSensitiveString } from './field-encryption.util';

const REDACT_KEYS = new Set([
  'password',
  'hashedPassword',
  'token',
  'refreshToken',
  'authorization',
  'newPassword',
]);

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

function valuesDiffer(b: unknown, a: unknown): boolean {
  const jb = JSON.stringify(b ?? null);
  const ja = JSON.stringify(a ?? null);
  return jb !== ja;
}

/** Compare deux objets plats sur une liste de clés ; ignore les clés secrètes. */
export function buildFieldChanges(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  keys: string[]
): Record<string, { before: unknown; after: unknown }> | undefined {
  const out: Record<string, { before: unknown; after: unknown }> = {};
  for (const k of keys) {
    if (REDACT_KEYS.has(k)) continue;
    const bv = before && k in before ? before[k] : undefined;
    const av = after && k in after ? after[k] : undefined;
    if (valuesDiffer(bv, av)) {
      out[k] = { before: bv ?? null, after: av ?? null };
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function auditActorFromRequest(
  req: Request,
  user?: { id: string; email: string; role: string } | null
): {
  actorUserId: string | undefined;
  actorEmail: string | undefined;
  actorRole: string | undefined;
  ipAddress: string | undefined;
  userAgent: string | undefined;
} {
  return {
    actorUserId: user?.id,
    actorEmail: user?.email,
    actorRole: user?.role,
    ipAddress: (req.ip || req.socket.remoteAddress || undefined) as string | undefined,
    userAgent: req.get('user-agent') || undefined,
  };
}

export async function recordAuditLog(params: {
  req: Request;
  actor?: { id: string; email: string; role: string } | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  summary: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
}): Promise<void> {
  const a = auditActorFromRequest(params.req, params.actor ?? undefined);
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: a.actorUserId,
        actorEmail: a.actorEmail,
        actorRole: a.actorRole,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        summary: params.summary,
        changes: params.changes as Prisma.InputJsonValue | undefined,
        ipAddress: a.ipAddress,
        userAgent: a.userAgent,
      },
    });
  } catch (e) {
    console.error('[AuditLog] échec enregistrement:', e);
  }
}

/** Vue « métier » d’un élève pour comparaison (champs sensibles déchiffrés si besoin). */
export function studentSnapshotForAudit(s: {
  user: { firstName: string; lastName: string; phone: string | null };
  address: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  medicalInfo: string | null;
  classId: string | null;
  classGroupId: string | null;
  isActive: boolean;
  nfcId: string | null;
  biometricId: string | null;
  enrollmentStatus: string;
  stateAssignment: string | null;
}): Record<string, unknown> {
  return {
    firstName: s.user.firstName,
    lastName: s.user.lastName,
    phone: s.user.phone,
    address: s.address ? decryptSensitiveString(s.address) : null,
    emergencyContact: s.emergencyContact ? decryptSensitiveString(s.emergencyContact) : null,
    emergencyPhone: s.emergencyPhone ? decryptSensitiveString(s.emergencyPhone) : null,
    medicalInfo: s.medicalInfo ? decryptSensitiveString(s.medicalInfo) : null,
    classId: s.classId,
    classGroupId: s.classGroupId,
    isActive: s.isActive,
    nfcId: s.nfcId,
    biometricId: s.biometricId,
    enrollmentStatus: s.enrollmentStatus,
    stateAssignment: s.stateAssignment,
  };
}

const STUDENT_AUDIT_KEYS = [
  'firstName',
  'lastName',
  'phone',
  'address',
  'emergencyContact',
  'emergencyPhone',
  'medicalInfo',
  'classId',
  'classGroupId',
  'isActive',
  'nfcId',
  'biometricId',
  'enrollmentStatus',
  'stateAssignment',
] as const;

export function diffStudentAudit(
  before: ReturnType<typeof studentSnapshotForAudit>,
  after: ReturnType<typeof studentSnapshotForAudit>
): Record<string, { before: unknown; after: unknown }> | undefined {
  return buildFieldChanges(before, after, [...STUDENT_AUDIT_KEYS]);
}

/** Champs élève modifiables par l’élève lui-même (profil). */
export function studentSelfProfileSnapshotForAudit(s: {
  address: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  medicalInfo: string | null;
}): Record<string, unknown> {
  return {
    address: s.address ? decryptSensitiveString(s.address) : null,
    emergencyContact: s.emergencyContact ? decryptSensitiveString(s.emergencyContact) : null,
    emergencyPhone: s.emergencyPhone ? decryptSensitiveString(s.emergencyPhone) : null,
    medicalInfo: s.medicalInfo ? decryptSensitiveString(s.medicalInfo) : null,
  };
}

const STUDENT_SELF_KEYS = ['address', 'emergencyContact', 'emergencyPhone', 'medicalInfo'] as const;

export function diffStudentSelfProfile(
  before: ReturnType<typeof studentSelfProfileSnapshotForAudit>,
  after: ReturnType<typeof studentSelfProfileSnapshotForAudit>
): Record<string, { before: unknown; after: unknown }> | undefined {
  return buildFieldChanges(before, after, [...STUDENT_SELF_KEYS]);
}
