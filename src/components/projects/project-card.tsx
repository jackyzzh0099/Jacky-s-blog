import Link from "next/link";
import { ArrowUpRight, GitBranch } from "lucide-react";

import type { Project, ProjectStatus } from "@/lib/db/types";
import { cn } from "@/lib/utils";

export const STATUS_META: Record<
  ProjectStatus,
  { label: string; className: string; dot: string }
> = {
  active: {
    label: "Active",
    className: "border-accent/25 bg-accent/[0.07] text-accent",
    dot: "bg-accent",
  },
  beta: {
    label: "Beta",
    className: "border-signal/25 bg-signal/[0.07] text-signal",
    dot: "bg-signal",
  },
  wip: {
    label: "In progress",
    className: "border-line/15 bg-line/[0.04] text-muted",
    dot: "bg-muted",
  },
  archived: {
    label: "Archived",
    className: "border-line/12 bg-transparent text-faint",
    dot: "bg-faint",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const meta = STATUS_META[(status as ProjectStatus) ?? "active"] ?? STATUS_META.active;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[3px] border px-1.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em]",
        meta.className,
        className,
      )}
    >
      <span className={cn("h-1 w-1 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group relative">
      <Link href={`/projects/${project.slug}`} className="block">
        <div className="relative overflow-hidden rounded-sm border border-line/[0.09] bg-elev">
          <div className="aspect-[16/10] w-full">
            {project.cover ? (
              <img
                src={project.cover}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-[900ms] ease-precise group-hover:scale-[1.028]"
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_70%_20%,rgb(var(--accent)/0.16),transparent_60%)]" />
            )}
          </div>
          <div className="absolute left-3 top-3">
            <StatusBadge status={project.status} className="border-line/20 bg-bg/70 backdrop-blur" />
          </div>
        </div>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2.5">
              <h3 className="text-[18px] font-semibold tracking-tight text-fg transition-colors group-hover:text-accent">
                {project.title}
              </h3>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
                {project.year}
              </span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
              {project.summary}
            </p>
          </div>
          <ArrowUpRight
            className="mt-1 h-4 w-4 shrink-0 text-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
            strokeWidth={1.6}
          />
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          {project.stack.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="rounded-[3px] border border-line/[0.09] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.06em] text-faint"
            >
              {tech}
            </span>
          ))}
          {project.repo_url && (
            <span className="ml-1 inline-flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-faint">
              <GitBranch className="h-2.5 w-2.5" />
              repo
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}
