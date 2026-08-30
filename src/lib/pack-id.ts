/**
 * Short, URL-safe public IDs for saved packs (the /p/<id> slug).
 * ~11 chars of base58-ish alphabet (no 0/O/I/l to avoid confusion). No external dep.
 */
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

export function generatePackId(len = 11): string {
  let out = "";
  const bytes = new Uint8Array(len);
  // crypto is available in both the Edge/Node runtimes Next uses for route handlers.
  crypto.getRandomValues(bytes);
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** Validate an incoming /p/<id> slug so we never hit the DB with junk. */
export function isValidPackId(id: string): boolean {
  return typeof id === "string" && id.length >= 6 && id.length <= 24 && /^[0-9a-zA-Z]+$/.test(id);
}
