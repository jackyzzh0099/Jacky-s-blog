import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { PostSummary } from "@/lib/db/types";
import { cn, formatDate, formatDateUpper } from "@/lib/utils";

function Cover({
  src,
  title,
  ratio = "aspect-[16/10]",
  className,
}: {
  src: string | null;
  title: string;
  ratio?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sm border border-line/[0.09] bg-elev",
        ratio,
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-[900ms] ease-precise group-hover:scale-[1.028]"
        />
      ) : (
        <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgb(var(--accent)/0.18),transparent_60%)]" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="pointer-events-none absolute inset-0 rounded-sm ring-1 ring-inset ring-white/[0.04]" />
    </div>
  );
}

function Meta({ post }: { post: PostSummary }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.13em] text-faint">
      <span className="text-muted">{post.category?.name ?? "Article"}</span>
      <span aria-hidden="true" className="h-2.5 w-px bg-line/15" />
      <time dateTime={post.published_at ?? post.created_at}>
        {formatDate(post.published_at ?? post.created_at)}
      </time>
      <span aria-hidden="true" className="h-2.5 w-px bg-line/15" />
      <span>{post.reading_minutes} min</span>
    </div>
  );
}

function Tags({ post, limit = 3 }: { post: PostSummary; limit?: number }) {
  if (!post.tags.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {post.tags.slice(0, limit).map((tag) => (
        <span
          key={tag.id}
          className="rounded-[3px] border border-line/[0.09] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-faint transition-colors group-hover:border-line/20 group-hover:text-muted"
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
}

export function PostCard({
  post,
  variant = "default",
  index,
}: {
  post: PostSummary;
  variant?: "default" | "lead" | "compact";
  index?: number;
}) {
  const href = `/blog/${post.slug}`;

  if (variant === "compact") {
    return (
      <Link
        href={href}
        className="group flex items-baseline gap-4 border-b border-line/[0.07] py-4 last:border-0"
      >
        {typeof index === "number" && (
          <span className="w-6 shrink-0 font-mono text-[10px] text-faint">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-medium tracking-tight text-fg transition-colors group-hover:text-accent">
            {post.title}
          </span>
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
            {post.category?.name} · {formatDate(post.published_at ?? post.created_at)}
          </span>
        </span>
        <ArrowUpRight
          className="h-3.5 w-3.5 shrink-0 text-faint opacity-0 transition-all duration-300 group-hover:-translate-y-px group-hover:translate-x-px group-hover:opacity-100"
          strokeWidth={1.7}
        />
      </Link>
    );
  }

  if (variant === "lead") {
    return (
      <article className="group relative">
        <Link href={href} className="grid gap-6 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-7">
            <Cover src={post.cover} title={post.title} ratio="aspect-[16/10]" />
          </div>
          <div className="flex flex-col justify-between md:col-span-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-accent/30 bg-accent/[0.07] px-1.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-accent">
                  <span className="h-1 w-1 rounded-full bg-accent" />
                  Featured
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-faint">
                  {formatDateUpper(post.published_at ?? post.created_at)}
                </span>
              </div>
              <h3 className="mt-4 text-[26px] font-semibold leading-[1.15] tracking-tighter text-fg transition-colors duration-300 group-hover:text-accent md:text-[30px]">
                {post.title}
              </h3>
              <p className="mt-3.5 line-clamp-3 text-[13.5px] leading-relaxed text-muted">
                {post.description}
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between gap-4 border-t border-line/[0.08] pt-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.13em] text-faint">
                <span className="text-muted">{post.category?.name}</span>
                <span className="h-2.5 w-px bg-line/15" />
                <span>{post.reading_minutes} min read</span>
              </div>
              <ArrowUpRight
                className="h-4 w-4 text-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                strokeWidth={1.6}
              />
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group relative flex flex-col">
      <Link href={href} className="flex h-full flex-col">
        <Cover src={post.cover} title={post.title} />
        <div className="flex flex-1 flex-col pt-4">
          <Meta post={post} />
          <h3 className="mt-2.5 text-[18.5px] font-semibold leading-snug tracking-tight text-fg transition-colors duration-300 group-hover:text-accent">
            {post.title}
          </h3>
          <p className="mt-2 line-clamp-2 flex-1 text-[13px] leading-relaxed text-muted">
            {post.description}
          </p>
          <div className="mt-4 flex items-end justify-between gap-3">
            <Tags post={post} />
            <ArrowUpRight
              className="h-3.5 w-3.5 shrink-0 text-faint transition-all duration-300 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-accent"
              strokeWidth={1.7}
            />
          </div>
        </div>
      </Link>
    </article>
  );
}
