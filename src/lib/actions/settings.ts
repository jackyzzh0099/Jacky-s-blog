"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertUser } from "@/lib/auth";
import { writeSettings } from "@/lib/db/queries";
import { DEFAULT_SETTINGS } from "@/lib/site";

const settingsInput = z.record(z.string(), z.string().max(600));

const ALLOWED_KEYS = new Set(Object.keys(DEFAULT_SETTINGS));

export async function saveSettings(
  values: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  await assertUser();

  const parsed = settingsInput.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Some fields are too long." };

  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    clean[key] = value.trim();
  }

  // Never allow blanking a core field — fall back to the shipped default.
  for (const key of ["name", "shortName", "tagline", "description", "author"] as const) {
    if (key in clean && clean[key].length === 0) clean[key] = DEFAULT_SETTINGS[key];
  }

  try {
    writeSettings(clean);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not write settings.",
    };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { ok: true };
}
