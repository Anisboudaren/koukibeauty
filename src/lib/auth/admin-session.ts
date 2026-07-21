/**
 * Admin session cookie helpers — Edge-safe (Web Crypto only).
 * Do not import Node.js `crypto` here; middleware runs on Edge.
 */

export const ADMIN_COOKIE = "kouki_admin";

function adminSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.DATABASE_URL?.slice(0, 48) ||
    "kouki-dev-admin-secret"
  );
}

async function hmacHex(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(adminSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

/** Signed cookie value: userId.signature */
export async function signAdminSession(userId: string): Promise<string> {
  const sig = await hmacHex(userId);
  return `${userId}.${sig}`;
}

export async function verifyAdminSession(
  cookieValue: string | undefined | null
): Promise<string | null> {
  if (!cookieValue) return null;
  const dot = cookieValue.indexOf(".");
  if (dot <= 0) return null;
  const userId = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);
  if (!userId || !sig) return null;
  const expected = await hmacHex(userId);
  if (!timingSafeEqualHex(sig, expected)) return null;
  return userId;
}
