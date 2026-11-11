# Writing & publishing

Everything on the site comes from the database. You can write in the workspace,
import a Markdown file, or seed from `content/seed`. All three paths go through
the same validation and rendering pipeline.

## 1. Where to start

```
/admin/login  →  Articles  →  New article
```

The editor is split: Markdown on the left, a live preview on the right. The
preview is produced by the **same server-side pipeline** as the published page,
so code highlighting, maths, tables and Mermaid all look exactly as they will in
production.

- `Write` — plain editor, fastest for long text
- `Split` — editor + preview side by side
- `Preview` — reading view only

`⌘S` / `Ctrl+S` saves a draft. Every keystroke is also buffered to
`localStorage`; if the tab dies, reopening the editor offers to restore it.

## 2. Front matter

Importing a `.md` file reads YAML front matter. The same keys power the editor’s
metadata panel.

```yaml
---
title: "Understanding Memory Management"
description: "A technical exploration of memory management."
date: "2026-11-11"          # publish date (UTC midday)
updated: "2026-11-11"       # optional
category: "Computer Science" # must match a field name, case-insensitive
tags:
  - C
  - Operating Systems
cover: "/covers/memory.svg"  # any URL: /covers/… or /api/media/…
draft: false
featured: true
slug: understanding-memory-management  # optional, defaults to the file name
---
```

| Key | Required | Notes |
| --- | --- | --- |
| `title` | yes | Shown in cards, `<title>`, OG |
| `description` | recommended | Falls back to the first 160 characters |
| `date` | recommended | `YYYY-MM-DD`; defaults to now |
| `updated` | no | Displays as “Updated” on the article |
| `category` | no | Unknown names are flagged in the import notice |
| `tags` | no | Created automatically if missing |
| `cover` | no | Used in cards, article header and social cards |
| `draft` | no | `true` keeps it out of every public surface |
| `featured` | no | Prioritised on the home page |
| `slug` | no | Defaults to the file name; collisions get `-2`, `-3` |

## 3. Markdown that works

- **Headings** `## – ####` produce the table of contents automatically.
- **Code** fenced blocks: language after the backticks; the block gets a header
  with the language and a copy button. `{1,3-4}` after the language highlights
  specific lines.
- **Maths**: `$inline$` and `$$display$$` via KaTeX.
- **Diagrams**: a ```` ```mermaid ```` fence renders client-side after load; the
  source stays in the Markdown, so it degrades gracefully.
- **Tables**, **task lists** (`- [x]`), **strikethrough**, `<details>` blocks.
- **Raw HTML** is allowed but sanitised against an allow-list — scripts, event
  handlers and `javascript:` URLs are stripped.

Images: drag a file into the editor and it uploads and inserts
`![alt](url)` at the cursor.

## 4. Media

`/admin/media` is the library:

- Accepts PNG, JPEG, WEBP, GIF and SVG, up to `MAX_UPLOAD_MB` (8 MB default).
- Files are stored under `storage/uploads/YYYY/MM/` with a slugged, randomised
  name; SVG uploads are sanitised before they touch disk.
- Renaming here changes the display name only — URLs stay stable, so old links
  never break.
- Deleting is blocked while the image is used as an article cover.
- Copy URL gives an absolute link you can paste anywhere.

## 5. Publishing checklist

- [ ] Title reads well in a card, not just as a page heading
- [ ] Description is a full sentence (~140–160 characters)
- [ ] Field chosen; 2–5 tags that a reader would search for
- [ ] Cover present (or deliberately omitted)
- [ ] Code blocks have a language
- [ ] Preview checked at mobile width
- [ ] Draft toggle confirmed before “Publish”
- [ ] `⌘S` saved; the toolbar shows **saved**, not **unsaved changes**

Publishing invalidates the home page, `/blog`, the article, `/archive` and
`/search` so changes are visible immediately.

## 6. Bulk import / migration

Drop files into `content/seed/` and run `npm run db:seed` — upserts by slug, safe
to repeat. Front matter follows the table above.

To export an article, open it in the editor and use the `.md` button: it writes
the same front matter plus the body, so the round trip is lossless.

## 7. Backups

The database and the uploads directory are one unit:

```bash
tar -czf jacky-backup-$(date +%F).tgz storage/
```

Restore by unpacking into the project root; no migration step is needed because
the schema is created idempotently on boot.
