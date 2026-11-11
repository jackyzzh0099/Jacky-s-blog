/**
 * Seeds the database from the markdown files in `content/seed`.
 * Idempotent: existing posts/projects are updated in place by slug.
 * `npm run db:seed`
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { getDb, run, one, transaction } from "../src/lib/db/client";
import { SCHEMA_SQL } from "../src/lib/db/schema";
import { hashPassword } from "../src/lib/password";
import { parsePostFile, parseProjectFile } from "../src/lib/content/parse";
import { estimateReadingTime, slugify } from "../src/lib/utils";

const db = getDb();
db.exec(SCHEMA_SQL);

/**
 * `--if-empty` makes seeding safe to run on every boot: it only populates a
 * database that has no posts yet, so editorial changes survive restarts.
 */
if (process.argv.includes("--if-empty")) {
  const existing = one<{ n: number }>(`SELECT COUNT(*) AS n FROM posts`);
  if ((existing?.n ?? 0) > 0) {
    console.log(`· database already holds ${existing?.n} posts — skipping seed`);
    process.exit(0);
  }
}

const now = new Date().toISOString();
const seedRoot = path.join(process.cwd(), "content", "seed");

/* ── Categories ────────────────────────────────────────────────────────────── */

const CATEGORIES = [
  {
    name: "Computer Science",
    description: "Algorithms, operating systems and the machinery under the abstractions.",
    accent: "#7E8EFF",
  },
  {
    name: "Software Engineering",
    description: "Practice, tooling and the craft of shipping software that lasts.",
    accent: "#5FD3E8",
  },
  {
    name: "Cybersecurity",
    description: "Systems security, threat models and the adversarial view.",
    accent: "#E88BA0",
  },
  {
    name: "AI & Machine Learning",
    description: "Models, mathematics and what they actually learn.",
    accent: "#A98BFF",
  },
  {
    name: "Embedded Systems",
    description: "Bare metal, firmware and the hardware-software boundary.",
    accent: "#6FCF97",
  },
  {
    name: "Photography",
    description: "Light, optics and the discipline of seeing.",
    accent: "#E2B06A",
  },
  {
    name: "Projects",
    description: "Field notes from things currently being built.",
    accent: "#7E8EFF",
  },
  {
    name: "Thoughts",
    description: "Essays, methodology and positions still being argued.",
    accent: "#8A8F98",
  },
];

