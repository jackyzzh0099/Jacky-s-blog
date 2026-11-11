"use client";

import {
  ArrowRight,
  CornerDownLeft,
  FileText,
  FolderGit2,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

interface Hit {
  id: string;
  type: "post" | "project";
  title: string;
  excerpt: string;
  href: string;
  category?: string;
  date: string;
}

const QUICK_LINKS = [
  { label: "All writing", href: "/blog", hint: "09 articles" },
  { label: "Selected projects", href: "/projects", hint: "05 builds" },
  { label: "Chronology", href: "/archive", hint: "archive" },
  { label: "About Jacky", href: "/about", hint: "dossier" },
];

function highlight(text: string, query: string): ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "ig"));
  const needle = query.toLowerCase();

  return parts.map((part, index) =>
    part.toLowerCase() === needle ? (
      <mark key={index}>{part}</mark>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHits([]);
    setActive(0);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isMod = event.metaKey || event.ctrlKey;
      if (isMod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (event.key === "Escape") close();
    }
    const onOpenEvent = () => setOpen(true);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("jb:open-search", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("jb:open-search", onOpenEvent);
    };
  }, [close]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const term = query.trim();

    if (term.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("search failed");
        const data = (await response.json()) as { hits: Hit[] };
        setHits(data.hits ?? []);
        setActive(0);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setHits([]);
      } finally {
        setLoading(false);
      }
    }, 170);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, open]);

  const items = useMemo<Hit[]>(
    () =>
      hits.length > 0
        ? hits
        : query.trim().length < 2
          ? []
          : [],
    [hits, query],
  );

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(0, items.length - 1)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = items[active];
      if (target) go(target.href);
      else if (query.trim()) go(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`,
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const showSuggestions = query.trim().length < 2 && hits.length === 0;
  const showEmpty = !loading && query.trim().length >= 2 && items.length === 0;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/55 px-4 pb-10 pt-[12vh] backdrop-blur-[3px] animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="w-full max-w-[620px] overflow-hidden rounded-md border border-line/12 bg-card shadow-float animate-scale-in">
        <div className="flex items-center gap-3 border-b border-line/[0.08] px-4">
          <Search className="h-4 w-4 shrink-0 text-faint" strokeWidth={1.7} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Search articles, projects, tags…"
            className="h-[52px] w-full bg-transparent text-[14.5px] text-fg outline-none placeholder:text-faint"
            aria-label="Search query"
            autoComplete="off"
            spellCheck={false}
          />
          {loading && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-faint" />
          )}
          <button
            type="button"
            onClick={close}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] border border-line/10 text-faint transition-colors hover:text-fg"
            aria-label="Close search"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {showSuggestions && (
            <div>
              <p className="label px-2 py-2">Jump to</p>
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => go(link.href)}
                  className="flex w-full items-center justify-between rounded-sm px-2.5 py-2.5 text-left transition-colors hover:bg-line/[0.05]"
                >
                  <span className="flex items-center gap-2.5 text-[13.5px] text-fg/90">
                    <ArrowRight className="h-3.5 w-3.5 text-faint" />
                    {link.label}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                    {link.hint}
                  </span>
                </button>
              ))}
              <p className="px-2 pb-1 pt-4 font-mono text-[10px] leading-relaxed tracking-[0.06em] text-faint">
                Type at least two characters to search the full text of every
                article.
              </p>
            </div>
          )}

          {items.map((hit, index) => (
            <button
              key={`${hit.type}-${hit.id}`}
              type="button"
              data-index={index}
              onMouseEnter={() => setActive(index)}
              onClick={() => go(hit.href)}
              className={cn(
                "group flex w-full items-start gap-3 rounded-sm px-2.5 py-2.5 text-left transition-colors",
                active === index ? "bg-line/[0.07]" : "hover:bg-line/[0.04]",
              )}
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] border border-line/10 text-faint">
                {hit.type === "post" ? (
                  <FileText className="h-3 w-3" />
                ) : (
                  <FolderGit2 className="h-3 w-3" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-[13.5px] font-medium text-fg">
                    {highlight(hit.title, query)}
                  </span>
                  <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.1em] text-faint">
                    {hit.category}
                  </span>
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[12px] leading-relaxed text-muted">
                  {highlight(hit.excerpt, query)}
                </span>
              </span>
              {active === index && (
                <CornerDownLeft className="mt-1 h-3 w-3 shrink-0 text-faint" />
              )}
            </button>
          ))}

          {showEmpty && (
            <div className="px-4 py-10 text-center">
              <p className="text-[13.5px] text-fg">No matches for “{query}”</p>
              <p className="mt-1.5 text-[12px] text-muted">
                Try a tag such as <span className="text-fg">raft</span>,{" "}
                <span className="text-fg">memory</span> or{" "}
                <span className="text-fg">ebpf</span>.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line/[0.08] px-4 py-2.5">
          <div className="flex items-center gap-4 font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
            <span className="flex items-center gap-1">
              <kbd className="rounded-[3px] border border-line/10 px-1 py-0.5">↑</kbd>
              <kbd className="rounded-[3px] border border-line/10 px-1 py-0.5">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded-[3px] border border-line/10 px-1 py-0.5">↵</kbd>
              open
            </span>
            <span className="hidden items-center gap-1 sm:flex">
              <kbd className="rounded-[3px] border border-line/10 px-1 py-0.5">esc</kbd>
              close
            </span>
          </div>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
            {items.length > 0 ? `${items.length} results` : "Full-text index"}
          </span>
        </div>
      </div>
    </div>
  );
}
