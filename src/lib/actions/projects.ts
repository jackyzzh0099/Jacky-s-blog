"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertUser } from "@/lib/auth";
import { one, run } from "@/lib/db/client";
import { getProjectById } from "@/lib/db/queries";
import { slugify } from "@/lib/utils";

const projectInput = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "A project name is required.").max(120),
  slug: z.string().trim().optional(),
  summary: z.string().trim().max(400).optional(),
  content: z.string().optional(),
  cover: z.string().trim().nullable().optional(),
  repoUrl: z.string().trim().nullable().optional(),
  demoUrl: z.string().trim().nullable().optional(),
  stack: z.array(z.string().trim().min(1)).max(14).optional(),
  status: z.enum(["active", "beta", "wip", "archived"]),
  year: z.string().trim().max(12).optional(),
  featured: z.boolean().optional(),
  order: z.number().int().min(0).max(999).optional(),
});

export type SaveProjectInput = z.input<typeof projectInput>;
export type SaveProjectResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; error: string };

function uniqueSlug(base: string, currentId?: string): string {
  const root = slugify(base) || `project-${crypto.randomBytes(3).toString("hex")}`;
  let candidate = root;
  let attempt = 1;
  while (true) {
    const row = one<{ id: string }>(`SELECT id FROM projects WHERE slug = ?`, [candidate]);
    if (!row || row.id === currentId) return candidate;
    attempt += 1;
    candidate = `${root}-${attempt}`;
  }
}

export async function saveProject(
  input: SaveProjectInput,
): Promise<SaveProjectResult> {
  await assertUser();

  const parsed = projectInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;
  const existing = data.id ? getProjectById(data.id) : null;
  if (data.id && !existing) return { ok: false, error: "Project not found." };

  const slug = uniqueSlug(data.slug || data.title, existing?.id);
  const now = new Date().toISOString();
  const id = existing?.id ?? crypto.randomUUID();

  const values = {
    id,
    slug,
    title: data.title,
    summary: data.summary ?? "",
    content: data.content ?? "",
    cover: data.cover || null,
    repo_url: data.repoUrl || null,
    demo_url: data.demoUrl || null,
    stack: JSON.stringify(data.stack ?? []),
    status: data.status,
    year: data.year || String(new Date().getFullYear()),
    featured: data.featured ? 1 : 0,
    sort_order: data.order ?? existing?.sort_order ?? 99,
    updated_at: now,
  };

  try {
    if (existing) {
      run(
        `UPDATE projects SET slug = @slug, title = @title, summary = @summary, content = @content,
           cover = @cover, repo_url = @repo_url, demo_url = @demo_url, stack = @stack,
           status = @status, year = @year, featured = @featured, sort_order = @sort_order,
           updated_at = @updated_at
         WHERE id = @id`,
        values,
      );
    } else {
      run(
        `INSERT INTO projects (id, slug, title, summary, content, cover, repo_url, demo_url, stack,
                               status, year, featured, sort_order, created_at, updated_at)
         VALUES (@id, @slug, @title, @summary, @content, @cover, @repo_url, @demo_url, @stack,
                 @status, @year, @featured, @sort_order, @created_at, @updated_at)`,
        { ...values, created_at: now },
      );
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not save the project.",
    };
  }

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${slug}`);
  revalidatePath("/archive");
  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  if (existing && existing.slug !== slug) revalidatePath(`/projects/${existing.slug}`);

  return { ok: true, id, slug };
}

export async function deleteProject(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await assertUser();
  const project = getProjectById(id);
  if (!project) return { ok: false, error: "Project not found." };

  run(`DELETE FROM projects WHERE id = ?`, [id]);
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${project.slug}`);
  revalidatePath("/archive");
  revalidatePath("/admin/projects");
  return { ok: true };
}
