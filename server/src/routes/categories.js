import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET /api/categories - all categories, ordered.
router.get('/', requireAuth, async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { displayOrder: 'asc' },
  });
  res.json({ categories });
});

export default router;
