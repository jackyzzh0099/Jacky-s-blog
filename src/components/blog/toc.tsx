"use client";

import { ArrowUp, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import type { TocItem } from "@/lib/markdown";

export function Toc({
  items,
  variant = "sidebar",
}: {
  items: TocItem[];
  variant?: "sidebar" | "inline";
}) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    if (variant !== "sidebar" || items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-88px 0px -68% 0px", threshold: [0, 1] },
    );

    for (const item of items) {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [items, variant]);

  if (items.length < 2) return null;

  if (variant === "inline") {
    return (
      <details className="group mb-8 border border-line/[0.09] lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
          <span className="label text-muted">
            Contents — {items.length} sections
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-faint transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-line/[0.08] px-4 py-3">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              data-depth={item.depth}
              className="toc-link"
            >
              {item.text}
            </a>
          ))}
        </div>
      </details>
    );
  }

  return (
    <nav aria-label="Table of contents" className="sticky top-24 hidden lg:block">
      <p className="label mb-4">On this page</p>
      <div className="max-h-[62vh] overflow-y-auto pr-2">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            data-active={activeId === item.id}
            data-depth={item.depth}
            className="toc-link"
          >
            {item.text}
          </a>
        ))}
      </div>

      <div className="mt-6 border-t border-line/[0.08] pt-4">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="group inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint transition-colors hover:text-fg"
        >
          <ArrowUp className="h-3 w-3 transition-transform group-hover:-translate-y-0.5" />
          Back to top
        </button>
      </div>
    </nav>
  );
}
