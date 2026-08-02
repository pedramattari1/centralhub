import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/clerkAuth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { ensureUser } from '../services/userService.js';
import { recordAudit } from '../services/auditLog.js';
import { slugify } from '../lib/slug.js';
import { prisma } from '../lib/prisma.js';
import {
  platformCreateSchema,
  platformUpdateSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  roleUpdateSchema,
  idParamSchema,
} from '../lib/schemas.js';

const router = Router();

// Every route here is admin-only (Clerk org role).
router.use(requireAuth, requireAdmin);

// Resolve a unique slug from a base name, avoiding collisions.
async function uniqueSlug(base, ignoreId = null) {
  const root = slugify(base) || 'platform';
  let slug = root;
  let n = 1;
  for (;;) {
    const found = await prisma.platform.findUnique({ where: { slug } });
    if (!found || found.id === ignoreId) return slug;
    slug = `${root}-${++n}`;
  }
}

/* -------------------------------- Platforms ------------------------------- */

// GET /api/admin/platforms — all platforms including inactive.
router.get('/platforms', async (_req, res) => {
  const platforms = await prisma.platform.findMany({
    include: { category: true },
    orderBy: [{ category: { displayOrder: 'asc' } }, { displayOrder: 'asc' }, { name: 'asc' }],
  });
  res.json({ platforms });
});

// POST /api/admin/platforms — create.
router.post('/platforms', validateRequest(platformCreateSchema), async (req, res) => {
  const admin = await ensureUser(req);
  const category = await prisma.category.findUnique({ where: { id: req.body.categoryId } });
  if (!category) return res.status(400).json({ error: 'Category not found' });

  const slug = await uniqueSlug(req.body.name);
  const platform = await prisma.platform.create({
    data: { ...req.body, slug },
  });
  await recordAudit({
    adminUserId: admin.id,
    action: 'PLATFORM_CREATED',
    targetType: 'Platform',
    targetId: platform.id,
    metadata: { name: platform.name },
  });
  res.status(201).json({ platform });
});

// PUT /api/admin/platforms/:id — update.
router.put(
  '/platforms/:id',
  validateRequest(idParamSchema, 'params'),
  validateRequest(platformUpdateSchema),
  async (req, res) => {
    const admin = await ensureUser(req);
    const { id } = req.params;
    const existing = await prisma.platform.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Platform not found' });

    if (req.body.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: req.body.categoryId } });
      if (!category) return res.status(400).json({ error: 'Category not found' });
    }

    const data = { ...req.body };
    if (req.body.name && req.body.name !== existing.name) {
      data.slug = await uniqueSlug(req.body.name, id);
    }

    const platform = await prisma.platform.update({ where: { id }, data });
    await recordAudit({
      adminUserId: admin.id,
      action: 'PLATFORM_UPDATED',
      targetType: 'Platform',
      targetId: id,
      metadata: { fields: Object.keys(req.body) },
    });
    res.json({ platform });
  }
);

// DELETE /api/admin/platforms/:id — soft-delete (isActive: false).
router.delete('/platforms/:id', validateRequest(idParamSchema, 'params'), async (req, res) => {
  const admin = await ensureUser(req);
  const { id } = req.params;
  const existing = await prisma.platform.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Platform not found' });

  const platform = await prisma.platform.update({ where: { id }, data: { isActive: false } });
  await recordAudit({
    adminUserId: admin.id,
    action: 'PLATFORM_DEACTIVATED',
    targetType: 'Platform',
    targetId: id,
    metadata: { name: existing.name },
  });
  res.json({ platform });
});

/* ---------------------------------- Users --------------------------------- */

// GET /api/admin/users — all CentralHub users.
router.get('/users', async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  res.json({ users });
});

// PUT /api/admin/users/:id/role — change cached role.
// NOTE: authoritative admin status lives in Clerk; this updates the local
// cache only. Real role changes should also be made in the Clerk dashboard.
router.put(
  '/users/:id/role',
  validateRequest(idParamSchema, 'params'),
  validateRequest(roleUpdateSchema),
  async (req, res) => {
    const admin = await ensureUser(req);
    const { id } = req.params;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const user = await prisma.user.update({ where: { id }, data: { role: req.body.role } });
    await recordAudit({
      adminUserId: admin.id,
      action: 'USER_ROLE_CHANGED',
      targetType: 'User',
      targetId: id,
      metadata: { role: req.body.role },
    });
    res.json({ user });
  }
);

// DELETE /api/admin/users/:id — deactivate (isActive: false).
router.delete('/users/:id', validateRequest(idParamSchema, 'params'), async (req, res) => {
  const admin = await ensureUser(req);
  const { id } = req.params;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'User not found' });
  if (existing.id === admin.id) {
    return res.status(400).json({ error: 'You cannot deactivate your own account' });
  }

  const user = await prisma.user.update({ where: { id }, data: { isActive: false } });
  await recordAudit({
    adminUserId: admin.id,
    action: 'USER_DEACTIVATED',
    targetType: 'User',
    targetId: id,
    metadata: { email: existing.email },
  });
  res.json({ user });
});

/* -------------------------------- Categories ------------------------------ */

// POST /api/admin/categories — create.
router.post('/categories', validateRequest(categoryCreateSchema), async (req, res) => {
  const admin = await ensureUser(req);
  const slug = slugify(req.body.name);
  const category = await prisma.category.create({
    data: { name: req.body.name, slug, displayOrder: req.body.displayOrder },
  });
  await recordAudit({
    adminUserId: admin.id,
    action: 'CATEGORY_CREATED',
    targetType: 'Category',
    targetId: category.id,
    metadata: { name: category.name },
  });
  res.status(201).json({ category });
});

// PUT /api/admin/categories/:id — update.
router.put(
  '/categories/:id',
  validateRequest(idParamSchema, 'params'),
  validateRequest(categoryUpdateSchema),
  async (req, res) => {
    const admin = await ensureUser(req);
    const { id } = req.params;
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Category not found' });

    const data = { ...req.body };
    if (req.body.name && req.body.name !== existing.name) {
      data.slug = slugify(req.body.name);
    }
    const category = await prisma.category.update({ where: { id }, data });
    await recordAudit({
      adminUserId: admin.id,
      action: 'CATEGORY_UPDATED',
      targetType: 'Category',
      targetId: id,
      metadata: { fields: Object.keys(req.body) },
    });
    res.json({ category });
  }
);

export default router;
