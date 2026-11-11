import type { Metadata } from "next";

import { ProjectForm } from "@/components/admin/project-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New project" };

export default function NewProjectPage() {
  return <ProjectForm initial={null} />;
}
