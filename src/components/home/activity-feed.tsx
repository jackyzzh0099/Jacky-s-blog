import Link from "next/link";
import { ArrowUpRight, FileText, FolderGit2 } from "lucide-react";

import type { ActivityEntry } from "@/lib/db/types";
import { formatDateUpper } from "@/lib/utils";

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <ol className="relative">
      <span
        aria-hidden="true"
        className="absolute bottom-2 left-[7px] top-2 w-px bg-line/[0.09]"
      />
      {entries.map((entry) => (
        <li key={`${entry.kind}-${entry.id}`} className="group relative pl-8">
          <span
            aria-hidden="true"
            className="absolute left-[3px] top-[9px] h-[9px] w-[9px] rounded-full border border-line/20 bg-bg transition-colors duration-300 group-hover:border-accent group-hover:bg-accent/30"
          />
          <Link
            href={entry.href}
            className="flex flex-col gap-1 border-b border-line/[0.06] py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="shrink-0 text-faint">
                {entry.kind === "post" ? (
                  <FileText className="h-3 w-3" strokeWidth={1.6} />
                ) : (
                  <FolderGit2 className="h-3 w-3" strokeWidth={1.6} />
                )}
              </span>
              <span className="truncate text-[13.5px] text-fg/90 transition-colors group-hover:text-accent">
                {entry.title}
              </span>
              {entry.status === "draft" && (
                <span className="shrink-0 rounded-[2px] border border-signal/30 px-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-signal">
                  draft
                </span>
              )}
            </span>
            <span className="flex shrink-0 items-center gap-3 pl-[22px] font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint sm:pl-0">
              <span>{entry.meta}</span>
              <span className="h-2.5 w-px bg-line/15" />
              <time dateTime={entry.date}>{formatDateUpper(entry.date)}</time>
              <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
