import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Github, Mail, Rss } from "lucide-react";

import { PageHeader } from "@/components/site/page-header";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { getSiteStats, listCategoriesWithCounts } from "@/lib/db/queries";
import { getSiteSettings } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About",
  description:
    "Jacky — systems engineer working across operating systems, distributed state, security and embedded hardware.",
  alternates: { canonical: "/about" },
};

const TRAJECTORY = [
  {
    period: "2025 — now",
    title: "Independent systems work",
    detail:
      "Building tooling for observability and storage, and writing the notes that became this site. Consulting on performance and reliability for small teams.",
  },
  {
    period: "2023 — 2025",
    title: "Infrastructure engineering",
    detail:
      "Ran Linux fleets, chased tail latency, learned that most incidents are deployment problems wearing a systems costume.",
  },
  {
    period: "2021 — 2023",
    title: "Computer science, with a systems bias",
    detail:
      "Operating systems, compilers, networks. Discovered that the interesting bugs live one layer below where you are looking.",
  },
];

const STACK: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["C", "Rust", "Go", "TypeScript", "Python", "SQL"] },
  {
    group: "Systems",
    items: ["Linux", "eBPF", "io_uring", "QEMU", "ARM Cortex-M", "FreeRTOS", "Perf"],
  },
  {
    group: "Web",
    items: ["Next.js", "React", "TypeScript", "Tailwind CSS", "SQLite", "Node.js"],
  },
  {
    group: "Practice",
    items: ["Git", "Neovim", "Wireshark", "GDB", "Terraform", "Darktable"],
  },
];

const NOW = [
  "Finishing the background compaction scheduler in atlas",
  "Reading through the eBPF verifier's bounds-tracking code",
  "Shooting a roll of HP5+ every Sunday, rain or not",
];

export default function AboutPage() {
  const site = getSiteSettings();
  const stats = getSiteStats();
  const categories = listCategoriesWithCounts().filter((c) => c.postCount > 0);

  return (
    <div className="container-page pb-10">
      <PageHeader
        eyebrow="Dossier / Person"
        title="Jacky"
        description="Systems engineer. I write code that runs close to the machine, and I write prose to work out what I actually learned."
        meta={
          <>
            {site.location}
            <br />
            Est. {site.established} · v{site.version}
          </>
        }
      >
        <div className="mt-7 flex flex-wrap items-center gap-2">
          <a href={`mailto:${site.email}`} className="btn btn-primary h-9 text-[12px]">
            <Mail className="h-3.5 w-3.5" />
            Get in touch
          </a>
          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost h-9 text-[12px]"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </a>
          <a href="/feed.xml" className="btn btn-quiet h-9 text-[12px]">
            <Rss className="h-3.5 w-3.5" />
            RSS
          </a>
        </div>

        <dl className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-line/[0.08] bg-line/[0.08] sm:grid-cols-4">
          {[
            { k: "Coordinates", v: "22.54°N 114.05°E" },
            { k: "Focus", v: "Systems · security" },
            { k: "Status", v: "Open to correspondence" },
            { k: "Reply time", v: "Usually < 24 h" },
          ].map((item) => (
            <div key={item.k} className="bg-card px-3 py-2.5">
              <dt className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-faint">
                {item.k}
              </dt>
              <dd className="mt-1 text-[11.5px] text-fg/85">{item.v}</dd>
            </div>
          ))}
        </dl>
      </PageHeader>

      <section className="pt-14">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-3">
            <p className="label">01 / Position</p>
          </div>
          <div className="md:col-span-9">
            <p className="max-w-[52ch] text-[22px] leading-[1.5] tracking-[-0.02em] text-fg md:text-[25px]">
              I care about the gap between how software is described and how it
              behaves once it meets a real machine.
            </p>
            <div className="mt-7 grid max-w-[62ch] gap-4 text-[13.5px] leading-[1.85] text-muted">
              <p>
                Most of my work happens in the layers people skip: the scheduler,
                the page table, the write path, the interrupt handler. That is
                where the interesting failures live, and where an afternoon of
                measurement beats a week of speculation.
              </p>
              <p>
                I write here because writing is the only way I have found to test
                whether I actually understand something. If a post cannot explain
                a mechanism end to end — including the parts that are ugly — it is
                not finished.
              </p>
              <p>
                Off the keyboard I shoot 35mm film, which is the same discipline
                applied to light instead of latency: reduce the variables, choose
                the ones you can control, then look at the result honestly.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-20">
        <SectionHeading index="02 / TRAJECTORY" title="How I got here" />
        <div className="mt-8">
          {TRAJECTORY.map((entry, index) => (
            <Reveal key={entry.period} delay={index * 60}>
              <div className="grid gap-4 border-b border-line/[0.08] py-7 md:grid-cols-12 md:gap-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint md:col-span-3">
                  {entry.period}
                </p>
                <div className="md:col-span-9">
                  <h3 className="text-[16px] font-medium tracking-tight text-fg">
                    {entry.title}
                  </h3>
                  <p className="mt-2 max-w-[62ch] text-[13px] leading-[1.8] text-muted">
                    {entry.detail}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="pt-20">
        <SectionHeading
          index="03 / TOOLKIT"
          title="What I work with"
          description="Not a skills matrix — the things I reach for by default, and can defend in a code review."
        />
        <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {STACK.map((group, index) => (
            <Reveal key={group.group} delay={index * 50}>
              <div className="border-t border-line/[0.09] pt-4">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
                  {group.group}
                </p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-[3px] border border-line/[0.09] px-1.5 py-1 font-mono text-[10px] text-muted transition-colors hover:border-line/25 hover:text-fg"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="pt-20">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-3">
            <p className="label">04 / Currently</p>
          </div>
          <div className="md:col-span-9">
            <ul className="space-y-3">
              {NOW.map((item, index) => (
                <li key={item} className="flex gap-4 border-b border-line/[0.07] pb-3">
                  <span className="font-mono text-[9.5px] text-faint">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[13.5px] leading-relaxed text-fg/90">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/blog?category=${category.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-[3px] border border-line/[0.09] px-2 py-1 font-mono text-[10px] text-muted transition-colors hover:border-line/25 hover:text-fg"
                >
                  {category.name}
                  <span className="text-faint">{category.postCount}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pt-20">
        <SectionHeading
          index="05 / COLOPHON"
          title="How this site is built"
          description="A real CMS, a real database, and no page builder — because the site is part of the practice."
        />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: "Framework", v: "Next.js 15 · App Router · React 19" },
            { k: "Content", v: "Markdown + YAML front matter, stored in SQLite" },
            { k: "Rendering", v: "unified · Shiki · KaTeX · Mermaid" },
            { k: "Privacy", v: "No analytics, no third-party scripts, no cookies for readers" },
          ].map((row) => (
            <div key={row.k} className="border-t border-line/[0.09] pt-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                {row.k}
              </p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{row.v}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-line/[0.09] pt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          <span>{stats.posts} articles</span>
          <span>{stats.projects} projects</span>
          <span>{stats.tags} tags</span>
          <Link href="/archive" className="inline-flex items-center gap-1 text-muted hover:text-fg">
            Browse the archive
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </section>
    </div>
  );
}
