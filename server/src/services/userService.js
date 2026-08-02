import { clerkClient } from '@clerk/express';
import { prisma } from '../lib/prisma.js';

/**
 * Seed all-visible preferences for a user who has none yet. Safe to call on any
 * login: it only acts when the user has zero preferences (first real login, or a
 * user pre-created by the seed script). Platforms added later are intentionally
 * NOT back-filled here - a missing row means "not on my dashboard".
 */
async function seedPreferencesIfEmpty(userId) {
  const count = await prisma.userPlatformPreference.count({ where: { userId } });
  if (count > 0) return;

  const activePlatforms = await prisma.platform.findMany({
    where: { isActive: true },
    select: { id: true },
  });
  if (activePlatforms.length === 0) return;

  await prisma.userPlatformPreference.createMany({
    data: activePlatforms.map((p) => ({
      userId,
      platformId: p.id,
      isVisible: true,
      isFavorite: false,
    })),
    skipDuplicates: true,
  });
}

/**
 * Sync (create or update) the local CentralHub user profile from Clerk, then
 * ensure preferences are seeded if the user has none. Idempotent.
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

  const user = await prisma.user.upsert({
    where: { clerkUserId },
    update: { email: email ?? undefined, displayName, role },
    create: {
      clerkUserId,
      email: email ?? `${clerkUserId}@unknown.local`,
      displayName,
      role,
    },
  });

  await seedPreferencesIfEmpty(user.id);
  return user;
}

// Convenience: ensure the caller has a local profile, returning it.
export async function ensureUser(req) {
  if (req.centralhub.user) return req.centralhub.user;
  const user = await syncUser(req.centralhub.clerkUserId, req.centralhub.isAdmin);
  req.centralhub.user = user;
  return user;
}
