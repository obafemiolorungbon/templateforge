export function isMarketplaceEnabled() {
  return Boolean(process.env.TEMPLATEFORGE_MARKETPLACE_MANIFEST_URL?.trim());
}

export function isDemoMode() {
  return process.env.DEMO_MODE?.trim().toLowerCase() === 'true';
}
