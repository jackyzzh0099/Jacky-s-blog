import crypto from "node:crypto";

const KEY_LENGTH = 64;
const SCRYPT = { N: 16384, r: 8, p: 1 } as const;

/** scrypt with a per-password salt. Format: `scrypt$<salt>$<hash>`. */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, KEY_LENGTH, SCRYPT);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  if (expected.length === 0) return false;

  const derived = crypto.scryptSync(password, salt, expected.length, SCRYPT);
  return (
    derived.length === expected.length && crypto.timingSafeEqual(derived, expected)
  );
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
