import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ActivityFeed } from "@/components/home/activity-feed";
import { CategoryGrid } from "@/components/home/category-grid";
import { Hero } from "@/components/home/hero";
import { PostCard } from "@/components/blog/post-card";
import { ProjectCard } from "@/components/projects/project-card";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import {
  getSiteStats,
  listCategoriesWithCounts,
  listFeaturedPosts,
  listPosts,
  listProjects,
  listRecentActivity,
} from "@/lib/db/queries";
import { getSiteSettings } from "@/lib/site";

export const dynamic = "force-dynamic";

const DOSSIER = [
  { label: "Role", value: "Systems engineer" },
  { label: "Focus", value: "Kernels · distributed state · firmware" },
  { label: "Location", value: "Shenzhen, CN" },
  { label: "Currently", value: "Writing a small LSM store" },
];

export default function HomePage() {
  const stats = getSiteStats();
  const featured = listFeaturedPosts(3);
  const latest = featured.length >= 3 ? featured : listPosts({ perPage: 3 }).items;
  const categories = listCategoriesWithCounts();
  const projects = listProjects().slice(0, 2);
  const activity = listRecentActivity(6);
  const site = getSiteSettings();

  const [lead, ...rest] = latest;

  return (
    <>
      <Hero
        articles={stats.posts}
        projects={stats.projects}
        fields={stats.categories}
        lastUpdated={stats.lastUpdated}
        topics={[
          ...categories.map((c) => c.name),
          "Field notes",
          "Reading list",
          "Experiments",
        ]}
      />

      {/* ── Featured writing ─────────────────────────────────────────────── */}
      <section className="container-page pt-20 md:pt-24">
        <Reveal>
          <SectionHeading
            index="01 / WRITING"
            title="Selected articles"
            description="Long-form notes on systems, security and machine learning — each one written after building or measuring the thing it describes."
            action={{ href: "/blog", label: "All writing" }}
          />
        </Reveal>

        {lead && (
          <div className="mt-10">
            <Reveal>
              <PostCard post={lead} variant="lead" />
            </Reveal>
            {rest.length > 0 && (
              <div className="mt-14 grid gap-10 border-t border-line/[0.07] pt-10 sm:grid-cols-2">
                {rest.map((post, index) => (
                  <Reveal key={post.id} delay={index * 80}>
                    <PostCard post={post} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        )}

        {!lead && (
          <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
            No published articles yet.
          </p>
        )}
      </section>

      {/* ── Fields ───────────────────────────────────────────────────────── */}
      <section className="container-page pt-24">
        <Reveal>
          <SectionHeading
            index="02 / FIELDS"
            title="What this site covers"
            description="Eight working areas. Some are professional, some are adjacent obsessions — all of them are things I actually build with."
          />
        </Reveal>
        <Reveal className="mt-9" delay={60}>
          <CategoryGrid categories={categories} />
        </Reveal>
      </section>

      {/* ── Projects ─────────────────────────────────────────────────────── */}
      <section className="container-page pt-24">
        <Reveal>
          <SectionHeading
            index="03 / WORK"
            title="Selected projects"
            description="Small, sharp tools built to answer a specific question. Source and notes are public where possible."
            action={{ href: "/projects", label: "All projects" }}
          />
        </Reveal>
        <div className="mt-10 grid gap-10 sm:grid-cols-2">
          {projects.map((project, index) => (
            <Reveal key={project.id} delay={index * 80}>
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Activity ─────────────────────────────────────────────────────── */}
      <section className="container-page pt-24">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Reveal>
              <SectionHeading
                index="04 / LOG"
                title="Recent activity"
                description="Pull requests, commits and the occasional 2 a.m. insight, in the order they happened."
              />
            </Reveal>
          </div>
          <div className="md:col-span-8">
            <Reveal delay={80}>
              <ActivityFeed entries={activity} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────────────────── */}
      <section className="container-page pt-24">
        <Reveal>
          <SectionHeading
            index="05 / DOSSIER"
            title="About"
            action={{ href: "/about", label: "Full dossier" }}
          />
        </Reveal>

        <div className="mt-9 grid gap-10 md:grid-cols-12 md:gap-14">
          <Reveal className="md:col-span-4" delay={60}>
            <dl className="space-y-4 border-l border-line/[0.1] pl-5">
              {DOSSIER.map((row) => (
                <div key={row.label}>
                  <dt className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
                    {row.label}
                  </dt>
                  <dd className="mt-1 text-[13px] text-fg/90">{row.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal className="md:col-span-8" delay={120}>
            <p className="max-w-[54ch] text-[19px] leading-[1.55] tracking-tight text-fg md:text-[21px]">
              I care about the gap between how software is described and how it
              actually behaves on a machine — and I write to close it.
            </p>
            <p className="mt-5 max-w-[58ch] text-[13.5px] leading-[1.8] text-muted">
              This site is my working notebook: half archive, half public commit
              log. {site.name} is built from scratch — a real CMS, real content,
              and no page builder. If something here is wrong, I would rather be
              corrected than quoted.
            </p>
            <Link
              href="/about"
              className="group mt-7 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-fg"
            >
              <span className="link-line">Read the full dossier</span>
              <ArrowUpRight
                className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px"
                strokeWidth={1.8}
              />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
