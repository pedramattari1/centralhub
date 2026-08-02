import { prisma } from '../lib/prisma.js';

/**
 * Append an entry to the admin audit log. Called from a single place per
 * mutation so traceability stays consistent. Best-effort: a logging failure
 * must never break the underlying admin action.
 */
export async function recordAudit({ adminUserId, action, targetType, targetId = null, metadata = null }) {
  try {
    await prisma.adminAuditLog.create({
      data: { adminUserId, action, targetType, targetId, metadata },
    });
  } catch (err) {
    console.error('[audit] failed to write audit log entry', err);
  }
}
