/**
 * Canonical public origin for the site. Used for metadataBase so OG/Twitter image
 * URLs resolve to absolute links. Override with NEXT_PUBLIC_SITE_URL (e.g. a custom
 * domain); otherwise falls back to the Vercel deployment URL, then the known origin.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "") ||
  "https://gram-labs.vercel.app";
