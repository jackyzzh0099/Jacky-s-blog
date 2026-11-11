import fs from "node:fs";
import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { all, one, run } from "@/lib/db/client";
import { resolveDatabasePath } from "@/lib/db/client";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getStorageRoot } from "@/lib/storage";

/**
 * Deployment diagnostics. Reports only the outcome of each step (never data or
 * secrets), which is enough to tell "read-only filesystem" apart from a bad
 * native dependency or a crypto failure.
 */
export const dynamic = "force-dynamic";

function step(name: string, fn: () => void) {
  try {
    fn();
    return { name, ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      name,
      ok: false,
      // Error messages here are infrastructure-level (SQLITE_READONLY, etc.).
      error: message.slice(0, 200),
    };
  }
}

export function GET() {
  const results = [];

  results.push(step("sqlite-read", () => {
    const row = one<{ n: number }>("SELECT COUNT(*) AS n FROM posts");
    if (!row) throw new Error("no row returned");
  }));

  const probeId = `diag-${crypto.randomBytes(4).toString("hex")}`;
  results.push(step("sqlite-write", () => {
    run(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
      [probeId, "1", new Date().toISOString()],
    );
    run(`DELETE FROM settings WHERE key = ?`, [probeId]);
  }));

  results.push(step("scrypt", () => {
    const hash = hashPassword("diagnostic-password");
    if (!verifyPassword("diagnostic-password", hash)) throw new Error("verify failed");
  }));

  results.push(step("uploads-dir", () => {
    const root = getStorageRoot();
    fs.mkdirSync(root, { recursive: true });
    const probe = `${root}/.diag-${probeId}`;
    fs.writeFileSync(probe, "ok");
    fs.unlinkSync(probe);
  }));

  results.push(step("tables", () => {
    const tables = all<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type = 'table'`,
    );
    if (tables.length === 0) throw new Error("schema missing");
  }));

  return NextResponse.json(
    {
      ok: results.every((r) => r.ok),
      database: resolveDatabasePath(),
      storage: getStorageRoot(),
      node: process.version,
      steps: results,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
