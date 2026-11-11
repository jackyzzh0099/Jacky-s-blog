import { requireUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/shell";
import { getSiteSettings } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { default: "Workspace", template: "%s — Workspace" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const site = getSiteSettings();

  return (
    <AdminShell
      user={{ name: user.name, email: user.email }}
      siteName={site.shortName}
    >
      {children}
    </AdminShell>
  );
}
