import express from 'express';
import { body, validationResult } from 'express-validator';
import type { Role } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import {
  approveAcademicChangeRequest,
  listPendingForUser,
  listRequestsByRequester,
  rejectAcademicChangeRequest,
  workflowStatusLabel,
} from '../utils/academic-change-request.util';

const router = express.Router();

router.use(authenticate);

const APPROVER_ROLES = new Set(['TEACHER', 'EDUCATOR', 'ADMIN', 'SUPER_ADMIN', 'STAFF']);

router.get('/pending', async (req: AuthRequest, res) => {
  try {
    const role = req.user!.role as Role;
    if (!APPROVER_ROLES.has(role)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    const rows = await listPendingForUser(req.user!.id, role);
    res.json(
      rows.map((r) => ({
        ...r,
        statusLabel: workflowStatusLabel(r.status),
      }))
    );
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Erreur serveur',
    });
  }
});

router.get('/my-requests', async (req: AuthRequest, res) => {
  try {
    const rows = await listRequestsByRequester(req.user!.id);
    res.json(
      rows.map((r) => ({
        ...r,
        statusLabel: workflowStatusLabel(r.status),
      }))
    );
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Erreur serveur',
    });
  }
});

router.post(
  '/:id/approve',
  [body('note').optional().isString().isLength({ max: 2000 })],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const role = req.user!.role as Role;
      if (!APPROVER_ROLES.has(role)) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
      const updated = await approveAcademicChangeRequest({
        requestId: req.params.id,
        userId: req.user!.id,
        role,
        note: req.body.note,
      });
      res.json({
        ...updated,
        statusLabel: updated ? workflowStatusLabel(updated.status) : undefined,
      });
    } catch (error: unknown) {
      const statusCode =
        error && typeof error === 'object' && 'statusCode' in error
          ? Number((error as { statusCode: number }).statusCode)
          : 500;
      res.status(statusCode).json({
        error: error instanceof Error ? error.message : 'Erreur serveur',
      });
    }
  }
);

router.post(
  '/:id/reject',
  [body('reason').optional().isString().isLength({ max: 2000 })],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const role = req.user!.role as Role;
      if (!APPROVER_ROLES.has(role)) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
      const updated = await rejectAcademicChangeRequest({
        requestId: req.params.id,
        userId: req.user!.id,
        role,
        reason: req.body.reason,
      });
      res.json({
        ...updated,
        statusLabel: workflowStatusLabel(updated.status),
      });
    } catch (error: unknown) {
      const statusCode =
        error && typeof error === 'object' && 'statusCode' in error
          ? Number((error as { statusCode: number }).statusCode)
          : 500;
      res.status(statusCode).json({
        error: error instanceof Error ? error.message : 'Erreur serveur',
      });
    }
  }
);

export default router;
