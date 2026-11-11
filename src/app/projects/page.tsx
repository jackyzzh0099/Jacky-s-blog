import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Github, Globe } from "lucide-react";

import { PageHeader } from "@/components/site/page-header";
import { Reveal } from "@/components/site/reveal";
import { StatusBadge } from "@/components/projects/project-card";
import { listProjects } from "@/lib/db/queries";
import { formatDate, formatDateUpper } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Small, sharp tools: an observability agent, an LSM storage engine, a photo culling tool, an RTOS kernel and a shader playground.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  const projects = listProjects();
  const active = projects.filter((p) => p.status === "active").length;

  return (
    <div className="container-page pb-10">
      <PageHeader
        eyebrow="Index / Projects"
        title="Things I have built"
        description="Each project started as a question I could not answer from documentation. They are small on purpose: the goal is to understand every line, not to ship a platform."
        meta={
          <>
            {projects.length} projects
            <br />
            {active} active · {projects.filter((p) => p.status === "archived").length}{" "}
            archived
          </>
        }
      />

      <div className="mt-4">
        {projects.map((project, index) => (
          <Reveal key={project.id} delay={Math.min(index, 5) * 50}>
            <article className="group relative border-b border-line/[0.08] py-8 first:border-t first:border-line/[0.08]">
              <Link href={`/projects/${project.slug}`} className="grid gap-6 md:grid-cols-12 md:gap-8">
                <div className="flex items-start gap-4 md:col-span-2">
                  <span className="font-mono text-[10px] tracking-[0.12em] text-faint">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="relative hidden h-[74px] w-[118px] overflow-hidden rounded-[3px] border border-line/[0.09] md:block">
                    {project.cover ? (
                      <img
                        src={project.cover}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-elev" />
                    )}
                  </div>
                </div>

                <div className="md:col-span-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-[21px] font-semibold tracking-tight text-fg transition-colors group-hover:text-accent md:text-[23px]">
                      {project.title}
                    </h2>
                    <StatusBadge status={project.status} />
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
                      {project.year}
                    </span>
                  </div>
                  <p className="mt-2 max-w-[52ch] text-[13px] leading-[1.7] text-muted">
                    {project.summary}
                  </p>
                  <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                    {project.stack.slice(0, 5).map((tech) => (
                      <span
                        key={tech}
                        className="rounded-[3px] border border-line/[0.09] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-faint"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 md:col-span-4 md:justify-end">
                  <div className="font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-faint md:text-right">
                    updated
                    <br />
                    <span className="text-muted">{formatDateUpper(project.updated_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {project.repo_url && (
                      <span className="flex h-8 w-8 items-center justify-center rounded-[3px] border border-line/10 text-faint">
                        <Github className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {project.demo_url && (
                      <span className="flex h-8 w-8 items-center justify-center rounded-[3px] border border-line/10 text-faint">
                        <Globe className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <ArrowUpRight
                      className="h-4 w-4 text-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                      strokeWidth={1.6}
                    />
                  </div>
                </div>
              </Link>
            </article>
          </Reveal>
        ))}
      </div>

      <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        Last updated {formatDate(projects[0]?.updated_at ?? null)}
      </p>
    </div>
  );
}
