import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { ensureUser } from '../services/userService.js';
import { preferenceUpdateSchema, platformIdParamSchema } from '../lib/schemas.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET /api/preferences - the caller's platform preferences.
router.get('/', requireAuth, async (req, res) => {
  const user = await ensureUser(req);
  const preferences = await prisma.userPlatformPreference.findMany({
    where: { userId: user.id },
  });
  res.json({ preferences });
});

// PUT /api/preferences/:platformId - toggle visibility and/or favorite.
router.put(
  '/:platformId',
  requireAuth,
  validateRequest(platformIdParamSchema, 'params'),
  validateRequest(preferenceUpdateSchema, 'body'),
  async (req, res) => {
    const user = await ensureUser(req);
    const { platformId } = req.params;

    const platform = await prisma.platform.findUnique({ where: { id: platformId } });
    if (!platform) return res.status(404).json({ error: 'Platform not found' });

    const preference = await prisma.userPlatformPreference.upsert({
      where: { userId_platformId: { userId: user.id, platformId } },
      update: { ...req.body },
      create: {
        userId: user.id,
        platformId,
        isVisible: req.body.isVisible ?? true,
        isFavorite: req.body.isFavorite ?? false,
      },
    });
    res.json({ preference });
  }
);

// POST /api/preferences/reset - restore all active platforms to visible.
router.post('/reset', requireAuth, async (req, res) => {
  const user = await ensureUser(req);
  const activePlatforms = await prisma.platform.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  await prisma.$transaction(
    activePlatforms.map((p) =>
      prisma.userPlatformPreference.upsert({
        where: { userId_platformId: { userId: user.id, platformId: p.id } },
        update: { isVisible: true },
        create: { userId: user.id, platformId: p.id, isVisible: true, isFavorite: false },
      })
    )
  );

  const preferences = await prisma.userPlatformPreference.findMany({
    where: { userId: user.id },
  });
  res.json({ preferences });
});

export default router;
