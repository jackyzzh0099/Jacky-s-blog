"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertUser } from "@/lib/auth";
import { all, one, run } from "@/lib/db/client";
import type { MediaItem } from "@/lib/db/types";
import {
  deleteMediaRow,
  listMedia,
  updateMedia,
} from "@/lib/db/queries";
import { removeUpload, saveUpload } from "@/lib/storage";
import { formatBytes } from "@/lib/utils";

export interface UploadResult {
  ok: boolean;
  items: MediaItem[];
  errors: string[];
}

export async function uploadMedia(formData: FormData): Promise<UploadResult> {
  await assertUser();

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return { ok: false, items: [], errors: ["No files were received."] };
  }
  if (files.length > 12) {
    return { ok: false, items: [], errors: ["Upload at most 12 files at a time."] };
  }

  const items: MediaItem[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      const stored = await saveUpload(file);
      const item: MediaItem = {
        id: crypto.randomUUID(),
        storage_key: stored.key,
        original_name: stored.originalName,
        filename: stored.filename,
        url: stored.url,
        mime: stored.mime,
        size: stored.size,
        width: stored.width,
        height: stored.height,
        alt: "",
        folder: stored.key.split("/").slice(0, 2).join("/"),
        created_at: new Date().toISOString(),
      };

      run(
        `INSERT INTO media (id, storage_key, original_name, filename, url, mime, size, width, height, alt, folder, created_at)
         VALUES (@id, @storage_key, @original_name, @filename, @url, @mime, @size, @width, @height, @alt, @folder, @created_at)`,
        item as unknown as Record<string, unknown>,
      );
      items.push(item);
    } catch (error) {
      errors.push(
        `${file.name}: ${error instanceof Error ? error.message : "upload failed"} (${formatBytes(file.size)})`,
      );
    }
  }

  revalidatePath("/admin/media");
  return { ok: errors.length === 0, items, errors };
}

const mediaPatch = z.object({
  id: z.string().min(1),
  alt: z.string().max(240).optional(),
  original_name: z.string().min(1).max(160).optional(),
  folder: z.string().max(60).optional(),
});

export async function updateMediaMeta(
  input: z.input<typeof mediaPatch>,
): Promise<{ ok: boolean; error?: string }> {
  await assertUser();
  const parsed = mediaPatch.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid media details." };

  updateMedia(parsed.data.id, {
    alt: parsed.data.alt,
    original_name: parsed.data.original_name,
    folder: parsed.data.folder,
  });
  revalidatePath("/admin/media");
  return { ok: true };
}

export async function deleteMediaItem(
  id: string,
): Promise<{ ok: boolean; error?: string; inUse?: number }> {
  await assertUser();

  const row = one<MediaItem>(`SELECT * FROM media WHERE id = ?`, [id]);
  if (!row) return { ok: false, error: "Media not found." };

  const usage = one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM posts WHERE cover = ?`,
    [row.url],
  );
  if ((usage?.n ?? 0) > 0) {
    return {
      ok: false,
      error: `This image is used as a cover on ${usage?.n} article(s). Change those first.`,
      inUse: usage?.n,
    };
  }

  try {
    await removeUpload(row.storage_key);
  } catch {
    /* the file may already be gone — the row should still be removed */
  }

  deleteMediaRow(id);
  revalidatePath("/admin/media");
  return { ok: true };
}

export async function listMediaForPicker(query = ""): Promise<MediaItem[]> {
  await assertUser();
  return listMedia(query);
}

export async function mediaUsage(): Promise<Record<string, number>> {
  await assertUser();
  const rows = all<{ cover: string; n: number }>(
    `SELECT cover, COUNT(*) AS n FROM posts WHERE cover IS NOT NULL GROUP BY cover`,
  );
  return Object.fromEntries(rows.map((row) => [row.cover, row.n]));
}
