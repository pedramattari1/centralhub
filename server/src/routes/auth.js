import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth.js';
import { syncUser } from '../services/userService.js';

const router = Router();

/**
 * POST /api/auth/sync
 * Called by the client right after sign-in. requireAuth has already confirmed
 * org membership; this creates/updates the local profile (and seeds
 * preferences on first login).
 */
router.post('/sync', requireAuth, async (req, res) => {
  const user = await syncUser(req.centralhub.clerkUserId, req.centralhub.isAdmin);
  res.json({ user: { ...user, isAdmin: req.centralhub.isAdmin } });
});

export default router;
