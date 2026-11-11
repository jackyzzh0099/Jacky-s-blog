import matter from "gray-matter";
import { z } from "zod";

import { slugify } from "../utils";

const dateLike = z.union([z.string(), z.date()]).optional();

const postFrontMatter = z.object({
  title: z.string().min(1, "title is required"),
  description: z.string().optional(),
  summary: z.string().optional(),
  date: dateLike,
  updated: dateLike,
  category: z.string().optional(),
  tags: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((value) => {
      if (!value) return [] as string[];
      if (Array.isArray(value)) return value.map((v) => v.trim()).filter(Boolean);
      return value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }),
  cover: z.string().optional(),
  draft: z.boolean().optional(),
  featured: z.boolean().optional(),
  slug: z.string().optional(),
});

const projectFrontMatter = z.object({
  title: z.string().min(1, "title is required"),
  summary: z.string().optional(),
  description: z.string().optional(),
  date: dateLike,
  status: z.string().optional(),
  stack: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((value) => {
      if (!value) return [] as string[];
      if (Array.isArray(value)) return value.map((v) => v.trim()).filter(Boolean);
      return value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }),
  cover: z.string().optional(),
  repo: z.string().optional(),
  demo: z.string().optional(),
  featured: z.boolean().optional(),
  order: z.number().optional(),
  slug: z.string().optional(),
});

export interface ParsedPostFile {
  title: string;
  description: string;
  date: string;
  updated: string;
  categoryName: string;
  tags: string[];
  cover: string | null;
  draft: boolean;
  featured: boolean;
  slug: string;
  content: string;
}

export interface ParsedProjectFile {
  title: string;
  summary: string;
  date: string;
  status: string;
  stack: string[];
  cover: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  featured: boolean;
  order: number;
  slug: string;
  content: string;
}

function isoDate(value: string | Date | undefined, fallback: string): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  // Normalise to midday UTC so timezone offsets never shift the calendar day.
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12),
  ).toISOString();
}

function stripExtension(name: string): string {
  return name.replace(/\.(md|markdown|mdx)$/i, "");
}

export function parsePostFile(
  filename: string,
  raw: string,
): { ok: true; post: ParsedPostFile } | { ok: false; error: string } {
  try {
    const parsed = matter(raw);
    const data = postFrontMatter.parse(parsed.data ?? {});
    const now = new Date().toISOString();

    const slug = slugify(data.slug ?? stripExtension(filename));
    if (!slug) return { ok: false, error: "Unable to derive a slug from the file name." };

    return {
      ok: true,
      post: {
        title: data.title.trim(),
        description:
          (data.description ?? data.summary ?? "").trim() ||
          parsed.content
            .replace(/[#>*_`]/g, "")
            .trim()
            .slice(0, 160),
        date: isoDate(data.date, now),
        updated: isoDate(data.updated ?? data.date, isoDate(data.date, now)),
        categoryName: (data.category ?? "Thoughts").trim() || "Thoughts",
        tags: data.tags,
        cover: data.cover?.trim() || null,
        draft: data.draft ?? false,
        featured: data.featured ?? false,
        slug,
        content: parsed.content.trim(),
      },
    };
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues.map((i) => `${i.path.join(".") || "front matter"}: ${i.message}`).join("; ")
        : error instanceof Error
          ? error.message
          : "Could not parse the file.";
    return { ok: false, error: message };
  }
}

export function parseProjectFile(
  filename: string,
  raw: string,
): { ok: true; project: ParsedProjectFile } | { ok: false; error: string } {
  try {
    const parsed = matter(raw);
    const data = projectFrontMatter.parse(parsed.data ?? {});
    const now = new Date().toISOString();
    const slug = slugify(data.slug ?? stripExtension(filename));
    if (!slug) return { ok: false, error: "Unable to derive a slug from the file name." };

    return {
      ok: true,
      project: {
        title: data.title.trim(),
        summary: (data.summary ?? data.description ?? "").trim(),
        date: isoDate(data.date, now),
        status: (data.status ?? "active").toLowerCase(),
        stack: data.stack,
        cover: data.cover?.trim() || null,
        repoUrl: data.repo?.trim() || null,
        demoUrl: data.demo?.trim() || null,
        featured: data.featured ?? false,
        order: data.order ?? 99,
        slug,
        content: parsed.content.trim(),
      },
    };
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues.map((i) => `${i.path.join(".") || "front matter"}: ${i.message}`).join("; ")
        : error instanceof Error
          ? error.message
          : "Could not parse the file.";
    return { ok: false, error: message };
  }
}

/** Serialises a post back into a downloadable `.md` file with front matter. */
export function toMarkdownPost(post: {
  title: string;
  description: string;
  slug: string;
  published_at: string | null;
  updated_at: string;
  cover: string | null;
  featured: boolean;
  status: string;
  content: string;
  category: { name: string } | null;
  tags: { name: string }[];
}): string {
  const fm = [
    "---",
    `title: ${JSON.stringify(post.title)}`,
    `description: ${JSON.stringify(post.description)}`,
    `date: ${JSON.stringify((post.published_at ?? post.updated_at).slice(0, 10))}`,
    `updated: ${JSON.stringify(post.updated_at.slice(0, 10))}`,
    `category: ${JSON.stringify(post.category?.name ?? "Thoughts")}`,
    "tags:",
    ...(post.tags.length ? post.tags.map((t) => `  - ${JSON.stringify(t.name)}`) : ["  []"]),
    `cover: ${JSON.stringify(post.cover ?? "")}`,
    `draft: ${post.status === "draft"}`,
    `featured: ${post.featured}`,
    "---",
    "",
  ];
  return `${fm.join("\n")}${post.content}\n`;
}
