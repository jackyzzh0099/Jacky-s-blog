import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Github, Globe } from "lucide-react";

import { ArticleContent } from "@/components/blog/article-content";
import { StatusBadge } from "@/components/projects/project-card";
import { getProjectBySlug, listProjects } from "@/lib/db/queries";
import { renderMarkdown } from "@/lib/markdown";
import { absoluteUrl, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };

  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "article",
      title: project.title,
      description: project.summary,
      url: absoluteUrl(`/projects/${project.slug}`),
      images: project.cover ? [{ url: project.cover }] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const doc = await renderMarkdown(project.content);
  const others = listProjects()
    .filter((p) => p.id !== project.id)
    .slice(0, 3);

  return (
    <article className="container-page">
      <div className="pb-8 pt-10 md:pt-14">
        <Link
          href="/projects"
          className="group inline-flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
          All projects
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <StatusBadge status={project.status} />
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
            {project.year} — updated {formatDate(project.updated_at)}
          </span>
        </div>

        <h1 className="mt-4 text-[clamp(2.1rem,4.8vw,3.2rem)] font-semibold leading-[1.03] tracking-[-0.04em] text-fg">
          {project.title}
        </h1>
        <p className="mt-4 max-w-[62ch] text-[15px] leading-[1.7] text-muted">
          {project.summary}
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-2">
          {project.repo_url && (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost h-9 text-[12px]"
            >
              <Github className="h-3.5 w-3.5" />
              Source
            </a>
          )}
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary h-9 text-[12px]"
            >
              <Globe className="h-3.5 w-3.5" />
              Live demo
              <ArrowUpRight className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {project.cover && (
        <figure className="relative overflow-hidden rounded-sm border border-line/[0.09] bg-elev">
          <img
            src={project.cover}
            alt=""
            className="aspect-[2/1] max-h-[420px] w-full object-cover"
            fetchPriority="high"
          />
        </figure>
      )}

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-16">
        <div className="min-w-0 max-w-[720px]">
          <div className="border-y border-line/[0.08] py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
            Project notes · {project.stack.length} technologies
          </div>
          <div className="mt-2">
            <ArticleContent
              parts={doc.parts}
              readingMinutes={Math.max(2, Math.round(project.content.length / 1200))}
              showToolbar={false}
            />
          </div>
        </div>

        <aside className="relative">
          <div className="lg:sticky lg:top-24">
            <p className="label mb-4">At a glance</p>
            <dl className="space-y-4 border-l border-line/[0.09] pl-4">
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                  Status
                </dt>
                <dd className="mt-1">
                  <StatusBadge status={project.status} />
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                  Year
                </dt>
                <dd className="mt-1 text-[13px] text-fg/90">{project.year}</dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                  Stack
                </dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {project.stack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-[3px] border border-line/[0.09] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-muted"
                    >
                      {tech}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                  Links
                </dt>
                <dd className="mt-1 space-y-1.5 text-[12.5px]">
                  {project.repo_url && (
                    <a
                      href={project.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-muted transition-colors hover:text-fg"
                    >
                      Repository ↗
                    </a>
                  )}
                  {project.demo_url && (
                    <a
                      href={project.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-muted transition-colors hover:text-fg"
                    >
                      Demo ↗
                    </a>
                  )}
                  {!project.repo_url && !project.demo_url && (
                    <span className="text-faint">Private</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      {others.length > 0 && (
        <section className="mt-20 border-t border-line/[0.09] pt-6">
          <p className="label mb-5">Other projects</p>
          <div className="grid gap-6 sm:grid-cols-3">
            {others.map((other) => (
              <Link
                key={other.id}
                href={`/projects/${other.slug}`}
                className="group flex items-baseline justify-between gap-3 border-b border-line/[0.07] pb-3"
              >
                <span>
                  <span className="block text-[14px] font-medium text-fg transition-colors group-hover:text-accent">
                    {other.title}
                  </span>
                  <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                    {other.year} · {other.status}
                  </span>
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-faint transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
