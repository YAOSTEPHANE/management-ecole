import { Router } from 'express';
import type { Role } from '@prisma/client';
import type { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import {
  ADMIN_MODULE_CATEGORIES,
  ADMIN_MODULE_LABELS,
  getAllConfigurableAdminModules,
  resolveAdminVisibleModules,
  sanitizeEnabledAdminModules,
  slugifyWorkspaceName,
} from '../utils/admin-visible-modules.util';

const router = Router();

router.get('/workspaces/module-catalog', async (_req, res) => {
  try {
    res.json({
      categories: ADMIN_MODULE_CATEGORIES,
      labels: ADMIN_MODULE_LABELS,
      configurableIds: getAllConfigurableAdminModules(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    res.status(500).json({ error: msg });
  }
});

router.get('/workspaces/my-context', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const ctx = await resolveAdminVisibleModules(userId, role as Role);
    res.json(ctx);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    res.status(500).json({ error: msg });
  }
});

router.get('/workspaces', async (_req, res) => {
  try {
    const list = await prisma.adminWorkspace.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      include: {
        _count: { select: { members: true } },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true },
            },
          },
        },
      },
    });
    res.json(list);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    res.status(500).json({ error: msg });
  }
});

router.post('/workspaces', async (req: AuthRequest, res) => {
  try {
    const { name, description, enabledModules, isDefault, memberUserIds } = req.body ?? {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Le nom de l’espace est requis' });
    }

    let slug = slugifyWorkspaceName(name.trim());
    const existingSlug = await prisma.adminWorkspace.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const modules = sanitizeEnabledAdminModules(enabledModules);

    if (isDefault === true) {
      await prisma.adminWorkspace.updateMany({ data: { isDefault: false } });
    }

    const workspace = await prisma.adminWorkspace.create({
      data: {
        name: name.trim(),
        slug,
        description: typeof description === 'string' ? description.trim() || null : null,
        enabledModules: modules,
        isDefault: isDefault === true,
        members: Array.isArray(memberUserIds)
          ? {
              create: memberUserIds
                .map((id: unknown) => String(id).trim())
                .filter(Boolean)
                .map((userId: string) => ({ userId })),
            }
          : undefined,
      },
      include: {
        _count: { select: { members: true } },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true },
            },
          },
        },
      },
    });

    res.status(201).json(workspace);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    res.status(500).json({ error: msg });
  }
});

router.put('/workspaces/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, enabledModules, isActive, isDefault, memberUserIds } = req.body ?? {};

    const existing = await prisma.adminWorkspace.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Espace introuvable' });

    if (isDefault === true) {
      await prisma.adminWorkspace.updateMany({ data: { isDefault: false }, where: { id: { not: id } } });
    }

    const data: Record<string, unknown> = {};
    if (typeof name === 'string' && name.trim()) data.name = name.trim();
    if (description !== undefined) {
      data.description = typeof description === 'string' ? description.trim() || null : null;
    }
    if (enabledModules !== undefined) {
      data.enabledModules = sanitizeEnabledAdminModules(enabledModules);
    }
    if (typeof isActive === 'boolean') data.isActive = isActive;
    if (typeof isDefault === 'boolean') data.isDefault = isDefault;

    await prisma.adminWorkspace.update({ where: { id }, data });

    if (Array.isArray(memberUserIds)) {
      const ids = memberUserIds.map((uid: unknown) => String(uid).trim()).filter(Boolean);
      await prisma.adminWorkspaceMember.deleteMany({ where: { workspaceId: id } });
      if (ids.length > 0) {
        await prisma.adminWorkspaceMember.createMany({
          data: ids.map((userId) => ({ workspaceId: id, userId })),
        });
      }
    }

    const workspace = await prisma.adminWorkspace.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true } },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true },
            },
          },
        },
      },
    });

    res.json(workspace);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    res.status(500).json({ error: msg });
  }
});

router.delete('/workspaces/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.adminWorkspace.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Espace introuvable' });

    await prisma.adminWorkspace.update({
      where: { id },
      data: { isActive: false, isDefault: false },
    });

    res.json({ ok: true, deactivated: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    res.status(500).json({ error: msg });
  }
});

export default router;