function ensureCategory(name: string): string {
  const known = CATEGORIES.find((c) => c.name === name);
  const slug = slugify(name);
  const existing = one<{ id: string }>(`SELECT id FROM categories WHERE slug = ?`, [slug]);
  if (existing) return existing.id;

  const id = crypto.randomUUID();
  run(
    `INSERT INTO categories (id, slug, name, description, accent, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, slug, name, known?.description ?? "", known?.accent ?? "#8A8F98", known ? CATEGORIES.indexOf(known) : 99],
  );
  return id;
}

function ensureTag(name: string): string {
  const slug = slugify(name);
  const existing = one<{ id: string }>(`SELECT id FROM tags WHERE slug = ?`, [slug]);
  if (existing) return existing.id;
  const id = crypto.randomUUID();
  run(`INSERT INTO tags (id, slug, name) VALUES (?, ?, ?)`, [id, slug, name]);
  return id;
}

transaction(() => {
  CATEGORIES.forEach((category, index) => {
    const slug = slugify(category.name);
    run(
      `INSERT INTO categories (id, slug, name, description, accent, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET
         name = excluded.name,
         description = excluded.description,
         accent = excluded.accent,
         sort_order = excluded.sort_order`,
      [crypto.randomUUID(), slug, category.name, category.description, category.accent, index],
    );
  });
});

/* ── Admin user ────────────────────────────────────────────────────────────── */

const adminEmail = (process.env.ADMIN_EMAIL ?? "jacky@localhost").toLowerCase();
const adminName = process.env.ADMIN_NAME ?? "Jacky";
const adminPassword = process.env.ADMIN_PASSWORD ?? "jacky-blog-admin";

const existingAdmin = one<{ id: string }>(`SELECT id FROM users WHERE email = ?`, [
  adminEmail,
]);

if (!existingAdmin) {
  run(
    `INSERT INTO users (id, email, name, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, 'owner', ?)`,
    [crypto.randomUUID(), adminEmail, adminName, hashPassword(adminPassword), now],
  );
  console.log(`✓ admin created → ${adminEmail}`);
} else {
  console.log(`· admin exists → ${adminEmail}`);
}

/* ── Posts ─────────────────────────────────────────────────────────────────── */

const postFiles = fs
  .readdirSync(seedRoot)
  .filter((f) => f.endsWith(".md"));

let insertedPosts = 0;
let updatedPosts = 0;
let postFailures = 0;

for (const file of postFiles) {
  const raw = fs.readFileSync(path.join(seedRoot, file), "utf8");
  const result = parsePostFile(file, raw);

  if (!result.ok) {
    console.error(`✗ ${file}: ${result.error}`);
    postFailures += 1;
    continue;
  }

  const post = result.post;
  const categoryId = ensureCategory(post.categoryName);
  const readingMinutes = estimateReadingTime(post.content);
  const existing = one<{ id: string }>(`SELECT id FROM posts WHERE slug = ?`, [
    post.slug,
  ]);

  const id = existing?.id ?? crypto.randomUUID();
  const status = post.draft ? "draft" : "published";

  run(
    `INSERT INTO posts (id, slug, title, description, content, cover, category_id, status,
                        featured, reading_minutes, published_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET
       title = excluded.title,
       description = excluded.description,
       content = excluded.content,
       cover = excluded.cover,
       category_id = excluded.category_id,
       status = excluded.status,
       featured = excluded.featured,
       reading_minutes = excluded.reading_minutes,
       published_at = excluded.published_at,
       updated_at = excluded.updated_at`,
    [
      id,
      post.slug,
      post.title,
      post.description,
      post.content,
      post.cover,
      categoryId,
      status,
      post.featured ? 1 : 0,
      readingMinutes,
      status === "published" ? post.date : null,
      post.date,
      post.updated,
    ],
  );

  run(`DELETE FROM post_tags WHERE post_id = ?`, [id]);
  for (const tagName of post.tags) {
    const tagId = ensureTag(tagName);
    run(`INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)`, [
      id,
      tagId,
    ]);
  }

  if (existing) updatedPosts += 1;
  else insertedPosts += 1;
}

/* ── Projects ──────────────────────────────────────────────────────────────── */

const projectRoot = path.join(seedRoot, "projects");
let projectCount = 0;

if (fs.existsSync(projectRoot)) {
  for (const file of fs.readdirSync(projectRoot).filter((f) => f.endsWith(".md"))) {
    const raw = fs.readFileSync(path.join(projectRoot, file), "utf8");
    const result = parseProjectFile(file, raw);
    if (!result.ok) {
      console.error(`✗ projects/${file}: ${result.error}`);
      continue;
    }
    const project = result.project;

    run(
      `INSERT INTO projects (id, slug, title, summary, content, cover, repo_url, demo_url,
                             stack, status, year, featured, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET
         title = excluded.title,
         summary = excluded.summary,
         content = excluded.content,
         cover = excluded.cover,
         repo_url = excluded.repo_url,
         demo_url = excluded.demo_url,
         stack = excluded.stack,
         status = excluded.status,
         year = excluded.year,
         featured = excluded.featured,
         sort_order = excluded.sort_order,
         updated_at = excluded.updated_at`,
      [
        crypto.randomUUID(),
        project.slug,
        project.title,
        project.summary,
        project.content,
        project.cover,
        project.repoUrl,
        project.demoUrl,
        JSON.stringify(project.stack),
        project.status,
        project.date.slice(0, 4),
        project.featured ? 1 : 0,
        project.order,
        project.date,
        project.date,
      ],
    );
    projectCount += 1;
  }
}

/* ── Report ────────────────────────────────────────────────────────────────── */

const totals = {
  posts: one<{ n: number }>(`SELECT COUNT(*) AS n FROM posts`)?.n ?? 0,
  published:
    one<{ n: number }>(`SELECT COUNT(*) AS n FROM posts WHERE status='published'`)?.n ?? 0,
  projects: one<{ n: number }>(`SELECT COUNT(*) AS n FROM projects`)?.n ?? 0,
  tags: one<{ n: number }>(`SELECT COUNT(*) AS n FROM tags`)?.n ?? 0,
};

console.log(
  `✓ seeded ${insertedPosts} new + ${updatedPosts} updated posts (${postFailures} failed), ${projectCount} project files`,
);
console.log(
  `  database now holds ${totals.published}/${totals.posts} published posts, ${totals.projects} projects, ${totals.tags} tags`,
);
