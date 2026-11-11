"use client";

import { Loader2, Search, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { listMediaForPicker, uploadMedia } from "@/lib/actions/media";
import type { MediaItem } from "@/lib/db/types";
import { formatBytes, cn } from "@/lib/utils";

export function MediaPicker({
  open,
  onClose,
  onSelect,
  title = "Media library",
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  title?: string;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listMediaForPicker()
      .then(setItems)
      .catch(() => setError("Could not load the library."))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const filtered = query.trim()
    ? items.filter((item) =>
        `${item.original_name} ${item.alt}`.toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    startTransition(async () => {
      const result = await uploadMedia(formData);
      if (result.items.length > 0) setItems((prev) => [...result.items, ...prev]);
      if (result.errors.length > 0) setError(result.errors.join(" · "));
    });
  }

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[82vh] w-full max-w-[860px] flex-col overflow-hidden rounded-md border border-line/12 bg-card shadow-float">
        <div className="flex items-center justify-between border-b border-line/[0.08] px-4 py-3">
          <div className="flex items-baseline gap-3">
            <h2 className="text-[13.5px] font-medium text-fg">{title}</h2>
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
              {items.length} files
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex h-7 items-center gap-1.5 rounded-[3px] border border-line/12 px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-fg"
            >
              {pending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
              Upload
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-[3px] text-faint hover:text-fg"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          multiple
          className="hidden"
          onChange={(event) => upload(event.target.files)}
        />

        <div className="border-b border-line/[0.06] px-4 py-2.5">
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-0 h-3.5 w-3.5 text-faint" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by name…"
              className="h-7 w-full bg-transparent pl-6 text-[12px] text-fg outline-none placeholder:text-faint"
            />
          </label>
        </div>

        {error && (
          <p className="border-b border-line/[0.06] bg-[#E88BA0]/[0.06] px-4 py-2 font-mono text-[9.5px] text-[#E88BA0]">
            {error}
          </p>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-faint" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
              <p className="text-[12.5px] text-fg">Nothing here yet</p>
              <p className="text-[11px] text-muted">
                Upload a PNG, JPEG, WEBP, GIF or SVG to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className={cn(
                    "group overflow-hidden rounded-[3px] border border-line/[0.09] text-left transition-colors hover:border-accent/50",
                  )}
                >
                  <span className="block aspect-[4/3] overflow-hidden bg-elev">
                    <img
                      src={item.url}
                      alt={item.alt || item.original_name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </span>
                  <span className="block truncate px-1.5 py-1 font-mono text-[9px] text-faint">
                    {item.original_name}
                  </span>
                  <span className="block px-1.5 pb-1.5 font-mono text-[8.5px] text-faint/70">
                    {formatBytes(item.size)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
