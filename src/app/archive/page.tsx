import type { Metadata } from "next";
import Link from "next/link";
import { FileText, FolderGit2 } from "lucide-react";

import { PageHeader } from "@/components/site/page-header";
import { Reveal } from "@/components/site/reveal";
import { getArchive } from "@/lib/db/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Archive",
  description:
    "Everything on this site, ordered by time — articles, project notes and the occasional draft.",
  alternates: { canonical: "/archive" },
};

export default function ArchivePage() {
  const archive = getArchive();
  const total = archive.reduce((sum, year) => sum + year.count, 0);

  return (
    <div className="container-page pb-10">
      <PageHeader
        eyebrow="Index / Chronology"
        title="Archive"
        description="The full record, newest first. Entries are grouped by the month they were published or last materially updated."
        meta={
          <>
            {total} entries
            <br />
            {archive.length} years
          </>
        }
      />

      <div className="mt-4">
        {archive.map((year) => (
          <section
            key={year.year}
            className="grid gap-8 border-b border-line/[0.08] py-10 md:grid-cols-12 md:gap-10"
          >
            <div className="md:col-span-3">
              <div className="md:sticky md:top-24">
                <h2 className="text-[34px] font-semibold leading-none tracking-tighter tabular text-fg">
                  {year.year}
                </h2>
                <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
                  {String(year.count).padStart(2, "0")} entries
                </p>
              </div>
            </div>

            <div className="space-y-9 md:col-span-9">
              {year.months.map((month) => (
                <Reveal key={month.key}>
                  <div className="grid gap-4 sm:grid-cols-[92px_minmax(0,1fr)]">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
                      {month.label}
                    </p>
                    <ul className="space-y-0">
                      {month.posts.map((post) => (
                        <li key={post.id}>
                          <Link
                            href={`/blog/${post.slug}`}
                            className="group flex items-baseline gap-3 border-b border-line/[0.06] py-2.5 last:border-0"
                          >
                            <span className="w-[52px] shrink-0 font-mono text-[9.5px] tabular text-faint">
                              {formatDate(post.published_at ?? post.created_at)
                                .split(" ")
                                .slice(0, 2)
                                .join(" ")}
                            </span>
                            <FileText
                              className="mt-[3px] h-3 w-3 shrink-0 text-faint/70"
                              strokeWidth={1.6}
                            />
                            <span className="min-w-0 flex-1 text-[13.5px] text-fg/90 transition-colors group-hover:text-accent">
                              {post.title}
                            </span>
                            <span className="hidden shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-faint sm:block">
                              {post.category?.name}
                            </span>
                          </Link>
                        </li>
                      ))}

                      {month.projects.map((project) => (
                        <li key={project.id}>
                          <Link
                            href={`/projects/${project.slug}`}
                            className="group flex items-baseline gap-3 border-b border-line/[0.06] py-2.5 last:border-0"
                          >
                            <span className="w-[52px] shrink-0 font-mono text-[9.5px] tabular text-faint">
                              {formatDate(project.updated_at)
                                .split(" ")
                                .slice(0, 2)
                                .join(" ")}
                            </span>
                            <FolderGit2
                              className="mt-[3px] h-3 w-3 shrink-0 text-faint/70"
                              strokeWidth={1.6}
                            />
                            <span className="min-w-0 flex-1 text-[13.5px] text-fg/90 transition-colors group-hover:text-accent">
                              {project.title}
                            </span>
                            <span className="hidden shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-faint sm:block">
                              Project · {project.status}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
