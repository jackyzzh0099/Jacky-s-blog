import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectForm } from "@/components/admin/project-form";
import { getProjectById } from "@/lib/db/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) notFound();

  return (
    <ProjectForm
      initial={{
        id: project.id,
        title: project.title,
        slug: project.slug,
        summary: project.summary,
        content: project.content,
        cover: project.cover ?? "",
        repoUrl: project.repo_url ?? "",
        demoUrl: project.demo_url ?? "",
        stack: project.stack.join(", "),
        status: project.status as "active" | "beta" | "wip" | "archived",
        year: project.year,
        featured: project.featured,
        order: project.sort_order,
      }}
    />
  );
}
