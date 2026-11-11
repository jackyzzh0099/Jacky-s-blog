import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { DangerButton, StatusPill } from "@/components/admin/bits";
import { Pagination } from "@/components/blog/pagination";
import { deletePost } from "@/lib/actions/posts";
import { listPostsForAdmin } from "@/lib/db/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Articles" };

const STATUSES = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
];

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const read = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const q = read("q") ?? "";
  const statusParam = read("status") ?? "all";
  const status = ["published", "draft", "all"].includes(statusParam)
    ? (statusParam as "published" | "draft" | "all")
    : "all";
  const page = Math.max(1, Number(read("page") ?? 1) || 1);

  const result = listPostsForAdmin({ q, status, page, perPage: 20 });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Content</p>
          <h1 className="mt-2.5 text-[24px] font-semibold tracking-tight text-fg">
            Articles
          </h1>
          <p className="mt-1.5 text-[12.5px] text-muted">
            {result.total} article{result.total === 1 ? "" : "s"} · drafts are
            excluded from every public surface
          </p>
        </div>
        <Link href="/admin/posts/new" className="btn btn-primary h-8 text-[11.5px]">
          <Plus className="h-3.5 w-3.5" />
          New article
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap items-center gap-2" action="/admin/posts">
        <label className="relative flex items-center">
          <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-faint" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search titles and content…"
            className="h-8 w-[260px] rounded-[3px] border border-line/10 bg-transparent pl-8 pr-2 text-[12px] text-fg outline-none transition-colors placeholder:text-faint focus:border-accent/40"
          />
        </label>

        <div className="flex items-center overflow-hidden rounded-[3px] border border-line/10">
          {STATUSES.map((item) => (
            <label
              key={item.value}
              className="cursor-pointer"
              title={`Show ${item.label.toLowerCase()}`}
            >
              <input
                type="radio"
                name="status"
                value={item.value}
                defaultChecked={status === item.value}
                className="peer sr-only"
              />
              <span className="block h-8 px-2.5 font-mono text-[9px] uppercase leading-8 tracking-[0.1em] text-faint transition-colors peer-checked:bg-line/[0.08] peer-checked:text-fg hover:text-fg">
                {item.label}
              </span>
            </label>
          ))}
        </div>

        <button
          type="submit"
          className="h-8 rounded-[3px] border border-line/12 px-2.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted transition-colors hover:text-fg"
        >
          Apply
        </button>
        {(q || status !== "all") && (
          <Link
            href="/admin/posts"
            className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint hover:text-fg"
          >
            Reset
          </Link>
        )}
      </form>

      <div className="mt-5 overflow-hidden rounded-sm border border-line/[0.08]">
        <table className="w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="border-b border-line/[0.08] bg-elev/40">
              <th className="label w-[46%] px-3 py-2.5 font-normal">Article</th>
              <th className="label hidden w-[150px] px-3 py-2.5 font-normal md:table-cell">
                Field
              </th>
              <th className="label hidden w-[96px] px-3 py-2.5 font-normal sm:table-cell">
                Status
              </th>
              <th className="label hidden w-[104px] px-3 py-2.5 font-normal lg:table-cell">
                Updated
              </th>
              <th className="label w-[132px] px-3 py-2.5 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((post) => (
              <tr
                key={post.id}
                className="group border-b border-line/[0.06] last:border-0 hover:bg-line/[0.02]"
              >
                <td className="overflow-hidden px-3 py-3">
                  <Link
                    href={`/admin/posts/${post.id}`}
                    className="block truncate text-[12.5px] text-fg transition-colors group-hover:text-accent"
                  >
                    {post.title || "Untitled"}
                  </Link>
                  <span className="mt-0.5 block truncate font-mono text-[9px] text-faint">
                    /blog/{post.slug}
                  </span>
                </td>
                <td className="hidden truncate px-3 py-3 font-mono text-[9.5px] uppercase tracking-[0.1em] text-faint md:table-cell">
                  {post.category?.name ?? "—"}
                </td>
                <td className="hidden px-3 py-3 sm:table-cell">
                  <StatusPill status={post.status} />
                </td>
                <td className="hidden whitespace-nowrap px-3 py-3 font-mono text-[9.5px] uppercase tracking-[0.1em] text-faint lg:table-cell">
                  {formatDate(post.updated_at)}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted transition-colors hover:text-fg"
                    >
                      Edit
                    </Link>
                    {post.status === "published" && (
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint transition-colors hover:text-fg"
                      >
                        View
                      </Link>
                    )}
                    <DangerButton
                      action={deletePost.bind(null, post.id)}
                      label="Del"
                      confirmLabel="Sure?"
                      icon={false}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {result.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-12 text-center">
                  <p className="text-[12.5px] text-muted">
                    No articles match this filter.
                  </p>
                  <Link
                    href="/admin/posts/new"
                    className="mt-2 inline-block font-mono text-[9px] uppercase tracking-[0.12em] text-accent"
                  >
                    Write a new one
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        params={{ q, status }}
        basePath="/admin/posts"
      />
    </div>
  );
}
