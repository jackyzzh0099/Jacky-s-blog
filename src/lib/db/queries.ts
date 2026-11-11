import { all, one, run, transaction } from "./client";
import type {
  ActivityEntry,
  Category,
  CategoryWithCount,
  MediaItem,
  Paginated,
  Post,
  PostRow,
  PostStatus,
  PostSummary,
  Project,
  ProjectRow,
  SearchHit,
  SiteStats,
  Tag,
  TagWithCount,
} from "./types";

const POST_SELECT = `
  SELECT p.*,
         c.id          AS c_id,
         c.slug        AS c_slug,
         c.name        AS c_name,
         c.description AS c_description,
         c.accent      AS c_accent,
         c.sort_order  AS c_sort_order
  FROM posts p
  LEFT JOIN categories c ON c.id = p.category_id
`;

type PostJoinRow = PostRow & {
  c_id: string | null;
  c_slug: string | null;
  c_name: string | null;
  c_description: string | null;
  c_accent: string | null;
  c_sort_order: number | null;
};

function tagsForPosts(postIds: string[]): Map<string, Tag[]> {
  const map = new Map<string, Tag[]>();
  if (postIds.length === 0) return map;

  const placeholders = postIds.map(() => "?").join(", ");
  const rows = all<Tag & { post_id: string }>(
    `SELECT pt.post_id, t.id, t.slug, t.name
     FROM post_tags pt
     JOIN tags t ON t.id = pt.tag_id
     WHERE pt.post_id IN (${placeholders})
     ORDER BY t.name COLLATE NOCASE`,
    postIds,
  );

  for (const row of rows) {
    const list = map.get(row.post_id) ?? [];
    list.push({ id: row.id, slug: row.slug, name: row.name });
    map.set(row.post_id, list);
  }
  return map;
}

function mapPost(row: PostJoinRow): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    content: row.content,
    cover: row.cover,
    category_id: row.category_id,
    status: row.status,
    featured: row.featured === 1,
    reading_minutes: row.reading_minutes,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category: row.c_id
      ? {
          id: row.c_id,
          slug: row.c_slug ?? "",
          name: row.c_name ?? "",
          description: row.c_description ?? "",
          accent: row.c_accent ?? "",
          sortOrder: row.c_sort_order ?? 0,
        }
      : null,
    tags: [],
  };
}

function hydrate(rows: PostJoinRow[]): Post[] {
  const posts = rows.map(mapPost);
  const tagMap = tagsForPosts(posts.map((p) => p.id));
  for (const post of posts) post.tags = tagMap.get(post.id) ?? [];
  return posts;
}

function toSummary(post: Post): PostSummary {
  const { content: _content, category_id: _categoryId, ...rest } = post;
  return rest;
}

/* ── Posts ─────────────────────────────────────────────────────────────────── */

