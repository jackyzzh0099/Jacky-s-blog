import "server-only";

import crypto from "node:crypto";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode, {
  type Options as PrettyCodeOptions,
} from "rehype-pretty-code";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { createHighlighter, type Highlighter } from "shiki";
import { unified } from "unified";

/* ── Syntax highlighting ───────────────────────────────────────────────────── */

const LANGS = [
  "bash",
  "c",
  "cpp",
  "css",
  "diff",
  "dockerfile",
  "go",
  "html",
  "ini",
  "java",
  "javascript",
  "json",
  "jsx",
  "lua",
  "makefile",
  "markdown",
  "nginx",
  "python",
  "rust",
  "sql",
  "toml",
  "tsx",
  "typescript",
  "xml",
  "yaml",
];

// Cached on globalThis so dev-mode module reloads do not spawn new instances.
const globalForShiki = globalThis as unknown as {
  __jbHighlighter?: Promise<Highlighter>;
};

function getHighlighter() {
  globalForShiki.__jbHighlighter ??= createHighlighter({
    themes: ["github-light", "github-dark"],
    langs: LANGS,
  });
  return globalForShiki.__jbHighlighter;
}

/* ── HTML allow-list ───────────────────────────────────────────────────────── *
 * Raw HTML inside Markdown is sanitised before any generated markup is added,
 * so KaTeX and Shiki output is never stripped while author HTML stays inert.
 * ─────────────────────────────────────────────────────────────────────────── */

const base = defaultSchema;

const sanitizeSchema = {
  ...base,
  tagNames: [
    ...(base.tagNames ?? []),
    "details",
    "summary",
    "figure",
    "figcaption",
    "kbd",
    "mark",
    "ins",
    "sub",
    "sup",
    "abbr",
  ],
  attributes: {
    ...base.attributes,
    "*": [
      ...((base.attributes?.["*"] as string[] | undefined) ?? []),
      "className",
      "id",
      "align",
      "title",
    ],
    a: [
      ...((base.attributes?.a as string[] | undefined) ?? []),
      "target",
      "rel",
    ],
    img: [
      ...((base.attributes?.img as string[] | undefined) ?? []),
      "width",
      "height",
      "loading",
    ],
    input: ["type", "checked", "disabled"],
    details: ["open"],
  },
};

/* ── Small local AST helpers (avoids extra dependencies) ───────────────────── */

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

function walk(node: HastNode, visit: (n: HastNode) => void) {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

/** Adds lazy loading + async decoding to author images. */
function rehypeImageHints() {
  return (tree: HastNode) => {
    walk(tree, (node) => {
      if (node.tagName === "img") {
        node.properties = {
          loading: "lazy",
          decoding: "async",
          ...node.properties,
        };
      }
    });
  };
}

function rehypeExternalLinks() {
  return (tree: HastNode) => {
    walk(tree, (node) => {
      if (node.tagName !== "a") return;
      const href = node.properties?.href;
      if (typeof href === "string" && /^https?:\/\//.test(href)) {
        node.properties = {
          ...node.properties,
          target: "_blank",
          rel: "noopener noreferrer",
        };
      }
    });
  };
}

/* ── Mermaid blocks ────────────────────────────────────────────────────────── *
 * Mermaid cannot be rendered at build/request time without a browser, so the
 * fenced blocks are lifted out of the Markdown stream and hydrated on the
 * client. Everything else is still rendered to static HTML on the server.
 * ─────────────────────────────────────────────────────────────────────────── */

const MERMAID_FENCE = /^([ \t]*)```mermaid[^\n]*\n([\s\S]*?)^\1```[ \t]*$/gm;
const MERMAID_MARKER = (index: number) => `@@JB_MERMAID_${index}@@`;

export interface MermaidBlock {
  code: string;
}

/* ── Public API ────────────────────────────────────────────────────────────── */

export interface TocItem {
  id: string;
  text: string;
  depth: number;
}

export type RenderedPart =
  | { type: "html"; html: string }
  | { type: "mermaid"; code: string };

export interface RenderedDoc {
  parts: RenderedPart[];
  html: string;
  toc: TocItem[];
  mermaidCount: number;
}

const cache = new Map<string, RenderedDoc>();
const CACHE_LIMIT = 80;

const plainHeading = (html: string) =>
  html
    .replace(/<span class="anchor-glyph"[^>]*><\/span>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();

function extractToc(html: string): TocItem[] {
  const items: TocItem[] = [];
  const headingRe = /<h([2-4])\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
  let match: RegExpExecArray | null;
  while ((match = headingRe.exec(html))) {
    const text = plainHeading(match[3]);
    if (!text) continue;
    items.push({ id: match[2], text, depth: Number(match[1]) });
  }
  return items;
}

export async function renderMarkdown(markdown: string): Promise<RenderedDoc> {
  const hash = crypto.createHash("sha1").update(markdown).digest("hex");
  const cached = cache.get(hash);
  if (cached) return cached;

  const mermaidBlocks: string[] = [];
  const withMarkers = markdown.replace(MERMAID_FENCE, (_full, _indent, code) => {
    const index = mermaidBlocks.push(String(code).trim()) - 1;
    return `\n\n${MERMAID_MARKER(index)}\n\n`;
  });

  const prettyCodeOptions: PrettyCodeOptions = {
    theme: { light: "github-light", dark: "github-dark" },
    keepBackground: false,
    defaultLang: "plaintext",
    bypassInlineCode: true,
    getHighlighter,
    onVisitLine(node) {
      if (node.children.length === 0) {
        node.children = [{ type: "text", value: " " }];
      }
    },
    onVisitHighlightedLine(node) {
      node.properties = node.properties ?? {};
      const existing = node.properties.className;
      const list = Array.isArray(existing) ? existing : [];
      node.properties.className = [...list, "highlighted"];
    },
  };

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "prepend",
      properties: {
        className: ["heading-anchor"],
        ariaHidden: "true",
        tabIndex: -1,
      },
      content: {
        type: "element",
        tagName: "span",
        properties: { className: ["anchor-glyph"] },
        children: [],
      },
    })
    .use(rehypeKatex, { strict: false, output: "html" })
    .use(rehypeImageHints)
    .use(rehypeExternalLinks)
    .use(rehypePrettyCode, prettyCodeOptions)
    .use(rehypeStringify, { allowDangerousHtml: false })
    .process(withMarkers);

  const html = String(file);

  // Split on Mermaid markers into renderable parts.
  const parts: RenderedPart[] = [];
  const markerRe = /<p>\s*@@JB_MERMAID_(\d+)@@\s*<\/p>|@@JB_MERMAID_(\d+)@@/g;

  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = markerRe.exec(html))) {
    const before = html.slice(lastIndex, m.index);
    if (before.trim()) parts.push({ type: "html", html: before });
    const idx = Number(m[1] ?? m[2] ?? 0);
    const code = mermaidBlocks[idx] ?? "";
    if (code) parts.push({ type: "mermaid", code });
    lastIndex = m.index + m[0].length;
  }
  const tail = html.slice(lastIndex);
  if (tail.trim()) parts.push({ type: "html", html: tail });

  const doc: RenderedDoc = {
    parts,
    html,
    toc: extractToc(html),
    mermaidCount: mermaidBlocks.length,
  };

  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(hash, doc);

  return doc;
}

/** Markdown → plain text, for excerpts, RSS descriptions and search. */
export function markdownToText(markdown: string): string {
  return markdown
    .replace(MERMAID_FENCE, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
