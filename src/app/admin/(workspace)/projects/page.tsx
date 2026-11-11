import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { DangerButton } from "@/components/admin/bits";
import { StatusBadge } from "@/components/projects/project-card";
import { deleteProject } from "@/lib/actions/projects";
import { listProjects } from "@/lib/db/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Projects" };

export default function AdminProjectsPage() {
  const projects = listProjects();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Content</p>
          <h1 className="mt-2.5 text-[24px] font-semibold tracking-tight text-fg">
            Projects
          </h1>
          <p className="mt-1.5 text-[12.5px] text-muted">
            {projects.length} projects · ordering is explicit, not by date
          </p>
        </div>
        <Link href="/admin/projects/new" className="btn btn-primary h-8 text-[11.5px]">
          <Plus className="h-3.5 w-3.5" />
          New project
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-sm border border-line/[0.08]">
        <table className="w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="border-b border-line/[0.08] bg-elev/40">
              <th className="label w-[40%] px-3 py-2.5 font-normal">Project</th>
              <th className="label hidden w-[100px] px-3 py-2.5 font-normal sm:table-cell">
                Status
              </th>
              <th className="label hidden px-3 py-2.5 font-normal md:table-cell">Stack</th>
              <th className="label hidden px-3 py-2.5 font-normal lg:table-cell">Year</th>
              <th className="label w-[128px] px-3 py-2.5 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr
                key={project.id}
                className="group border-b border-line/[0.06] last:border-0 hover:bg-line/[0.02]"
              >
                <td className="overflow-hidden px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-8 w-12 shrink-0 overflow-hidden rounded-[2px] border border-line/10 bg-elev">
                      {project.cover && (
                        <img
                          src={project.cover}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="block truncate text-[12.5px] text-fg transition-colors group-hover:text-accent"
                      >
                        {project.title}
                      </Link>
                      <span className="mt-0.5 block truncate font-mono text-[9px] text-faint">
                        /projects/{project.slug}
                      </span>
                    </span>
                  </div>
                </td>
                <td className="hidden px-3 py-3 sm:table-cell">
                  <StatusBadge status={project.status} />
                </td>
                <td className="hidden max-w-[220px] truncate px-3 py-3 font-mono text-[9.5px] uppercase tracking-[0.06em] text-faint md:table-cell">
                  {project.stack.join(" · ")}
                </td>
                <td className="hidden px-3 py-3 font-mono text-[9.5px] text-faint lg:table-cell">
                  {project.year}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted hover:text-fg"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/projects/${project.slug}`}
                      target="_blank"
                      className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint hover:text-fg"
                    >
                      View
                    </Link>
                    <DangerButton
                      action={deleteProject.bind(null, project.id)}
                      label="Del"
                      confirmLabel="Sure?"
                      icon={false}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-12 text-center text-[12.5px] text-muted">
                  No projects yet.{" "}
                  <Link href="/admin/projects/new" className="text-accent">
                    Add the first one
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
        Last project update {formatDate(projects[0]?.updated_at ?? null)}
      </p>
    </div>
  );
}
