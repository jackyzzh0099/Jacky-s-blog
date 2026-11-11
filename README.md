# Jacky's Blog

A personal technical blog and digital knowledge space: editorial front end, a
working CMS, and a SQLite database behind it. Built to be read, written in, and
deployed — not a UI mockup.

```bash
npm install
cp .env.example .env        # optional, sensible defaults apply
npm run db:setup            # schema + seed content + admin account
npm run dev                 # http://localhost:3000
```

Sign in at `/admin/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` (defaults:
`jacky@localhost` / `jacky-blog-admin` — change this immediately).

---

## What is actually implemented

### Public site

| Route | What it does |
| --- | --- |
| `/` | Hero with a generated instrument dial, featured articles, fields, projects, activity log, about preview |
| `/blog` | Paginated index with category, tag and keyword filtering (state lives in the URL) |
| `/blog/[slug]` | Article with TOC, reading progress, font-size control, lightbox, code copy, share, prev/next, related posts, JSON-LD |
| `/projects` + `/projects/[slug]` | Project index and detail pages with status, stack and links |
| `/archive` | Year → month chronology of articles and project updates |
| `/about` | Personal dossier, trajectory, toolkit, colophon |
| `/search` | Full-text search with highlighted matches, grouped by type |
| `/feed.xml`, `/sitemap.xml`, `/robots.txt` | Generated from the database |

Global command palette on `⌘K` / `Ctrl+K` searches titles, descriptions, body
text, tags, categories and projects.

### Workspace (`/admin`)

- **Dashboard** — counts, latest articles, activity, storage overview.
- **Articles** — search/filter, status pills, delete with two-step confirmation.
- **Editor** — split Markdown/preview (preview is rendered by the *same* server
  pipeline as the public page), toolbar inserts, drag-and-drop image upload,
  draft autosave to `localStorage`, `.md` import with front-matter parsing, `.md`
  export, publish/unpublish, slug and metadata panel, cover picker.
- **Media** — drag-and-drop multi-upload, search, rename, alt text, copy URL,
  delete (blocked when the file is used as a cover).
- **Fields & tags** — CRUD for categories and tags with usage counts.
- **Settings** — site identity/contact (stored in DB), password change, runtime
  info, backup instructions.

### Rendering pipeline

Markdown → `remark` (GFM + math) → `rehype-raw` → **`rehype-sanitize`** →
`rehype-slug` → autolinks → KaTeX → Shiki (`rehype-pretty-code`, dual themes) →
HTML.

Sanitisation runs *before* the generated markup is added, so author HTML is
filtered while KaTeX/Shiki output survives. Mermaid blocks are lifted out of the
Markdown stream and hydrated client-side (Mermaid needs a DOM); everything else
is server-rendered.

Supported: H1–H6, paragraphs, blockquotes, ordered/unordered/nested lists,
bold/italic/strikethrough, links, images, tables, inline code, fenced code with
language detection, KaTeX (`$…$`, `$$…$$`), Mermaid, task lists, `<details>`,
and sanitised raw HTML.

---

## Stack

- **Next.js 15** (App Router, Server Actions, Route Handlers) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS 3.4** with a CSS-variable design token layer (dark + light)
- **SQLite** (`better-sqlite3`, WAL) — no ORM, typed query layer in `src/lib/db/queries.ts`
- **unified / remark / rehype**, **Shiki**, **KaTeX**, **Mermaid**
- **scrypt** password hashing + opaque DB-backed sessions (no auth dependency)
- Zero client-side state libraries; no analytics, no third-party scripts

## Project structure

