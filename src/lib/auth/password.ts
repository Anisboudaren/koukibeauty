import { createHash, timingSafeEqual } from "crypto";

const PEPPER = "kouki";

/** Node.js only — do not import this module from middleware / Edge. */
export function hashPassword(password: string): string {
  return createHash("sha256").update(`${PEPPER}:${password}`).digest("hex");
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const a = Buffer.from(hashPassword(password));
  const b = Buffer.from(passwordHash);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
