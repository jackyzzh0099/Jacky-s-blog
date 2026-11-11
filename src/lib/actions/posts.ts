"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertUser } from "@/lib/auth";
import { one, run, transaction } from "@/lib/db/client";
import {
  getPostById,
  listCategories,
  listTagsWithCounts,
} from "@/lib/db/queries";
import { parsePostFile, toMarkdownPost } from "@/lib/content/parse";
import { renderMarkdown, type RenderedPart, type TocItem } from "@/lib/markdown";
import { estimateReadingTime, slugify } from "@/lib/utils";

const postInput = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "A title is required.").max(180),
  slug: z.string().trim().optional(),
  description: z.string().trim().max(400).optional(),
  content: z.string().min(1, "The article body is empty."),
  categoryId: z.string().trim().nullable().optional(),
  tags: z.array(z.string().trim().min(1)).max(12).optional(),
  cover: z.string().trim().nullable().optional(),
  featured: z.boolean().optional(),
  status: z.enum(["draft", "published"]),
  publishedAt: z.string().trim().nullable().optional(),
});

export type SavePostInput = z.input<typeof postInput>;
export type SavePostResult =
  | { ok: true; id: string; slug: string; updatedAt: string }
  | { ok: false; error: string };

function uniqueSlug(base: string, currentId?: string): string {
  const root = slugify(base) || `post-${crypto.randomBytes(3).toString("hex")}`;
  let candidate = root;
  let attempt = 1;

  while (true) {
    const row = one<{ id: string }>(`SELECT id FROM posts WHERE slug = ?`, [candidate]);
    if (!row || row.id === currentId) return candidate;
    attempt += 1;
    candidate = `${root}-${attempt}`;
  }
}

function revalidatePost(slug: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/archive");
  revalidatePath("/search");
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
}

export async function savePost(input: SavePostInput): Promise<SavePostResult> {
  await assertUser();

  const parsed = postInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const existing = data.id ? getPostById(data.id) : null;
  if (data.id && !existing) return { ok: false, error: "That post no longer exists." };

  const slug = uniqueSlug(data.slug || data.title, existing?.id);
  const now = new Date().toISOString();
  const id = existing?.id ?? crypto.randomUUID();
  const readingMinutes = estimateReadingTime(data.content);

  const publishedAt =
    data.status === "published"
      ? data.publishedAt || existing?.published_at || now
      : existing?.published_at ?? null;

  const tagNames = (data.tags ?? [])
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);

  try {
    transaction(() => {
      if (existing) {
        run(
          `UPDATE posts SET
             slug = @slug, title = @title, description = @description, content = @content,
             cover = @cover, category_id = @category_id, status = @status, featured = @featured,
             reading_minutes = @reading_minutes, published_at = @published_at, updated_at = @updated_at
           WHERE id = @id`,
          {
            id,
            slug,
            title: data.title,
            description: data.description ?? "",
            content: data.content,
            cover: data.cover || null,
            category_id: data.categoryId || null,
            status: data.status,
            featured: data.featured ? 1 : 0,
            reading_minutes: readingMinutes,
            published_at: publishedAt,
            updated_at: now,
          },
        );
      } else {
        run(
          `INSERT INTO posts (id, slug, title, description, content, cover, category_id, status,
                              featured, reading_minutes, published_at, created_at, updated_at)
           VALUES (@id, @slug, @title, @description, @content, @cover, @category_id, @status,
                   @featured, @reading_minutes, @published_at, @created_at, @updated_at)`,
          {
            id,
            slug,
            title: data.title,
            description: data.description ?? "",
            content: data.content,
            cover: data.cover || null,
            category_id: data.categoryId || null,
            status: data.status,
            featured: data.featured ? 1 : 0,
            reading_minutes: readingMinutes,
            published_at: publishedAt,
            created_at: now,
            updated_at: now,
          },
        );
      }

      run(`DELETE FROM post_tags WHERE post_id = ?`, [id]);
      for (const name of tagNames) {
        const tagSlug = slugify(name);
        if (!tagSlug) continue;
        const existingTag = one<{ id: string }>(
          `SELECT id FROM tags WHERE slug = ?`,
          [tagSlug],
        );
        const tagId = existingTag?.id ?? crypto.randomUUID();
        if (!existingTag) {
          run(`INSERT INTO tags (id, slug, name) VALUES (?, ?, ?)`, [
            tagId,
            tagSlug,
            name,
          ]);
        }
        run(`INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)`, [
          id,
          tagId,
        ]);
      }
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not save the article.",
    };
  }

  revalidatePost(slug);
  if (existing && existing.slug !== slug) revalidatePath(`/blog/${existing.slug}`);

  return { ok: true, id, slug, updatedAt: now };
}

