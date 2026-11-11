"use client";

import {
  ExternalLink,
  FileText,
  FolderGit2,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Tags,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { logoutAction } from "@/lib/actions/auth";
import { Mark } from "@/components/site/mark";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { cn } from "@/lib/utils";

const GROUPS = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/posts", label: "Articles", icon: FileText },
      { href: "/admin/posts/new", label: "New article", icon: Plus },
      { href: "/admin/projects", label: "Projects", icon: FolderGit2 },
    ],
  },
  {
    label: "Library",
    items: [
      { href: "/admin/media", label: "Media", icon: ImageIcon },
      { href: "/admin/taxonomy", label: "Fields & tags", icon: Tags },
    ],
  },
  {
    label: "Configuration",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

function crumbs(path: string): string[] {
  const parts = path.replace(/^\/admin\/?/, "").split("/").filter(Boolean);
  if (parts.length === 0) return ["Dashboard"];
  return parts.map((part) =>
    part.length > 12 && part.includes("-") ? "Edit" : part.replace(/-/g, " "),
  );
}

export function AdminShell({
  children,
  user,
  siteName,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
  siteName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const trail = crumbs(pathname);

  useEffect(() => setOpen(false), [pathname]);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/admin/posts/new") return pathname === "/admin/posts/new";
    if (href === "/admin/posts")
      return pathname === "/admin/posts" || /^\/admin\/posts\/[^/]+$/.test(pathname);
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[236px] flex-col border-r border-line/[0.07] bg-elev/50 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-line/[0.07] px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <Mark className="h-[18px] w-[18px] text-fg" />
            <span className="text-[13px] font-semibold tracking-tight text-fg">
              Workspace
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-faint lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Workspace">
          {GROUPS.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="label px-2 pb-2">{group.label}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "relative flex items-center gap-2.5 rounded-[3px] px-2 py-[7px] text-[12.5px] transition-colors",
                          active
                            ? "bg-line/[0.06] text-fg"
                            : "text-muted hover:bg-line/[0.03] hover:text-fg",
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-3.5 w-px -translate-y-1/2 bg-accent" />
                        )}
                        <Icon
                          className={cn(
                            "h-3.5 w-3.5",
                            active ? "text-accent" : "text-faint",
                          )}
                          strokeWidth={1.7}
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-line/[0.07] p-3">
          <Link
            href="/"
            className="flex items-center justify-between rounded-[3px] px-2 py-2 text-[12px] text-muted transition-colors hover:bg-line/[0.04] hover:text-fg"
          >
            View site
            <ExternalLink className="h-3 w-3" />
          </Link>
          <div className="mt-1 flex items-center justify-between rounded-[3px] px-2 py-2">
            <div className="min-w-0">
              <p className="truncate text-[12px] text-fg">{user.name}</p>
              <p className="truncate font-mono text-[9px] text-faint">{user.email}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex h-7 w-7 items-center justify-center rounded-[3px] text-faint transition-colors hover:bg-line/[0.06] hover:text-fg"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* Main */}
      <div className="lg:pl-[236px]">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-line/[0.07] bg-bg/85 px-4 backdrop-blur-xl md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-muted lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint"
            >
              <span className="text-muted">{siteName}</span>
              {trail.map((part) => (
                <span key={part} className="flex items-center gap-2">
                  <span aria-hidden="true">/</span>
                  <span className="truncate text-fg/80">{part}</span>
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle compact />
            <Link
              href="/admin/posts/new"
              className="ml-1 hidden h-8 items-center gap-1.5 rounded-[3px] bg-fg px-2.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-bg transition-colors hover:bg-accent hover:text-white sm:flex"
            >
              <Plus className="h-3 w-3" />
              New
            </Link>
          </div>
        </header>

        <div className="px-4 py-6 md:px-6 md:py-8">{children}</div>
      </div>
    </div>
  );
}
