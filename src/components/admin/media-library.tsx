"use client";

import {
  Check,
  Copy,
  Loader2,
  Pencil,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";

import { InlineNotice } from "./bits";
import { deleteMediaItem, updateMediaMeta, uploadMedia } from "@/lib/actions/media";
import type { MediaItem } from "@/lib/db/types";
import { cn, formatBytes } from "@/lib/utils";

export function MediaLibrary({ initialItems }: { initialItems: MediaItem[] }) {
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", alt: "" });
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      `${item.original_name} ${item.filename} ${item.alt} ${item.folder}`
        .toLowerCase()
        .includes(term),
    );
  }, [items, query]);

  const totalBytes = items.reduce((sum, item) => sum + item.size, 0);

  async function handleFiles(files: FileList | File[] | null) {
    if (!files) return;
    const list = Array.from(files);
    if (list.length === 0) return;

    setUploading(true);
    setErrors([]);
    const formData = new FormData();
    list.forEach((file) => formData.append("files", file));

    const result = await uploadMedia(formData);
    if (result.items.length > 0) setItems((prev) => [...result.items, ...prev]);
    if (result.errors.length > 0) setErrors(result.errors);
    setUploading(false);
  }

  async function copy(item: MediaItem) {
    const absolute = `${window.location.origin}${item.url}`;
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(item.id);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setErrors(["Clipboard access was blocked by the browser."]);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Library</p>
          <h1 className="mt-2.5 text-[24px] font-semibold tracking-tight text-fg">
            Media
          </h1>
          <p className="mt-1.5 text-[12.5px] text-muted">
            {items.length} files · {(totalBytes / 1024 / 1024).toFixed(1)} MB ·
            served from the local storage adapter
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="btn btn-primary h-8 text-[11.5px]"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          Upload files
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "mt-6 flex flex-col items-center justify-center rounded-sm border border-dashed px-6 py-10 transition-colors",
          dragging
            ? "border-accent/60 bg-accent/[0.05]"
            : "border-line/15 bg-elev/20",
        )}
      >
        <Upload className="h-4 w-4 text-faint" />
        <p className="mt-3 text-[12.5px] text-fg">
          Drop images here, or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-accent underline underline-offset-2"
          >
            browse
          </button>
        </p>
        <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
          PNG · JPEG · WEBP · GIF · SVG — up to 8 MB each · MIME is sniffed, SVG is
          sanitised
        </p>
      </div>

      {errors.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {errors.map((error) => (
            <InlineNotice key={error} tone="error">
              {error}
            </InlineNotice>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-4">
        <label className="relative flex items-center">
          <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-faint" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, alt text or folder…"
            className="h-8 w-[300px] rounded-[3px] border border-line/10 bg-transparent pl-8 pr-2 text-[12px] text-fg outline-none transition-colors placeholder:text-faint focus:border-accent/40"
          />
        </label>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
          {filtered.length} shown
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-sm border border-dashed border-line/15 py-16 text-center">
          <p className="text-[13px] text-fg">
            {items.length === 0 ? "The library is empty" : "No files match that search"}
          </p>
          <p className="mt-1.5 text-[11.5px] text-muted">
            {items.length === 0
              ? "Upload your first image to use it in an article."
              : "Try a shorter term."}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group overflow-hidden rounded-sm border border-line/[0.09] bg-card"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-elev">
                <img
                  src={item.url}
                  alt={item.alt || item.original_name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => copy(item)}
                    className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-black/50 text-white/80 hover:text-white"
                    aria-label="Copy URL"
                    title="Copy URL"
                  >
                    {copied === item.id ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(item.id);
                      setDraft({ name: item.original_name, alt: item.alt });
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-black/50 text-white/80 hover:text-white"
                    aria-label="Edit details"
                    title="Edit details"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      startTransition(async () => {
                        const result = await deleteMediaItem(item.id);
                        if (result.ok) {
                          setItems((prev) => prev.filter((x) => x.id !== item.id));
                        } else {
                          setErrors([result.error ?? "Could not delete."]);
                        }
                      });
                    }}
                    disabled={busy}
                    className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-black/50 text-white/80 hover:text-[#E88BA0]"
                    aria-label="Delete"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="px-2 py-2">
                {editing === item.id ? (
                  <div className="space-y-1.5">
                    <input
                      value={draft.name}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, name: event.target.value }))
                      }
                      className="field h-7 text-[11px]"
                      aria-label="File name"
                    />
                    <input
                      value={draft.alt}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, alt: event.target.value }))
                      }
                      placeholder="Alt text"
                      className="field h-7 text-[11px]"
                      aria-label="Alt text"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          startTransition(async () => {
                            const result = await updateMediaMeta({
                              id: item.id,
                              original_name: draft.name,
                              alt: draft.alt,
                            });
                            if (result.ok) {
                              setItems((prev) =>
                                prev.map((x) =>
                                  x.id === item.id
                                    ? { ...x, original_name: draft.name, alt: draft.alt }
                                    : x,
                                ),
                              );
                              setEditing(null);
                            } else {
                              setErrors([result.error ?? "Could not save."]);
                            }
                          })
                        }
                        className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(null)}
                        className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="truncate text-[11.5px] text-fg/90">
                      {item.original_name}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-[0.06em] text-faint">
                      {item.width && item.height
                        ? `${item.width}×${item.height}`
                        : item.mime.replace("image/", "")}{" "}
                      · {formatBytes(item.size)}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
