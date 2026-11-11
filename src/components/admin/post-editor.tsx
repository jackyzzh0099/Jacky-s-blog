"use client";

import {
  ArrowUpRight,
  Check,
  Eye,
  FileDown,
  ImagePlus,
  Loader2,
  Save,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { DangerButton, InlineNotice } from "./bits";
import { MediaPicker } from "./media-picker";
import { Mermaid } from "@/components/blog/mermaid";
import {
  deletePost,
  exportPostMarkdown,
  importMarkdownFile,
  previewMarkdown,
  savePost,
  togglePostStatus,
} from "@/lib/actions/posts";
import type { RenderedPart } from "@/lib/markdown";
import { cn, estimateReadingTime, slugify } from "@/lib/utils";

export interface EditorPost {
  id?: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  categoryId: string;
  tags: string[];
  cover: string;
  featured: boolean;
  status: "draft" | "published";
  publishedAt: string;
  updatedAt?: string;
}

const EMPTY: EditorPost = {
  title: "",
  slug: "",
  description: "",
  content: "",
  categoryId: "",
  tags: [],
  cover: "",
  featured: false,
  status: "draft",
  publishedAt: new Date().toISOString().slice(0, 10),
};

const TABLE_SNIPPET = `| Column | Value |\n| --- | --- |\n| Row | 1 |`;
const MERMAID_SNIPPET = "```mermaid\nflowchart LR\n  A --> B\n```";

export function PostEditor({
  initial,
  categories,
  tagSuggestions,
}: {
  initial: EditorPost | null;
  categories: { id: string; name: string }[];
  tagSuggestions: string[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<EditorPost>(initial ?? EMPTY);
  const [mode, setMode] = useState<"write" | "split" | "preview">("split");
  const [saving, startSaving] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(initial?.updatedAt ?? null);
  const [notice, setNotice] = useState<{
    tone: "neutral" | "success" | "error";
    message: string;
  } | null>(null);
  const [preview, setPreview] = useState<{ parts: RenderedPart[] } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [picker, setPicker] = useState<"cover" | "insert" | null>(null);
  const [importing, setImporting] = useState(false);
  const [restorable, setRestorable] = useState<{ at: string; data: EditorPost } | null>(
    null,
  );
  const [dirty, setDirty] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const storageKey = `jb-draft-${initial?.id ?? "new"}`;

  const set = useCallback(<K extends keyof EditorPost>(key: K, value: EditorPost[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setNotice(null);
  }, []);

  /* ── local autosave ─────────────────────────────────────────────────── */

  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({ at: new Date().toISOString(), data: form }),
        );
      } catch {
        /* storage may be full or blocked */
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [form, dirty, storageKey]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { at: string; data: EditorPost };
      if (!parsed?.data?.content) return;
      const newer = !initial?.updatedAt || parsed.at > initial.updatedAt;
      if (newer && JSON.stringify(parsed.data) !== JSON.stringify(initial ?? EMPTY)) {
        setRestorable(parsed);
      }
    } catch {
      /* ignore malformed drafts */
    }
  }, [initial, storageKey]);

  /* ── live preview (server-rendered for fidelity) ─────────────────────── */

  useEffect(() => {
    if (mode === "write") return;
    let cancelled = false;
    setPreviewing(true);
    const timer = window.setTimeout(async () => {
      const result = await previewMarkdown(form.content);
      if (cancelled) return;
      if (result.ok && result.parts) setPreview({ parts: result.parts });
      else setPreview(null);
      setPreviewing(false);
    }, 550);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.content, mode]);

  /* ── editor primitives ──────────────────────────────────────────────── */

  const applyWrap = useCallback(
    (before: string, after: string, placeholder = "text") => {
      const area = textareaRef.current;
      if (!area) return;
      const start = area.selectionStart;
      const end = area.selectionEnd;
      const value = area.value;
      const selected = value.slice(start, end) || placeholder;
      const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
      set("content", next);
      requestAnimationFrame(() => {
        area.focus();
        area.setSelectionRange(start + before.length, start + before.length + selected.length);
      });
    },
    [set],
  );

  const applyBlock = useCallback(
    (prefix: string) => {
      const area = textareaRef.current;
      if (!area) return;
      const start = area.selectionStart;
      const value = area.value;
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const next = `${value.slice(0, lineStart)}${prefix}${value.slice(lineStart)}`;
      set("content", next);
      requestAnimationFrame(() => {
        area.focus();
        area.setSelectionRange(start + prefix.length, start + prefix.length);
      });
    },
    [set],
  );

  const insertSnippet = useCallback(
    (snippet: string, block = true) => {
      const area = textareaRef.current;
      if (!area) return;
      const start = area.selectionStart;
      const end = area.selectionEnd;
      const value = area.value;
      const needsLeading = block && start > 0 && value[start - 1] !== "\n" ? "\n\n" : "";
      const needsTrailing = block ? "\n\n" : "";
      const next = `${value.slice(0, start)}${needsLeading}${snippet}${needsTrailing}${value.slice(end)}`;
      set("content", next);
      requestAnimationFrame(() => {
        area.focus();
        const caret = start + needsLeading.length + snippet.length;
        area.setSelectionRange(caret, caret);
      });
    },
    [set],
  );

  /* ── persistence ────────────────────────────────────────────────────── */

  const persist = useCallback(
    (status: "draft" | "published") => {
      if (!form.title.trim()) {
        setNotice({ tone: "error", message: "A title is required before saving." });
        return;
      }
      startSaving(async () => {
        const result = await savePost({
          id: form.id,
          title: form.title,
          slug: form.slug || slugify(form.title),
          description: form.description,
          content: form.content,
          categoryId: form.categoryId || null,
          tags: form.tags,
          cover: form.cover || null,
          featured: form.featured,
          status,
          publishedAt: form.publishedAt ? `${form.publishedAt}T12:00:00.000Z` : null,
        });

        if (!result.ok) {
          setNotice({ tone: "error", message: result.error });
          return;
        }

        setForm((prev) => ({
          ...prev,
          id: result.id,
          slug: result.slug,
          status,
          updatedAt: result.updatedAt,
        }));
        setSavedAt(result.updatedAt);
        setDirty(false);
        try {
          window.localStorage.removeItem(storageKey);
        } catch {
          /* ignore */
        }
        setNotice({
          tone: "success",
          message:
            status === "published"
              ? "Published. The public pages are revalidated."
              : "Draft saved.",
        });

        if (!form.id) router.replace(`/admin/posts/${result.id}`);
        router.refresh();
      });
    },
    [form, router, storageKey],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        persist(form.status === "published" ? "published" : "draft");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [persist, form.status]);

  /* ── import / export ────────────────────────────────────────────────── */

  async function onImport(file: File) {
    setImporting(true);
    try {
      const text = await file.text();
      const result = await importMarkdownFile(file.name, text);
      if (!result.ok) {
        setNotice({ tone: "error", message: result.error });
        return;
      }
      const draft = result.draft;
      setForm({
        id: form.id,
        title: draft.title,
        slug: draft.slug,
        description: draft.description,
        content: draft.content,
        categoryId: draft.categoryId ?? "",
        tags: draft.tags,
        cover: draft.cover ?? "",
        featured: draft.featured,
        status: draft.status,
        publishedAt: draft.publishedAt.slice(0, 10),
      });
      setDirty(true);
      setNotice({
        tone: "neutral",
        message: draft.categoryId
          ? `Imported “${file.name}”. Front matter parsed — review, then save.`
          : `Imported “${file.name}”. Field “${draft.categoryName}” was not found, pick one manually.`,
      });
    } catch {
      setNotice({ tone: "error", message: "Could not read that file." });
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = "";
    }
  }

  async function download() {
    if (!form.id) {
      setNotice({ tone: "error", message: "Save the article before exporting." });
      return;
    }
    const result = await exportPostMarkdown(form.id);
    if (!result.ok || !result.markdown) {
      setNotice({ tone: "error", message: result.error ?? "Could not export." });
      return;
    }
    const blob = new Blob([result.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.fileName ?? "article.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const words = useMemo(
    () => form.content.split(/\s+/).filter(Boolean).length,
    [form.content],
  );
  const reading = useMemo(() => estimateReadingTime(form.content), [form.content]);
  const dirtySinceSave = dirty && !saving;

  return (
    <div>
      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/[0.08] pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/admin/posts"
            className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint transition-colors hover:text-fg"
          >
            ← Articles
          </Link>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
            /
          </span>
          <span className="truncate font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
            {form.id ? "Edit" : "New"}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[2px] border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]",
              form.status === "published"
                ? "border-accent/30 bg-accent/[0.07] text-accent"
                : "border-signal/30 bg-signal/[0.06] text-signal",
            )}
          >
            {form.status}
          </span>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.12em] text-faint sm:inline">
            {saving
              ? "saving…"
              : dirtySinceSave
                ? "unsaved changes"
                : savedAt
                  ? "saved"
                  : "not saved"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={importRef}
            type="file"
            accept=".md,.markdown,text/markdown"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onImport(file);
            }}
          />
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            className="inline-flex h-7 items-center gap-1.5 rounded-[3px] border border-line/12 px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-fg"
          >
            {importing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Upload className="h-3 w-3" />
            )}
            Import .md
          </button>

          <div className="flex items-center overflow-hidden rounded-[3px] border border-line/12">
            {(
              [
                { key: "write", label: "Write" },
                { key: "split", label: "Split" },
                { key: "preview", label: "Preview" },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setMode(item.key)}
                className={cn(
                  "h-7 px-2 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors",
                  mode === item.key
                    ? "bg-line/[0.08] text-fg"
                    : "text-faint hover:text-fg",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {form.id && (
            <>
              <Link
                href={`/blog/${form.slug}?preview=1`}
                target="_blank"
                className="inline-flex h-7 items-center gap-1.5 rounded-[3px] border border-line/12 px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-fg"
              >
                <Eye className="h-3 w-3" />
                View
              </Link>
              <button
                type="button"
                onClick={download}
                className="inline-flex h-7 items-center gap-1.5 rounded-[3px] border border-line/12 px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-fg"
              >
                <FileDown className="h-3 w-3" />
                .md
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => persist("draft")}
            disabled={saving}
            className="inline-flex h-7 items-center gap-1.5 rounded-[3px] border border-line/12 px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-fg disabled:opacity-50"
          >
            <Save className="h-3 w-3" />
            Save draft
          </button>
          <button
            type="button"
            onClick={() => persist("published")}
            disabled={saving}
            className="inline-flex h-7 items-center gap-1.5 rounded-[3px] bg-fg px-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-bg transition-colors hover:bg-accent hover:text-white disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            {form.status === "published" ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {restorable && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-accent/25 bg-accent/[0.05] px-3 py-2">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-accent">
            Local draft from {new Date(restorable.at).toLocaleString()} found
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setForm({ ...restorable.data, id: form.id });
                setRestorable(null);
                setDirty(true);
              }}
              className="font-mono text-[9px] uppercase tracking-[0.12em] text-accent underline underline-offset-2"
            >
              Restore
            </button>
            <button
              type="button"
              onClick={() => {
                window.localStorage.removeItem(storageKey);
                setRestorable(null);
              }}
              className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint hover:text-fg"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <input
        value={form.title}
        onChange={(event) => set("title", event.target.value)}
        placeholder="Untitled article"
        aria-label="Article title"
        className="mt-6 w-full bg-transparent text-[clamp(1.7rem,3vw,2.4rem)] font-semibold leading-tight tracking-[-0.03em] text-fg outline-none placeholder:text-faint/50"
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* editor / preview */}
        <div className="min-w-0 overflow-hidden rounded-sm border border-line/[0.09]">
          <div className="flex flex-wrap items-center gap-0.5 border-b border-line/[0.07] px-2 py-1.5">
            {[
              { label: "H2", run: () => applyBlock("## ") },
              { label: "H3", run: () => applyBlock("### ") },
              { label: "B", run: () => applyWrap("**", "**", "bold") },
              { label: "I", run: () => applyWrap("*", "*", "italic") },
              { label: "code", run: () => applyWrap("`", "`", "code") },
              { label: "link", run: () => applyWrap("[", "](https://)", "label") },
              { label: "quote", run: () => applyBlock("> ") },
              { label: "list", run: () => applyBlock("- ") },
              { label: "num", run: () => applyBlock("1. ") },
              { label: "table", run: () => insertSnippet(TABLE_SNIPPET) },
              { label: "math", run: () => insertSnippet("$$\n\n$$") },
              { label: "mermaid", run: () => insertSnippet(MERMAID_SNIPPET) },
              { label: "```", run: () => insertSnippet("```ts\n\n```") },
            ].map((tool) => (
              <button
                key={tool.label}
                type="button"
                onClick={tool.run}
                className="rounded-[2px] px-1.5 py-1 font-mono text-[9.5px] text-faint transition-colors hover:bg-line/[0.06] hover:text-fg"
              >
                {tool.label}
              </button>
            ))}
            <span className="mx-1 h-3 w-px bg-line/12" />
            <button
              type="button"
              onClick={() => setPicker("insert")}
              className="inline-flex items-center gap-1 rounded-[2px] px-1.5 py-1 font-mono text-[9.5px] text-faint transition-colors hover:bg-line/[0.06] hover:text-fg"
            >
              <ImagePlus className="h-3 w-3" />
              image
            </button>
          </div>

          <div
            className={cn(
              "grid max-h-[72vh] min-h-[52vh]",
              mode === "split" && "md:grid-cols-2 md:divide-x md:divide-line/[0.07]",
            )}
          >
            {mode !== "preview" && (
              <textarea
                ref={textareaRef}
                value={form.content}
                onChange={(event) => set("content", event.target.value)}
                placeholder={
                  "Write in Markdown…\n\n## A heading\n\nParagraph, `inline code`, $math$ and ```mermaid blocks all render exactly as they will on the site."
                }
                spellCheck
                className="md-editor min-h-[52vh]"
                onDrop={async (event) => {
                  const file = event.dataTransfer.files?.[0];
                  if (!file || !file.type.startsWith("image/")) return;
                  event.preventDefault();
                  const formData = new FormData();
                  formData.append("files", file);
                  const { uploadMedia } = await import("@/lib/actions/media");
                  const result = await uploadMedia(formData);
                  const item = result.items[0];
                  if (item) {
                    insertSnippet(`![${item.alt || item.original_name}](${item.url})`);
                  }
                }}
              />
            )}

            {mode !== "write" && (
              <div className="max-h-[72vh] overflow-y-auto px-5 py-4">
                {previewing && !preview && (
                  <div className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Rendering
                  </div>
                )}
                {preview ? (
                  <div className="prose-jb text-[13.5px]">
                    {preview.parts.map((part, index) =>
                      part.type === "html" ? (
                        <div
                          key={index}
                          dangerouslySetInnerHTML={{ __html: part.html ?? "" }}
                        />
                      ) : (
                        <Mermaid key={`m-${index}`} code={part.code ?? ""} />
                      ),
                    )}
                  </div>
                ) : (
                  !previewing && (
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
                      Nothing to preview yet
                    </p>
                  )
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-line/[0.07] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
            <span>{words} words · {reading} min</span>
            <span>{form.content.length} chars</span>
          </div>
        </div>

        {/* metadata */}
        <div className="self-start xl:sticky xl:top-20">
          <div className="rounded-sm border border-line/[0.09] p-4">
            <p className="label mb-4">Metadata</p>

            <label className="mb-3 block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                Slug
              </span>
              <div className="flex items-center gap-1 border border-line/10 bg-elev/60 px-2">
                <span className="font-mono text-[10px] text-faint">/blog/</span>
                <input
                  value={form.slug}
                  onChange={(event) => set("slug", event.target.value)}
                  placeholder={slugify(form.title) || "auto"}
                  className="h-8 w-full bg-transparent font-mono text-[11px] text-fg outline-none placeholder:text-faint"
                />
              </div>
            </label>

            <label className="mb-3 block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                Description
              </span>
              <textarea
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                rows={3}
                placeholder="One or two sentences used in listings, search and social cards."
                className="field resize-none text-[12px]"
              />
            </label>

            <label className="mb-3 block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                Field
              </span>
              <select
                value={form.categoryId}
                onChange={(event) => set("categoryId", event.target.value)}
                className="field h-8 text-[12px]"
              >
                <option value="">Uncategorised</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="mb-3 block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                Tags
              </span>
              <input
                value={form.tags.join(", ")}
                onChange={(event) =>
                  set(
                    "tags",
                    event.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="Rust, Linux, Performance"
                className="field h-8 text-[12px]"
                list="tag-suggestions"
              />
              <datalist id="tag-suggestions">
                {tagSuggestions.map((tag) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
            </label>

            <div className="mb-3">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                Cover
              </span>
              <div className="flex items-center gap-2">
                <div className="h-10 w-16 shrink-0 overflow-hidden rounded-[2px] border border-line/10 bg-elev">
                  {form.cover && (
                    <img
                      src={form.cover}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <input
                  value={form.cover}
                  onChange={(event) => set("cover", event.target.value)}
                  placeholder="/covers/memory.svg"
                  className="field h-8 min-w-0 flex-1 text-[11px]"
                />
              </div>
              <button
                type="button"
                onClick={() => setPicker("cover")}
                className="mt-2 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-faint transition-colors hover:text-fg"
              >
                <ImagePlus className="h-3 w-3" />
                Pick from library
              </button>
            </div>

            <label className="mb-3 block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                Publish date
              </span>
              <input
                type="date"
                value={form.publishedAt}
                onChange={(event) => set("publishedAt", event.target.value)}
                className="field h-8 text-[12px]"
              />
            </label>

            <label className="flex items-center justify-between border-t border-line/[0.07] pt-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                Feature on home
              </span>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => set("featured", event.target.checked)}
                className="h-3.5 w-3.5 accent-[rgb(var(--accent))]"
              />
            </label>
          </div>

          <div className="mt-3 space-y-2">
            {notice && <InlineNotice tone={notice.tone}>{notice.message}</InlineNotice>}
            {form.id && (
              <div className="flex items-center justify-between gap-2 border border-line/[0.09] px-3 py-2">
                <DangerButton
                  action={async () => {
                    const result = await deletePost(form.id as string);
                    if (result.ok) router.replace("/admin/posts");
                    return result;
                  }}
                />
                <button
                  type="button"
                  onClick={async () => {
                    const result = await togglePostStatus(form.id as string);
                    if (!result.ok) {
                      setNotice({ tone: "error", message: result.error ?? "Failed." });
                      return;
                    }
                    setForm((prev) => ({ ...prev, status: result.status ?? "draft" }));
                    setNotice({
                      tone: "neutral",
                      message:
                        result.status === "published"
                          ? "Published."
                          : "Moved back to drafts.",
                    });
                    router.refresh();
                  }}
                  className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint transition-colors hover:text-fg"
                >
                  {form.status === "published" ? "Unpublish" : "Publish"}
                </button>
              </div>
            )}
            <Link
              href={form.slug ? `/blog/${form.slug}` : "/admin/posts"}
              target={form.slug ? "_blank" : undefined}
              className="flex items-center justify-between border border-line/[0.09] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-faint transition-colors hover:text-fg"
            >
              Preview URL
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <MediaPicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        onSelect={(item) => {
          if (picker === "cover") set("cover", item.url);
          else insertSnippet(`![${item.alt || item.original_name}](${item.url})`, false);
        }}
      />
    </div>
  );
}