function buildPostFilter(query: {
  category?: string;
  tag?: string;
  q?: string;
  featuredOnly?: boolean;
  status?: PostStatus | "all";
}) {
  const where: string[] = [];
  const params: unknown[] = [];

  if (!query.status || query.status === "published") {
    where.push("p.status = 'published'");
  } else if (query.status !== "all") {
    where.push("p.status = ?");
    params.push(query.status);
  }

  if (query.category) {
    where.push("c.slug = ?");
    params.push(query.category);
  }

  if (query.tag) {
    where.push(
      "EXISTS (SELECT 1 FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id AND t.slug = ?)",
    );
    params.push(query.tag);
  }

  if (query.featuredOnly) {
    where.push("p.featured = 1");
  }

  if (query.q) {
    const like = `%${query.q}%`;
    where.push(`(
      p.title LIKE ? OR p.description LIKE ? OR p.content LIKE ?
      OR EXISTS (
        SELECT 1 FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
        WHERE pt.post_id = p.id AND t.name LIKE ?
      )
      OR c.name LIKE ?
    )`);
    params.push(like, like, like, like, like);
  }

  return { clause: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

export function listPosts(
  query: Parameters<typeof buildPostFilter>[0] & {
    page?: number;
    perPage?: number;
    sort?: "newest" | "updated";
  } = {},
): Paginated<PostSummary> {
  const page = Math.max(1, query.page ?? 1);
  const perPage = Math.min(50, Math.max(1, query.perPage ?? 9));
  const { clause, params } = buildPostFilter(query);

  const countRow = one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM posts p LEFT JOIN categories c ON c.id = p.category_id ${clause}`,
    params,
  );
  const total = countRow?.n ?? 0;

  const order =
    query.sort === "updated"
      ? "p.updated_at DESC"
      : "COALESCE(p.published_at, p.created_at) DESC";

  const rows = all<PostJoinRow>(
    `${POST_SELECT} ${clause} ORDER BY ${order} LIMIT ? OFFSET ?`,
    [...params, perPage, (page - 1) * perPage],
  );

  return {
    items: hydrate(rows).map(toSummary),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export function getPostBySlug(
  slug: string,
  options: { includeDrafts?: boolean } = {},
): Post | null {
  const row = one<PostJoinRow>(`${POST_SELECT} WHERE p.slug = ?`, [slug]);
  if (!row) return null;
  if (row.status !== "published" && !options.includeDrafts) return null;
  return hydrate([row])[0] ?? null;
}

export function getPostById(id: string): Post | null {
  const row = one<PostJoinRow>(`${POST_SELECT} WHERE p.id = ?`, [id]);
  return row ? (hydrate([row])[0] ?? null) : null;
}

export function listFeaturedPosts(limit = 3): PostSummary[] {
  return listPosts({ featuredOnly: true, perPage: limit }).items;
}

export function getAdjacentPosts(post: Post): {
  prev: PostSummary | null;
  next: PostSummary | null;
} {
  const anchor = post.published_at ?? post.created_at;

  const prevRow = one<PostJoinRow>(
    `${POST_SELECT}
     WHERE p.status = 'published' AND p.id != ?
       AND COALESCE(p.published_at, p.created_at) < ?
     ORDER BY COALESCE(p.published_at, p.created_at) DESC LIMIT 1`,
    [post.id, anchor],
  );

  const nextRow = one<PostJoinRow>(
    `${POST_SELECT}
     WHERE p.status = 'published' AND p.id != ?
       AND COALESCE(p.published_at, p.created_at) > ?
     ORDER BY COALESCE(p.published_at, p.created_at) ASC LIMIT 1`,
    [post.id, anchor],
  );

  return {
    prev: prevRow ? toSummary(hydrate([prevRow])[0]) : null,
    next: nextRow ? toSummary(hydrate([nextRow])[0]) : null,
  };
}

export function getRelatedPosts(post: Post, limit = 3): PostSummary[] {
  const rows = all<PostJoinRow>(
    `${POST_SELECT}
     WHERE p.status = 'published' AND p.id != ?
       AND (
         p.category_id = ?
         OR EXISTS (
           SELECT 1 FROM post_tags pt
           WHERE pt.post_id = p.id
             AND pt.tag_id IN (SELECT tag_id FROM post_tags WHERE post_id = ?)
         )
       )
     ORDER BY (
       SELECT COUNT(*) FROM post_tags a
       JOIN post_tags b ON a.tag_id = b.tag_id
       WHERE a.post_id = p.id AND b.post_id = ?
     ) DESC, COALESCE(p.published_at, p.created_at) DESC
     LIMIT ?`,
    [post.id, post.category_id, post.id, post.id, limit],
  );

  return hydrate(rows).map(toSummary);
}

/** Every published post — used by sitemap, RSS and the search index. */
export function listAllPublished(): PostSummary[] {
  return listPosts({ perPage: 50, page: 1 }).items;
}

export function listAllPublishedDeep(): Post[] {
  const rows = all<PostJoinRow>(
    `${POST_SELECT} WHERE p.status = 'published' ORDER BY COALESCE(p.published_at, p.created_at) DESC`,
  );
  return hydrate(rows);
}

/** Admin listing — includes drafts and enforces no public visibility rules. */
export function listPostsForAdmin(query: {
  q?: string;
  status?: PostStatus | "all";
  page?: number;
  perPage?: number;
}): Paginated<PostSummary> {
  return listPosts({
    ...query,
    status: query.status ?? "all",
    sort: "updated",
    perPage: query.perPage ?? 20,
  });
}

/* ── Taxonomy ──────────────────────────────────────────────────────────────── */

export function listCategories(): Category[] {
  return all<Category>(
    `SELECT id, slug, name, description, accent, sort_order AS sortOrder
     FROM categories ORDER BY sort_order ASC, name ASC`,
  );
}

export function listCategoriesWithCounts(): CategoryWithCount[] {
  return all<CategoryWithCount>(
    `SELECT c.id, c.slug, c.name, c.description, c.accent, c.sort_order AS sortOrder,
            COUNT(p.id) AS postCount
     FROM categories c
     LEFT JOIN posts p ON p.category_id = c.id AND p.status = 'published'
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.name ASC`,
  );
}

export function getCategoryBySlug(slug: string): Category | null {
  return (
    one<Category>(
      `SELECT id, slug, name, description, accent, sort_order AS sortOrder
       FROM categories WHERE slug = ?`,
      [slug],
    ) ?? null
  );
}

export function listTagsWithCounts(): TagWithCount[] {
  return all<TagWithCount>(
    `SELECT t.id, t.slug, t.name, COUNT(p.id) AS postCount
     FROM tags t
     LEFT JOIN post_tags pt ON pt.tag_id = t.id
     LEFT JOIN posts p ON p.id = pt.post_id AND p.status = 'published'
     GROUP BY t.id
     ORDER BY postCount DESC, t.name ASC`,
  );
}

export function listTags(limit = 100): Tag[] {
  return all<Tag>(`SELECT id, slug, name FROM tags ORDER BY name ASC LIMIT ?`, [
    limit,
  ]);
}

/* ── Projects ──────────────────────────────────────────────────────────────── */

function mapProject(row: ProjectRow): Project {
  let stack: string[] = [];
  try {
    const parsed = JSON.parse(row.stack);
    if (Array.isArray(parsed)) stack = parsed.filter((s) => typeof s === "string");
  } catch {
    stack = row.stack ? row.stack.split(",").map((s) => s.trim()) : [];
  }
  return { ...row, stack, featured: row.featured === 1 };
}

export function listProjects(): Project[] {
  return all<ProjectRow>(
    `SELECT * FROM projects ORDER BY sort_order ASC, COALESCE(updated_at, created_at) DESC`,
  ).map(mapProject);
}

export function getProjectBySlug(slug: string): Project | null {
  const row = one<ProjectRow>(`SELECT * FROM projects WHERE slug = ?`, [slug]);
  return row ? mapProject(row) : null;
}

export function getProjectById(id: string): Project | null {
  const row = one<ProjectRow>(`SELECT * FROM projects WHERE id = ?`, [id]);
  return row ? mapProject(row) : null;
}

/* ── Aggregate views ───────────────────────────────────────────────────────── */

export function getSiteStats(): SiteStats {
  const posts = one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM posts WHERE status = 'published'`,
  );
  const drafts = one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM posts WHERE status = 'draft'`,
  );
  const projects = one<{ n: number }>(`SELECT COUNT(*) AS n FROM projects`);
  const categories = one<{ n: number }>(`SELECT COUNT(*) AS n FROM categories`);
  const tags = one<{ n: number }>(`SELECT COUNT(*) AS n FROM tags`);
  const last = one<{ d: string | null }>(
    `SELECT MAX(updated_at) AS d FROM (
       SELECT updated_at FROM posts WHERE status = 'published'
       UNION ALL SELECT updated_at FROM projects
     )`,
  );

  return {
    posts: posts?.n ?? 0,
    drafts: drafts?.n ?? 0,
    projects: projects?.n ?? 0,
    categories: categories?.n ?? 0,
    tags: tags?.n ?? 0,
    lastUpdated: last?.d ?? null,
  };
}

export function listRecentActivity(limit = 6): ActivityEntry[] {
  const posts = all<{
    id: string;
    slug: string;
    title: string;
    status: string;
    date: string;
    category: string | null;
  }>(
    `SELECT p.id, p.slug, p.title, p.status,
            COALESCE(p.updated_at, p.published_at, p.created_at) AS date,
            c.name AS category
     FROM posts p LEFT JOIN categories c ON c.id = p.category_id
     ORDER BY date DESC LIMIT ?`,
    [limit],
  ).map((p) => ({
    id: p.id,
    kind: "post" as const,
    title: p.title,
    href: `/blog/${p.slug}`,
    status: p.status,
    date: p.date,
    meta: p.category ?? "Article",
  }));

  const projects = all<{
    id: string;
    slug: string;
    title: string;
    status: string;
    date: string;
  }>(
    `SELECT id, slug, title, status, COALESCE(updated_at, created_at) AS date
     FROM projects ORDER BY date DESC LIMIT ?`,
    [limit],
  ).map((p) => ({
    id: p.id,
    kind: "project" as const,
    title: p.title,
    href: `/projects/${p.slug}`,
    status: p.status,
    date: p.date,
    meta: "Project",
  }));

  return [...posts, ...projects]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit);
}

export interface ArchiveMonth {
  key: string; // YYYY-MM
  label: string;
  posts: PostSummary[];
  projects: Project[];
}

export interface ArchiveYear {
  year: string;
  count: number;
  months: ArchiveMonth[];
}

export function getArchive(): ArchiveYear[] {
  const posts = listAllPublishedDeep();
  const projects = listProjects();

  const years = new Map<string, ArchiveYear>();

  const ensureYear = (year: string) => {
    let entry = years.get(year);
    if (!entry) {
      entry = { year, count: 0, months: [] };
      years.set(year, entry);
    }
    return entry;
  };

  const ensureMonth = (entry: ArchiveYear, month: string) => {
    let m = entry.months.find((x) => x.key === month);
    if (!m) {
      const label = new Date(`${month}-01T00:00:00Z`).toLocaleString("en-US", {
        month: "long",
        timeZone: "UTC",
      });
      m = { key: month, label, posts: [], projects: [] };
      entry.months.push(m);
    }
    return m;
  };

  for (const post of posts) {
    const date = post.published_at ?? post.created_at;
    const entry = ensureYear(date.slice(0, 4));
    const month = ensureMonth(entry, date.slice(0, 7));
    month.posts.push(post);
    entry.count += 1;
  }

  for (const project of projects) {
    const date = project.updated_at ?? project.created_at;
    const entry = ensureYear(date.slice(0, 4));
    const month = ensureMonth(entry, date.slice(0, 7));
    month.projects.push(project);
    entry.count += 1;
  }

  return [...years.values()]
    .map((y) => ({
      ...y,
      months: y.months.sort((a, b) => (a.key < b.key ? 1 : -1)),
    }))
    .sort((a, b) => (a.year < b.year ? 1 : -1));
}

/* ── Search ────────────────────────────────────────────────────────────────── */

const stripMarkdown = (value: string) =>
  value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function makeExcerpt(text: string, query: string, length = 170): string {
  const clean = stripMarkdown(text);
  if (!query) return clean.slice(0, length);

  const lower = clean.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return clean.slice(0, length);

  const start = Math.max(0, idx - Math.floor(length / 3));
  const slice = clean.slice(start, start + length);
  return `${start > 0 ? "…" : ""}${slice}${start + length < clean.length ? "…" : ""}`;
}

export function searchEverything(rawQuery: string, limit = 12): SearchHit[] {
  const query = rawQuery.trim();
  if (query.length < 1) return [];
  const like = `%${query}%`;
  const lowerQuery = query.toLowerCase();
  const hits: SearchHit[] = [];

  const posts = all<PostRow & { category: string | null }>(
    `SELECT p.*, c.name AS category FROM posts p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.status = 'published'
       AND (p.title LIKE ? OR p.description LIKE ? OR p.content LIKE ?
            OR c.name LIKE ?
            OR EXISTS (SELECT 1 FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
                       WHERE pt.post_id = p.id AND t.name LIKE ?))
     ORDER BY COALESCE(p.published_at, p.created_at) DESC
     LIMIT 60`,
    [like, like, like, like, like],
  );

  const tagMap = tagsForPosts(posts.map((p) => p.id));

  for (const p of posts) {
    const tags = tagMap.get(p.id) ?? [];
    const title = p.title.toLowerCase();
    let score = 0;
    if (title === lowerQuery) score += 40;
    if (title.includes(lowerQuery)) score += 18;
    if (p.description.toLowerCase().includes(lowerQuery)) score += 8;
    if ((p.category ?? "").toLowerCase().includes(lowerQuery)) score += 6;
    if (tags.some((t) => t.name.toLowerCase().includes(lowerQuery))) score += 7;
    if (p.content.toLowerCase().includes(lowerQuery)) score += 3;
    if (p.featured === 1) score += 1;

    const inBody = p.content.toLowerCase().includes(lowerQuery);
    const excerpt = makeExcerpt(
      inBody ? p.content : p.description || p.content,
      query,
    );

    hits.push({
      id: p.id,
      type: "post",
      title: p.title,
      excerpt,
      href: `/blog/${p.slug}`,
      category: p.category ?? "Article",
      tags: tags.map((t) => t.name),
      date: p.published_at ?? p.created_at,
      score,
    });
  }

  const projects = all<ProjectRow>(
    `SELECT * FROM projects
     WHERE title LIKE ? OR summary LIKE ? OR content LIKE ? OR stack LIKE ?
     LIMIT 30`,
    [like, like, like, like],
  );

  for (const raw of projects) {
    const project = mapProject(raw);
    const title = project.title.toLowerCase();
    let score = 0;
    if (title === lowerQuery) score += 36;
    if (title.includes(lowerQuery)) score += 16;
    if (project.summary.toLowerCase().includes(lowerQuery)) score += 8;
    if (project.stack.some((s) => s.toLowerCase().includes(lowerQuery)))
      score += 6;
    if (project.content.toLowerCase().includes(lowerQuery)) score += 3;

    hits.push({
      id: project.id,
      type: "project",
      title: project.title,
      excerpt: makeExcerpt(
        project.content.toLowerCase().includes(lowerQuery)
          ? project.content
          : project.summary,
        query,
      ),
      href: `/projects/${project.slug}`,
      category: "Project",
      tags: project.stack,
      date: project.updated_at,
      score,
    });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

/* ── Media ─────────────────────────────────────────────────────────────────── */

export function listMedia(query = ""): MediaItem[] {
  if (query.trim()) {
    const like = `%${query.trim()}%`;
    return all<MediaItem>(
      `SELECT * FROM media WHERE original_name LIKE ? OR filename LIKE ? OR alt LIKE ? OR folder LIKE ?
       ORDER BY created_at DESC LIMIT 300`,
      [like, like, like, like],
    );
  }
  return all<MediaItem>(`SELECT * FROM media ORDER BY created_at DESC LIMIT 300`);
}

export function getMediaByKey(storageKey: string): MediaItem | null {
  return one<MediaItem>(`SELECT * FROM media WHERE storage_key = ?`, [storageKey]) ?? null;
}

export function insertMedia(item: MediaItem): void {
  run(
    `INSERT INTO media (id, storage_key, original_name, filename, url, mime, size, width, height, alt, folder, created_at)
     VALUES (@id, @storage_key, @original_name, @filename, @url, @mime, @size, @width, @height, @alt, @folder, @created_at)`,
    item as unknown as Record<string, unknown>,
  );
}

export function updateMedia(
  id: string,
  patch: { alt?: string; original_name?: string; folder?: string },
): void {
  const fields: string[] = [];
  const params: Record<string, unknown> = { id };
  if (patch.alt !== undefined) {
    fields.push("alt = @alt");
    params.alt = patch.alt;
  }
  if (patch.original_name !== undefined) {
    fields.push("original_name = @original_name");
    params.original_name = patch.original_name;
  }
  if (patch.folder !== undefined) {
    fields.push("folder = @folder");
    params.folder = patch.folder;
  }
  if (!fields.length) return;
  run(`UPDATE media SET ${fields.join(", ")} WHERE id = @id`, params);
}

export function deleteMediaRow(id: string): void {
  run(`DELETE FROM media WHERE id = ?`, [id]);
}

/* ── Settings ──────────────────────────────────────────────────────────────── */

export function readSettings(): Record<string, string> {
  const rows = all<{ key: string; value: string }>(
    `SELECT key, value FROM settings`,
  );
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function writeSettings(values: Record<string, string>): void {
  const now = new Date().toISOString();
  transaction(() => {
    for (const [key, value] of Object.entries(values)) {
      run(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        [key, value, now],
      );
    }
  });
}

/* ── Users / auth ──────────────────────────────────────────────────────────── */

export interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: string;
  created_at: string;
}

export function findUserByEmail(email: string): UserRow | null {
  return (
    one<UserRow>(`SELECT * FROM users WHERE email = ?`, [
      email.trim().toLowerCase(),
    ]) ?? null
  );
}

export function findUserById(id: string): UserRow | null {
  return one<UserRow>(`SELECT * FROM users WHERE id = ?`, [id]) ?? null;
}

export function updateUserPassword(id: string, passwordHash: string): void {
  run(`UPDATE users SET password_hash = ? WHERE id = ?`, [passwordHash, id]);
}
