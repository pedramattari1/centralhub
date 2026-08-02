import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { ensureUser } from '../services/userService.js';
import { platformIdParamSchema } from '../lib/schemas.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET /api/recently-used - the caller's 5 most recently opened platforms.
router.get('/', requireAuth, async (req, res) => {
  const user = await ensureUser(req);
  const recent = await prisma.recentlyUsedPlatform.findMany({
    where: { userId: user.id, platform: { isActive: true } },
    orderBy: { usedAt: 'desc' },
    take: 5,
    include: { platform: { include: { category: true } } },
  });
  res.json({ recentlyUsed: recent });
});

// POST /api/recently-used/:platformId - record a platform open (upsert timestamp).
router.post(
  '/:platformId',
  requireAuth,
  validateRequest(platformIdParamSchema, 'params'),
  async (req, res) => {
    const user = await ensureUser(req);
    const { platformId } = req.params;

    const platform = await prisma.platform.findUnique({ where: { id: platformId } });
    if (!platform) return res.status(404).json({ error: 'Platform not found' });

    const record = await prisma.recentlyUsedPlatform.upsert({
      where: { userId_platformId: { userId: user.id, platformId } },
      update: { usedAt: new Date() },
      create: { userId: user.id, platformId },
    });
    res.json({ recentlyUsed: record });
  }
);

export default router;
