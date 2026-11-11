import Link from "next/link";
import { ArrowUpRight, FileText, Image as ImageIcon, Plus, Upload } from "lucide-react";

import { StatTile, StatusPill } from "@/components/admin/bits";
import { ActivityFeed } from "@/components/home/activity-feed";
import {
  getSiteStats,
  listMedia,
  listPostsForAdmin,
  listProjects,
  listRecentActivity,
} from "@/lib/db/queries";
import { formatDate, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default function AdminDashboard() {
  const stats = getSiteStats();
  const recent = listPostsForAdmin({ perPage: 6, status: "all" }).items;
  const projects = listProjects();
  const media = listMedia();
  const activity = listRecentActivity(6);

  const storageBytes = media.reduce((sum, item) => sum + item.size, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Overview</p>
          <h1 className="mt-2.5 text-[24px] font-semibold tracking-tight text-fg">
            Dashboard
          </h1>
          <p className="mt-1.5 text-[12.5px] text-muted">
            Last write {stats.lastUpdated ? relativeTime(stats.lastUpdated) : "never"} ·
            SQLite · local storage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/media" className="btn btn-ghost h-8 text-[11.5px]">
            <Upload className="h-3.5 w-3.5" />
            Upload media
          </Link>
          <Link href="/admin/posts/new" className="btn btn-primary h-8 text-[11.5px]">
            <Plus className="h-3.5 w-3.5" />
            New article
          </Link>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-line/[0.08] bg-line/[0.08] lg:grid-cols-4">
        <StatTile label="Published" value={stats.posts} hint={`${stats.drafts} drafts`} />
        <StatTile label="Projects" value={stats.projects} hint={`${projects.filter((p) => p.status === "active").length} active`} />
        <StatTile label="Fields" value={stats.categories} hint={`${stats.tags} tags`} />
        <StatTile
          label="Media"
          value={media.length}
          hint={`${(storageBytes / 1024 / 1024).toFixed(1)} MB stored`}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.65fr_1fr]">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-medium tracking-tight text-fg">
              Latest articles
            </h2>
            <Link
              href="/admin/posts"
              className="group inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-faint transition-colors hover:text-fg"
            >
              All articles
              <ArrowUpRight className="h-2.5 w-2.5" />
            </Link>
          </div>

          <div className="mt-3 overflow-hidden rounded-sm border border-line/[0.08]">
            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr className="border-b border-line/[0.08] bg-elev/40">
                  <th className="label w-[52%] px-3 py-2.5 font-normal">Title</th>
                  <th className="label hidden w-[92px] px-3 py-2.5 font-normal sm:table-cell">
                    Status
                  </th>
                  <th className="label hidden w-[150px] px-3 py-2.5 font-normal md:table-cell">
                    Field
                  </th>
                  <th className="label w-[104px] px-3 py-2.5 text-right font-normal">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {recent.map((post) => (
                  <tr
                    key={post.id}
                    className="group border-b border-line/[0.06] last:border-0 hover:bg-line/[0.02]"
                  >
                    <td className="overflow-hidden px-3 py-2.5">
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="block truncate text-[12.5px] text-fg/90 transition-colors group-hover:text-accent"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className="hidden px-3 py-2.5 sm:table-cell">
                      <StatusPill status={post.status} />
                    </td>
                    <td className="hidden truncate px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-faint md:table-cell">
                      {post.category?.name ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-[9.5px] uppercase tracking-[0.1em] text-faint">
                      {formatDate(post.updated_at)}
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-[12px] text-muted">
                      No articles yet.{" "}
                      <Link href="/admin/posts/new" className="text-accent">
                        Write the first one
                      </Link>
                      .
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                href: "/admin/posts/new",
                icon: FileText,
                title: "Write",
                detail: "Split editor with live preview",
              },
              {
                href: "/admin/media",
                icon: ImageIcon,
                title: "Upload",
                detail: "PNG, JPEG, WEBP, GIF, SVG",
              },
              {
                href: "/admin/settings",
                icon: ArrowUpRight,
                title: "Configure",
                detail: "Site identity and social links",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group rounded-sm border border-line/[0.08] p-3 transition-colors hover:border-line/20"
                >
                  <Icon className="h-3.5 w-3.5 text-faint transition-colors group-hover:text-accent" />
                  <p className="mt-2.5 text-[12.5px] text-fg">{card.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                    {card.detail}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-medium tracking-tight text-fg">
              Activity
            </h2>
            <Link
              href="/admin/posts"
              className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint hover:text-fg"
            >
              Log
            </Link>
          </div>
          <div className="mt-3 rounded-sm border border-line/[0.08] p-4">
            <ActivityFeed entries={activity} />
          </div>

          <div className="mt-4 rounded-sm border border-line/[0.08] bg-elev/30 p-4">
            <p className="label mb-3">Storage</p>
            <dl className="space-y-2 text-[11.5px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Database</dt>
                <dd className="font-mono text-[10.5px] text-fg">SQLite / WAL</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Uploads</dt>
                <dd className="font-mono text-[10.5px] text-fg">
                  {media.length} files · {(storageBytes / 1024 / 1024).toFixed(1)} MB
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Storage driver</dt>
                <dd className="font-mono text-[10.5px] text-fg">local</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}
