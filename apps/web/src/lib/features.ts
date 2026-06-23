export function isMarketplaceEnabled() {
  return Boolean(process.env.TEMPLATEFORGE_MARKETPLACE_MANIFEST_URL?.trim());
}
