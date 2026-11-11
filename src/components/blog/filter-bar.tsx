"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import type { CategoryWithCount, TagWithCount } from "@/lib/db/types";
import { cn } from "@/lib/utils";

export function FilterBar({
  categories,
  tags,
  showing,
  total,
}: {
  categories: CategoryWithCount[];
  tags: TagWithCount[];
  showing: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [term, setTerm] = useState(params.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  const activeCategory = params.get("category") ?? "";
  const activeTag = params.get("tag") ?? "";
  const activeQuery = params.get("q") ?? "";

  useEffect(() => {
    setTerm(activeQuery);
  }, [activeQuery]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function navigate(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    const query = next.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  // Debounced search-as-you-type; the URL stays shareable.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (term === current) return;
    const timer = window.setTimeout(() => navigate({ q: term || null }), 330);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const hasFilters = Boolean(activeCategory || activeTag || activeQuery);

  return (
    <div className="border-t border-line/[0.09] pt-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="group relative flex w-full max-w-[360px] items-center">
          <Search
            className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-faint"
            strokeWidth={1.7}
          />
          <input
            ref={inputRef}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Filter by keyword…"
            className="h-9 w-full rounded-sm border border-line/10 bg-transparent pl-9 pr-9 text-[13px] text-fg outline-none transition-colors placeholder:text-faint focus:border-accent/45"
            aria-label="Filter articles by keyword"
          />
          {term ? (
            <button
              type="button"
              onClick={() => {
                setTerm("");
                navigate({ q: null });
              }}
              className="absolute right-2.5 flex h-5 w-5 items-center justify-center rounded-[2px] text-faint hover:text-fg"
              aria-label="Clear keyword"
            >
              <X className="h-3 w-3" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2.5 rounded-[2px] border border-line/10 px-1 py-0.5 font-mono text-[9px] text-faint">
              /
            </kbd>
          )}
        </label>

        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
          <span className={cn("transition-opacity", pending && "opacity-40")}>
            {String(showing).padStart(2, "0")} / {String(total).padStart(2, "0")}{" "}
            results
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => navigate({ category: null, tag: null, q: null })}
              className="rounded-[3px] border border-line/10 px-2 py-1 text-muted transition-colors hover:border-line/25 hover:text-fg"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      <div className="no-scrollbar mt-5 flex gap-1.5 overflow-x-auto pb-0.5 md:flex-wrap md:overflow-visible">
        <button
          type="button"
          onClick={() => navigate({ category: null })}
          className={cn(
            "h-7 shrink-0 rounded-[3px] px-2.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors",
            activeCategory === ""
              ? "bg-fg text-bg"
              : "border border-line/10 text-muted hover:border-line/25 hover:text-fg",
          )}
        >
          All fields
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() =>
              navigate({
                category: activeCategory === category.slug ? null : category.slug,
              })
            }
            className={cn(
              "flex h-7 shrink-0 items-center gap-1.5 rounded-[3px] px-2.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors",
              activeCategory === category.slug
                ? "bg-fg text-bg"
                : "border border-line/10 text-muted hover:border-line/25 hover:text-fg",
            )}
          >
            {category.name}
            <span
              className={cn(
                "text-[9px]",
                activeCategory === category.slug ? "text-bg/60" : "text-faint",
              )}
            >
              {category.postCount}
            </span>
          </button>
        ))}
      </div>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint/70">
            Tags
          </span>
          {tags.slice(0, 14).map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() =>
                navigate({ tag: activeTag === tag.slug ? null : tag.slug })
              }
              className={cn(
                "font-mono text-[10px] tracking-[0.04em] transition-colors",
                activeTag === tag.slug
                  ? "text-accent underline decoration-accent/40 underline-offset-4"
                  : "text-faint hover:text-fg",
              )}
            >
              #{tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
