import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET /api/platforms — all active platforms (for directory/browse).
router.get('/', requireAuth, async (_req, res) => {
  const platforms = await prisma.platform.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: [{ category: { displayOrder: 'asc' } }, { displayOrder: 'asc' }, { name: 'asc' }],
  });
  res.json({ platforms });
});

export default router;
