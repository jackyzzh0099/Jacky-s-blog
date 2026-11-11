"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertUser } from "@/lib/auth";
import { one, run } from "@/lib/db/client";
import { slugify } from "@/lib/utils";

const categoryInput = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "A name is required.").max(60),
  description: z.string().trim().max(240).optional(),
  accent: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex colour.")
    .optional(),
  sortOrder: z.number().int().min(0).max(99).optional(),
});

function revalidateTaxonomy() {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/archive");
  revalidatePath("/about");
  revalidatePath("/admin/taxonomy");
  revalidatePath("/admin/posts");
}

export async function saveCategory(
  input: z.input<typeof categoryInput>,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  await assertUser();
  const parsed = categoryInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid category." };
  }
  const data = parsed.data;
  const slug = slugify(data.name);
  if (!slug) return { ok: false, error: "That name cannot be turned into a slug." };

  const clash = one<{ id: string }>(`SELECT id FROM categories WHERE slug = ?`, [slug]);
  if (clash && clash.id !== data.id) {
    return { ok: false, error: "Another category already uses that name." };
  }

  if (data.id) {
    run(
      `UPDATE categories SET slug = ?, name = ?, description = ?, accent = ?, sort_order = ? WHERE id = ?`,
      [
        slug,
        data.name,
        data.description ?? "",
        data.accent ?? "#8A8F98",
        data.sortOrder ?? 50,
        data.id,
      ],
    );
    revalidateTaxonomy();
    return { ok: true, id: data.id };
  }

  const id = crypto.randomUUID();
  run(
    `INSERT INTO categories (id, slug, name, description, accent, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, slug, data.name, data.description ?? "", data.accent ?? "#8A8F98", data.sortOrder ?? 50],
  );
  revalidateTaxonomy();
  return { ok: true, id };
}

export async function deleteCategory(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await assertUser();
  const usage = one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM posts WHERE category_id = ?`,
    [id],
  );
  if ((usage?.n ?? 0) > 0) {
    return {
      ok: false,
      error: `${usage?.n} article(s) still use this field. Reassign them first.`,
    };
  }
  run(`DELETE FROM categories WHERE id = ?`, [id]);
  revalidateTaxonomy();
  return { ok: true };
}

const tagInput = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "A name is required.").max(40),
});

export async function saveTag(
  input: z.input<typeof tagInput>,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  await assertUser();
  const parsed = tagInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid tag." };
  }
  const data = parsed.data;
  const slug = slugify(data.name);
  if (!slug) return { ok: false, error: "That name cannot be turned into a slug." };

  const clash = one<{ id: string }>(`SELECT id FROM tags WHERE slug = ?`, [slug]);
  if (clash && clash.id !== data.id) {
    return { ok: false, error: "That tag already exists." };
  }

  if (data.id) {
    run(`UPDATE tags SET name = ?, slug = ? WHERE id = ?`, [data.name, slug, data.id]);
    revalidateTaxonomy();
    return { ok: true, id: data.id };
  }

  const id = crypto.randomUUID();
  run(`INSERT INTO tags (id, slug, name) VALUES (?, ?, ?)`, [id, slug, data.name]);
  revalidateTaxonomy();
  return { ok: true, id };
}

export async function deleteTag(id: string): Promise<{ ok: boolean; error?: string }> {
  await assertUser();
  run(`DELETE FROM tags WHERE id = ?`, [id]);
  revalidateTaxonomy();
  return { ok: true };
}
