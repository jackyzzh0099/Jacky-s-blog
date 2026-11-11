"use client";

import { Check, Link2, Mail } from "lucide-react";
import { useState } from "react";

export function ShareRow({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  const xHref = `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`I thought you might like this: ${url}`)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
        Share
      </span>

      <button
        type="button"
        onClick={copy}
        className="inline-flex h-8 items-center gap-1.5 rounded-[3px] border border-line/10 px-2.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted transition-colors hover:border-line/25 hover:text-fg"
      >
        {copied ? (
          <Check className="h-3 w-3 text-accent" />
        ) : (
          <Link2 className="h-3 w-3" />
        )}
        {copied ? "Copied" : "Copy link"}
      </button>

      <a
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-8 items-center gap-1.5 rounded-[3px] border border-line/10 px-2.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted transition-colors hover:border-line/25 hover:text-fg"
      >
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
          <path d="M18.9 2H22l-6.8 7.8L23 22h-6.3l-4.9-6.4L6 22H2.9l7.3-8.3L1.6 2H8l4.4 5.9L18.9 2Zm-1.1 18h1.7L7.1 3.8H5.3L17.8 20Z" />
        </svg>
        Share on X
      </a>

      <a
        href={mailHref}
        className="inline-flex h-8 items-center gap-1.5 rounded-[3px] border border-line/10 px-2.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted transition-colors hover:border-line/25 hover:text-fg"
      >
        <Mail className="h-3 w-3" />
        Email
      </a>
    </div>
  );
}
