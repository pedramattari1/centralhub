import { clerkClient } from '@clerk/express';
import { prisma } from '../lib/prisma.js';

/**
 * Sync (create or update) the local CentralHub user profile from Clerk.
 * On FIRST login, seeds a UserPlatformPreference row (isVisible: true) for
 * every currently-active platform. Platforms created later are intentionally
 * NOT back-filled - a missing preference row means "not on my dashboard".
 *
 * @param {string} clerkUserId
 * @param {boolean} isAdmin - resolved from the Clerk org role by the caller
 * @returns the User record
 */
export async function syncUser(clerkUserId, isAdmin) {
  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ||
    clerkUser.emailAddresses?.[0]?.emailAddress ||
    null;
  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    clerkUser.username ||
    null;

  // DB role is a non-authoritative cache of the Clerk org role.
  const role = isAdmin ? 'ADMIN' : 'MEMBER';

  const existing = await prisma.user.findUnique({ where: { clerkUserId } });

  if (existing) {
    return prisma.user.update({
      where: { clerkUserId },
      data: { email: email ?? existing.email, displayName, role },
    });
  }

  // First login: create the user and seed preferences for all active platforms.
  const activePlatforms = await prisma.platform.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  return prisma.user.create({
    data: {
      clerkUserId,
      email: email ?? `${clerkUserId}@unknown.local`,
      displayName,
      role,
      preferences: {
        create: activePlatforms.map((p) => ({
          platformId: p.id,
          isVisible: true,
          isFavorite: false,
        })),
      },
    },
  });
}

// Convenience: ensure the caller has a local profile, returning it.
export async function ensureUser(req) {
  if (req.centralhub.user) return req.centralhub.user;
  const user = await syncUser(req.centralhub.clerkUserId, req.centralhub.isAdmin);
  req.centralhub.user = user;
  return user;
}
