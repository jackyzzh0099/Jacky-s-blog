"use client";

import { Check, Copy, Minus, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Mermaid } from "./mermaid";
import type { RenderedPart } from "@/lib/markdown";
import { cn } from "@/lib/utils";

type FontSize = "sm" | "md" | "lg";

export function ArticleContent({
  parts,
  readingMinutes,
  showToolbar = true,
}: {
  parts: RenderedPart[];
  readingMinutes: number;
  showToolbar?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [font, setFont] = useState<FontSize>("md");
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(
    null,
  );

  useEffect(() => {
    const stored = window.localStorage.getItem("jb-font");
    if (stored === "sm" || stored === "md" || stored === "lg") setFont(stored);
  }, []);

  const changeFont = useCallback((next: FontSize) => {
    setFont(next);
    try {
      window.localStorage.setItem("jb-font", next);
    } catch {
      /* ignore */
    }
  }, []);

  /* Code blocks: inject a header with language label + copy button. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const figures = Array.from(
      root.querySelectorAll<HTMLElement>("figure[data-rehype-pretty-code-figure]"),
    );

    for (const figure of figures) {
      if (figure.querySelector(".code-head")) continue;
      const pre = figure.querySelector("pre");
      const code = figure.querySelector("code");
      if (!pre) continue;

      const language =
        code?.getAttribute("data-language") ?? figure.getAttribute("data-lang") ?? "text";

      const head = document.createElement("div");
      head.className = "code-head";

      const label = document.createElement("span");
      label.className = "code-lang";
      label.textContent = language;

      const actions = document.createElement("span");
      actions.style.display = "inline-flex";
      actions.style.alignItems = "center";
      actions.style.gap = "0.35rem";

      const lineCount = code?.querySelectorAll("[data-line]").length ?? 0;

      // Line numbers are opt-in per block, but default on for long listings.
      if (code && lineCount >= 10) {
        code.dataset.lineNumbers = "";
      }

      const lines = document.createElement("button");
      lines.type = "button";
      lines.className = "code-copy";
      lines.textContent = "Lines";
      lines.setAttribute("aria-label", "Toggle line numbers");
      lines.setAttribute("aria-pressed", String(Boolean(code?.dataset.lineNumbers)));
      lines.addEventListener("click", () => {
        if (!code) return;
        if (code.dataset.lineNumbers === undefined) {
          code.dataset.lineNumbers = "";
          lines.setAttribute("aria-pressed", "true");
        } else {
          delete code.dataset.lineNumbers;
          lines.setAttribute("aria-pressed", "false");
        }
      });

      const button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy";
      button.textContent = "Copy";
      button.setAttribute("aria-label", `Copy ${language} code`);

      button.addEventListener("click", async () => {
        const text = code?.textContent ?? "";
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const area = document.createElement("textarea");
          area.value = text;
          document.body.appendChild(area);
          area.select();
          document.execCommand("copy");
          area.remove();
        }
        button.textContent = "Copied";
        button.dataset.copied = "true";
        window.setTimeout(() => {
          button.textContent = "Copy";
          button.dataset.copied = "false";
        }, 1600);
      });

      head.append(label, actions);
      actions.append(lines, button);
      figure.insertBefore(head, pre);
    }
  }, [parts]);

  /* Images: click to open a lightbox. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (target.tagName !== "IMG") return;
      const img = target as HTMLImageElement;
      if (img.closest("a")) return;
      event.preventDefault();
      setLightbox({ src: img.currentSrc || img.src, alt: img.alt ?? "" });
    }

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  return (
    <>
      {showToolbar && (
      <div className="mb-9 flex items-center justify-between border-y border-line/[0.08] py-2.5">
        <div className="flex items-center gap-3 font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
          <span>Reading mode</span>
          <span className="h-2.5 w-px bg-line/15" />
          <span>{readingMinutes} min</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
            Size
          </span>
          <button
            type="button"
            onClick={() => changeFont("sm")}
            aria-label="Smaller text"
            aria-pressed={font === "sm"}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-[3px] border transition-colors",
              font === "sm"
                ? "border-line/25 text-fg"
                : "border-line/10 text-faint hover:text-fg",
            )}
          >
            <Minus className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => changeFont("lg")}
            aria-label="Larger text"
            aria-pressed={font === "lg"}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-[3px] border transition-colors",
              font === "lg"
                ? "border-line/25 text-fg"
                : "border-line/10 text-faint hover:text-fg",
            )}
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => changeFont("md")}
            className="ml-1 font-mono text-[9px] uppercase tracking-[0.1em] text-faint transition-colors hover:text-fg"
          >
            reset
          </button>
        </div>
      </div>
      )}

      <div ref={rootRef} className="article-body" data-font={font}>
        <div className="prose-jb">
          {parts.map((part, index) =>
            part.type === "html" ? (
              <div
                key={index}
                dangerouslySetInnerHTML={{ __html: part.html ?? "" }}
              />
            ) : (
              <Mermaid key={`mermaid-${index}`} code={part.code ?? ""} />
            ),
          )}
        </div>
      </div>

      {lightbox && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-sm border border-white/15 text-white/70 transition-colors hover:text-white"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
          <figure className="max-h-full">
            <img src={lightbox.src} alt={lightbox.alt} />
            {lightbox.alt && (
              <figcaption className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">
                {lightbox.alt}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  );
}

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          /* ignore */
        }
      }}
      className="inline-flex h-8 items-center gap-1.5 rounded-[3px] border border-line/10 px-2.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted transition-colors hover:border-line/25 hover:text-fg"
    >
      {copied ? (
        <Check className="h-3 w-3 text-accent" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