```
src/
  app/
    (public)            page.tsx · blog · projects · archive · about · search · not-found
    admin/
      login/            unauthenticated entry
      (workspace)/      authenticated shell: dashboard, posts, projects, media, taxonomy, settings
    api/search          JSON search for the command palette
    api/media/[...path] storage adapter over HTTP with locked-down headers
    sitemap.xml, robots.txt, feed.xml   route handlers
  components/
    site/               header, footer, mark-as, palette, reveal, shared headings
    blog/               cards, filters, pagination, TOC, progress, article content
    admin/              shell, editor, media library/picker, forms
  lib/
    actions/            server actions (auth, posts, projects, media, taxonomy, settings)
    db/                 client, schema, types, typed queries
    markdown.ts         unified pipeline + TOC + Mermaid extraction
    storage.ts          upload validation, SVG sanitisation, dimension parsing
    auth.ts             sessions, scrypt, rate limiting
content/seed/           seed articles and project notes (Markdown + YAML front matter)
scripts/                db + cover generation + QA harness
storage/                SQLite database and uploads (gitignored)
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run db:setup` | Create schema + seed content + admin user |
| `npm run db:init` | Create schema only |
| `npm run db:seed` | Re-import `content/seed` (idempotent, upserts by slug) |
| `npm run db:reset` | Drop the database file and re-seed from scratch |
| `npm run typecheck` | `tsc --noEmit` |
| `npx tsx scripts/generate-covers.ts` | Regenerate the SVG cover artwork |
| `node scripts/qa.mjs flow` | Browser-driven end-to-end check (needs dev server + Chrome) |

## Environment

See `.env.example`. Only these are read at runtime:

| Variable | Default | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Canonical URLs, OG, sitemap, RSS |
| `DATABASE_PATH` | `./storage/jacky.db` | Created automatically |
| `STORAGE_DIR` | `./storage/uploads` | Local upload root |
| `MAX_UPLOAD_MB` | `8` | Per-file limit |
| `MEDIA_PUBLIC_BASE_URL` | _(empty)_ | Set to a CDN/S3 prefix when media is served elsewhere |
| `ADMIN_EMAIL` / `ADMIN_NAME` / `ADMIN_PASSWORD` | see `.env.example` | Only consumed by `db:setup` |

## Security model

- Every mutation runs in a Server Action that calls `assertUser()` — hiding the
  admin UI is never the control.
- Sessions: 256-bit random token in an `HttpOnly`, `SameSite=Lax` cookie, stored
  as a SHA-256 hash with an expiry; validated against SQLite on every request.
- Login throttling: 8 failures per IP per 10 minutes (in-memory, per process).
- Uploads: magic-byte sniffing, declared/actual MIME cross-check, size cap,
  randomised filenames, path-traversal guards, SVG sanitisation, `nosniff`, and
  a `default-src 'none'` CSP on the media route.
- Markdown: HTML allow-list before rendering; no `dangerouslySetInnerHTML` on
  unsanitised input anywhere.
- Deliberate gap: images are not re-encoded through libvips. Safety relies on
  MIME sniffing plus response headers — see `content/seed/threat-modelling-a-personal-site.md`.

## Deployment

The app is a standard Node server (no serverless-only APIs). Two supported paths:

**Node / VPS**

```bash
npm ci
npm run build
npm run db:setup        # first deploy only
npm start               # PORT=3000 by default
```

Put `storage/` on a persistent volume and back it up as a single unit (the
database without its uploads is a broken site):

```bash
tar -czf jacky-backup-$(date +%F).tgz storage/
```

**Docker**

```bash
docker compose up -d --build
```

`docker-compose.yml` mounts `./storage` so the database and media survive
container restarts, and seeds on first boot if the database is missing.

**Vercel / serverless**: the front end deploys, but SQLite and local disk do
not. You would need to move both behind managed services (Postgres/Turso plus
S3-compatible storage). `src/lib/storage.ts` is written as an adapter precisely
so that swap is a single file, and the query layer is isolated in
`src/lib/db/queries.ts`.

## Writing

See [`docs/CONTENT.md`](docs/CONTENT.md) for front matter, the import workflow,
media conventions and a checklist before publishing.

## Known limitations

- Search is `LIKE`-based over SQLite. Fast for thousands of posts, not a
  relevance engine; it is isolated in `searchEverything()` if you want FTS5.
- The edge middleware only checks that a session cookie exists; the real
  validation is server-side against SQLite (documented in `src/middleware.ts`).
- Uploads are validated but not re-encoded (no image processing dependency).
- Single-author by design: the `users` table supports more, the UI does not.
