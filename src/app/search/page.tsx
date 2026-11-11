import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, FileText, FolderGit2 } from "lucide-react";

import { SearchInput } from "@/components/search/search-input";
import { EmptyState } from "@/components/site/empty-state";
import { PageHeader } from "@/components/site/page-header";
import { listTagsWithCounts, searchEverything } from "@/lib/db/queries";
import { escapeRegExp } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  description: "Search every article, project and tag on the site.",
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
};

function highlight(text: string, query: string): ReactNode {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "ig"));
  const needle = query.toLowerCase();
  return parts.map((part, index) =>
    part.toLowerCase() === needle ? <mark key={index}>{part}</mark> : part,
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const query = (raw ?? "").slice(0, 120).trim();
  const hits = query ? searchEverything(query, 24) : [];
  const tags = listTagsWithCounts().slice(0, 16);

  const posts = hits.filter((hit) => hit.type === "post");
  const projects = hits.filter((hit) => hit.type === "project");

  return (
    <div className="container-page pb-10">
      <PageHeader
        eyebrow="Index / Search"
        title="Find something"
        description="Full-text search across titles, descriptions, article bodies, tags, categories and project notes. Press ⌘K anywhere for the quick palette."
        meta={
          query ? (
            <>
              {hits.length} result{hits.length === 1 ? "" : "s"}
              <br />
              for “{query}”
            </>
          ) : (
            <>
              Ctrl K / ⌘K
              <br />
              quick search
            </>
          )
        }
      />

      <div className="mt-8 max-w-[720px]">
        <SearchInput initial={query} />
      </div>

      {!query && (
        <div className="mt-10">
          <p className="label mb-4">Try a tag</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/search?q=${encodeURIComponent(tag.name)}`}
                className="inline-flex items-center gap-1.5 rounded-[3px] border border-line/[0.09] px-2 py-1 font-mono text-[10.5px] text-muted transition-colors hover:border-line/25 hover:text-fg"
              >
                #{tag.name}
                <span className="text-faint">{tag.postCount}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {query && hits.length === 0 && (
        <div className="mt-10">
          <EmptyState
            code="0x01 / NO INDEX ENTRY"
            title={`No results for “${query}”`}
            description="Search is literal — try a shorter term, a different spelling, or a tag like memory, raft, ebpf or rust."
            action={{ href: "/blog", label: "Browse all writing" }}
          />
        </div>
      )}

      {query && hits.length > 0 && (
        <div className="mt-12 space-y-14">
          {posts.length > 0 && (
            <section>
              <div className="flex items-baseline gap-3 border-t border-line/[0.09] pt-4">
                <span className="label">Articles</span>
                <span className="font-mono text-[9.5px] text-faint">
                  {posts.length}
                </span>
              </div>
              <ul className="mt-2">
                {posts.map((hit) => (
                  <li key={hit.id}>
                    <Link
                      href={hit.href}
                      className="group grid gap-2 border-b border-line/[0.07] py-5 sm:grid-cols-[minmax(0,1fr)_150px] sm:gap-6"
                    >
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2.5">
                          <FileText className="mt-1 h-3 w-3 shrink-0 text-faint" strokeWidth={1.6} />
                          <h3 className="text-[15.5px] font-medium tracking-tight text-fg transition-colors group-hover:text-accent">
                            {highlight(hit.title, query)}
                          </h3>
                        </div>
                        <p className="mt-1.5 pl-[22px] line-clamp-2 text-[12.5px] leading-relaxed text-muted">
                          {highlight(hit.excerpt, query)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pl-[22px] font-mono text-[9px] uppercase tracking-[0.12em] text-faint sm:justify-end sm:pl-0">
                        <span>{hit.category}</span>
                        <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {projects.length > 0 && (
            <section>
              <div className="flex items-baseline gap-3 border-t border-line/[0.09] pt-4">
                <span className="label">Projects</span>
                <span className="font-mono text-[9.5px] text-faint">
                  {projects.length}
                </span>
              </div>
              <ul className="mt-2">
                {projects.map((hit) => (
                  <li key={hit.id}>
                    <Link
                      href={hit.href}
                      className="group grid gap-2 border-b border-line/[0.07] py-5 sm:grid-cols-[minmax(0,1fr)_150px] sm:gap-6"
                    >
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2.5">
                          <FolderGit2 className="mt-1 h-3 w-3 shrink-0 text-faint" strokeWidth={1.6} />
                          <h3 className="text-[15.5px] font-medium tracking-tight text-fg transition-colors group-hover:text-accent">
                            {highlight(hit.title, query)}
                          </h3>
                        </div>
                        <p className="mt-1.5 pl-[22px] line-clamp-2 text-[12.5px] leading-relaxed text-muted">
                          {highlight(hit.excerpt, query)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pl-[22px] font-mono text-[9px] uppercase tracking-[0.12em] text-faint sm:justify-end sm:pl-0">
                        <span>{hit.tags?.slice(0, 2).join(" · ")}</span>
                        <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