export async function deletePost(id: string): Promise<{ ok: boolean; error?: string }> {
  await assertUser();
  const post = getPostById(id);
  if (!post) return { ok: false, error: "Post not found." };

  run(`DELETE FROM posts WHERE id = ?`, [id]);
  revalidatePost(post.slug);
  revalidatePath(`/blog/${post.slug}`);
  return { ok: true };
}

export async function togglePostStatus(
  id: string,
): Promise<{ ok: boolean; status?: "draft" | "published"; error?: string }> {
  await assertUser();
  const post = getPostById(id);
  if (!post) return { ok: false, error: "Post not found." };

  const next = post.status === "published" ? "draft" : "published";
  const now = new Date().toISOString();
  run(
    `UPDATE posts SET status = ?, published_at = COALESCE(published_at, ?), updated_at = ? WHERE id = ?`,
    [next, next === "published" ? now : null, now, id],
  );
  revalidatePost(post.slug);
  return { ok: true, status: next };
}

export interface ImportedDraft {
  title: string;
  slug: string;
  description: string;
  content: string;
  categoryId: string | null;
  categoryName: string;
  tags: string[];
  cover: string | null;
  status: "draft" | "published";
  featured: boolean;
  publishedAt: string;
}

export async function importMarkdownFile(
  fileName: string,
  raw: string,
): Promise<{ ok: true; draft: ImportedDraft } | { ok: false; error: string }> {
  await assertUser();

  if (raw.length > 400_000) {
    return { ok: false, error: "That file is larger than 400 kB." };
  }

  const result = parsePostFile(fileName, raw);
  if (!result.ok) return { ok: false, error: result.error };

  const categories = listCategories();
  const match = categories.find(
    (category) =>
      category.slug === slugify(result.post.categoryName) ||
      category.name.toLowerCase() === result.post.categoryName.toLowerCase(),
  );

  return {
    ok: true,
    draft: {
      title: result.post.title,
      slug: result.post.slug,
      description: result.post.description,
      content: result.post.content,
      categoryId: match?.id ?? null,
      categoryName: result.post.categoryName,
      tags: result.post.tags,
      cover: result.post.cover,
      status: result.post.draft ? "draft" : "published",
      featured: result.post.featured,
      publishedAt: result.post.date,
    },
  };
}

export async function previewMarkdown(markdown: string): Promise<{
  ok: boolean;
  parts?: RenderedPart[];
  toc?: TocItem[];
  error?: string;
}> {
  await assertUser();
  if (markdown.length > 400_000) {
    return { ok: false, error: "Preview is limited to 400 kB of Markdown." };
  }
  try {
    const doc = await renderMarkdown(markdown);
    return { ok: true, parts: doc.parts, toc: doc.toc };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not render the preview.",
    };
  }
}

export async function exportPostMarkdown(
  id: string,
): Promise<{ ok: boolean; fileName?: string; markdown?: string; error?: string }> {
  await assertUser();
  const post = getPostById(id);
  if (!post) return { ok: false, error: "Post not found." };

  return {
    ok: true,
    fileName: `${post.slug}.md`,
    markdown: toMarkdownPost(post),
  };
}

export async function listTagSuggestions(): Promise<{ name: string; count: number }[]> {
  await assertUser();
  return listTagsWithCounts().map((tag) => ({
    name: tag.name,
    count: tag.postCount,
  }));
}
