"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function SearchInput({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setValue(initial), [initial]);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const term = value.trim();
    router.push(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
  }

  return (
    <form onSubmit={submit} className="relative">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
        strokeWidth={1.6}
      />
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search titles, body text, tags, projects…"
        aria-label="Search query"
        className="h-14 w-full rounded-sm border border-line/12 bg-transparent pl-11 pr-24 text-[15px] text-fg outline-none transition-colors placeholder:text-faint focus:border-accent/50"
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            router.push("/search");
          }}
          className="absolute right-[92px] top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-[3px] text-faint transition-colors hover:text-fg"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        type="submit"
        className="absolute right-2.5 top-1/2 h-9 -translate-y-1/2 rounded-[3px] bg-fg px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-bg transition-colors hover:bg-accent hover:text-white"
      >
        Search
      </button>
    </form>
  );
}
