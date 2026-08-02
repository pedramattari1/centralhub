import { clerkMiddleware, getAuth, clerkClient } from '@clerk/express';
import { env } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';

// Clerk's base middleware: verifies the JWT (if present) and attaches auth to
// the request. Mount this once, app-wide, before any route.
export const clerkAuth = clerkMiddleware();

const ADMIN_ROLE = 'org:admin';

/**
 * Resolve the caller's CentralHub org membership from Clerk. Clerk is the
 * source of truth for both membership (authorization) and admin role.
 *
 * Returns { membership, role } or null if the user is not a member of the
 * CentralHub organization.
 */
async function resolveMembership(clerkUserId) {
  const { data: memberships } =
    await clerkClient.users.getOrganizationMembershipList({ userId: clerkUserId });

  if (!memberships || memberships.length === 0) return null;

  const membership = env.CLERK_ORG_ID
    ? memberships.find((m) => m.organization.id === env.CLERK_ORG_ID)
    : memberships[0];

  if (!membership) return null;
  return { membership, role: membership.role };
}

/**
 * requireAuth: rejects unless the caller is authenticated AND an active member
 * of the CentralHub org AND their local profile is active. Attaches
 * req.centralhub = { clerkUserId, isAdmin, user } for downstream handlers.
 */
export async function requireAuth(req, res, next) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const resolved = await resolveMembership(userId);
    if (!resolved) {
      return res.status(403).json({ error: 'Not a member of CentralHub', code: 'NOT_ORG_MEMBER' });
    }

    // Local profile is optional here — /api/auth/sync creates it on first login.
    const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
    if (user && !user.isActive) {
      return res.status(403).json({ error: 'Account deactivated', code: 'DEACTIVATED' });
    }

    req.centralhub = {
      clerkUserId: userId,
      isAdmin: resolved.role === ADMIN_ROLE,
      clerkRole: resolved.role,
      user: user || null,
    };
    return next();
  } catch (err) {
    console.error('[auth] requireAuth error', err);
    return res.status(500).json({ error: 'Authorization check failed' });
  }
}

/**
 * requireAdmin: must run after requireAuth. Gates purely on the Clerk org role.
 */
export function requireAdmin(req, res, next) {
  if (!req.centralhub?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
}
