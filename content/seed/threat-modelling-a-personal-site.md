---
title: "Threat modelling a personal site"
description: "The attack surface of a blog with a CMS is larger than it looks. A concrete model for the site you are reading, including the parts I chose not to defend."
date: "2026-07-30"
updated: "2026-08-04"
category: "Cybersecurity"
tags:
  - AppSec
  - Threat Modeling
  - XSS
  - File Upload
cover: "/covers/threat.svg"
draft: false
featured: false
---

A blog is a database, an upload endpoint, an authentication system and a rendering engine that accepts author-controlled markup. Three of those four are attack surface, and the fourth is a parser. Saying "it's just a blog" is a way of not doing the work.

This is the model I actually used for this site, written down so future-me can check whether the assumptions still hold.

## The four questions

1. What am I building? A statically-bounded content site with a single authenticated editor.
2. What can go wrong? The list below.
3. What am I going to do about it? Controls, also below.
4. Did I do a good enough job? Explicitly stated residual risks, not a vague "it's secure".

## Assets and actors

| Asset | Why it matters | Worst case |
| --- | --- | --- |
| Admin session | Full write access to all content | Defacement, malware distribution under my name |
| Uploaded media | Served from my origin | Stored XSS, phishing assets on a trusted domain |
| Database | Contains drafts and credentials hashes | Data loss, account takeover |
| Reader browsers | Execute my HTML | Supply-chain attack on my audience |

The realistic adversary is not a nation state. It is an automated scanner plus someone who reads my source code on GitHub — which is public, so the attacker knows the exact upload path, the exact markdown pipeline and the exact framework version.

## Threat table

| # | Threat | Vector | Control |
| --- | --- | --- | --- |
| 1 | Stored XSS via article body | Raw HTML in markdown | `rehype-raw` → `rehype-sanitize` allow-list before rendering |
| 2 | Stored XSS via SVG upload | `<script>` inside SVG | Tag/attribute stripping + reject-on-active-content + `nosniff` + CSP on the media route |
| 3 | Malicious upload | Polyglot file, wrong MIME | Magic-byte sniffing, declared-type cross-check, size cap, randomised filename |
| 4 | Path traversal | Crafted `storageKey` | `path.resolve` + prefix assertion against the storage root |
| 5 | Auth bypass | Forged cookie | Opaque 256-bit token, SHA-256 hashed at rest, server-side lookup per request |
| 6 | Credential stuffing | Login form | scrypt hashing, per-IP attempt window, constant-time compare, no user enumeration |
| 7 | CSRF | Cross-site form post | SameSite=Lax cookies + server actions only (no cookie-authenticated GET mutations) |
| 8 | SSRF via image import | URL-based fetch | Not implemented. Deliberately. |
| 9 | Dependency compromise | npm supply chain | Pinned versions, no postinstall scripts from unknown packages, `npm audit` in CI |

## Why the sanitiser runs before the highlighter

Order matters, and getting it wrong is a subtle hole. The pipeline is:

```ts
unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)                  // author HTML becomes real nodes
  .use(rehypeSanitize, schema)     // ...and is filtered here
  .use(rehypeKatex)                // generated markup is trusted
  .use(rehypePrettyCode)           // generated markup is trusted
  .use(rehypeStringify);
```

Sanitising *after* the highlighter would strip the `style` attributes Shiki emits and mangle KaTeX's output. Sanitising *before* means the allow-list only ever sees author content — which is the only untrusted part. Both properties matter: one for security, one for the site not looking broken.

## The one I deliberately did not solve

**Server-side image processing.** Re-encoding every upload through libvips would kill most image-based attacks (polyglots, decompression bombs, EXIF payloads) at the cost of a native dependency and a much larger deployment footprint. I chose magic-byte validation plus a strict MIME allow-list instead.

That is a real gap. A hand-crafted PNG that is also valid JavaScript will pass my checks — it just will not execute, because the response carries `Content-Type: image/png` and `X-Content-Type-Options: nosniff`. The control is at the response layer, not the file layer. If the site ever serves user media from a bucket I do not control, that assumption dies and the re-encoder becomes mandatory.

> A threat model without a residual-risk section is marketing.

## Operational habits

- Rotate the admin password after any shared-demo deployment; the seeded credential is documented as a change-me.
- Back up the SQLite file and the uploads directory together — a database without its media is a broken site.
- Keep the framework patched. Most real incidents are not novel; they are three versions behind.
- Log authentication failures. Eight failures in ten minutes from one address triggers a lockout window, and the log tells you whether it was a scanner or a person.

Nothing here is exotic. That is rather the point: the boring controls, applied consistently, are what separate a site that survives contact with the internet from one that makes the front page of Hacker News for the wrong reason.
