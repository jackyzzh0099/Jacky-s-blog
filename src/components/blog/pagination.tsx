import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  params,
  basePath,
}: {
  page: number;
  totalPages: number;
  params: Record<string, string | undefined>;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  const build = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && key !== "page") search.set(key, value);
    }
    if (target > 1) search.set("page", String(target));
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) =>
      p === 1 ||
      p === totalPages ||
      Math.abs(p - page) <= 1,
  );

  return (
    <nav
      aria-label="Pagination"
      className="mt-16 flex items-center justify-between border-t border-line/[0.09] pt-6"
    >
      {page > 1 ? (
        <Link
          href={build(page - 1)}
          className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
          Newer
        </Link>
      ) : (
        <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint/50">
          <ArrowLeft className="h-3 w-3" />
          Newer
        </span>
      )}

      <div className="flex items-center gap-1">
        {pages.map((p, index) => {
          const previous = pages[index - 1];
          const gap = previous && p - previous > 1;
          return (
            <span key={p} className="flex items-center gap-1">
              {gap && (
                <span className="px-1 font-mono text-[10px] text-faint">…</span>
              )}
              <Link
                href={build(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "flex h-7 min-w-7 items-center justify-center rounded-[3px] px-1.5 font-mono text-[10.5px] tabular transition-colors",
                  p === page
                    ? "bg-fg text-bg"
                    : "text-muted hover:bg-line/5 hover:text-fg",
                )}
              >
                {String(p).padStart(2, "0")}
              </Link>
            </span>
          );
        })}
      </div>

      {page < totalPages ? (
        <Link
          href={build(page + 1)}
          className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-fg"
        >
          Older
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint/50">
          Older
          <ArrowRight className="h-3 w-3" />
        </span>
      )}
    </nav>
  );
}
