// Opens a platform's external URL in a new tab with safe link attributes,
// and fires recently-used tracking (fire-and-forget).
export function openPlatform(platform, recordOpen) {
  if (recordOpen) recordOpen(platform.id);
  window.open(platform.url, '_blank', 'noopener,noreferrer');
}
