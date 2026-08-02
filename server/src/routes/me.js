import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth.js';
import { ensureUser } from '../services/userService.js';

const router = Router();

// GET /api/me — current user profile (+ admin flag from Clerk).
router.get('/', requireAuth, async (req, res) => {
  const user = await ensureUser(req);
  res.json({ user: { ...user, isAdmin: req.centralhub.isAdmin } });
});

export default router;
