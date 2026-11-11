import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Github, Mail } from "lucide-react";

import { ArticleContent } from "@/components/blog/article-content";
import { PostCard } from "@/components/blog/post-card";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { ShareRow } from "@/components/blog/share-row";
import { Toc } from "@/components/blog/toc";
import { Reveal } from "@/components/site/reveal";
import { getSessionUser } from "@/lib/auth";
import {
  getAdjacentPosts,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/db/queries";
import { renderMarkdown } from "@/lib/markdown";
import { getSiteSettings } from "@/lib/site";
import { absoluteUrl, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function loadPost(slug: string, allowDraft: boolean) {
  if (allowDraft) {
    const user = await getSessionUser();
    return getPostBySlug(slug, { includeDrafts: Boolean(user) });
  }
  return getPostBySlug(slug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Article not found" };

  const url = absoluteUrl(`/blog/${post.slug}`);
  const images = post.cover ? [{ url: post.cover, alt: post.title }] : undefined;

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    keywords: post.tags.map((tag) => tag.name),
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      siteName: getSiteSettings().name,
      publishedTime: post.published_at ?? post.created_at,
      modifiedTime: post.updated_at,
      authors: [getSiteSettings().author],
      tags: post.tags.map((tag) => tag.name),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.cover ? [post.cover] : undefined,
    },
  };
}

export default async function ArticlePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const preview = sp.preview === "1";

  const post = await loadPost(slug, preview);
  if (!post) notFound();

  const site = getSiteSettings();
  const doc = await renderMarkdown(post.content);
  const { prev, next } = getAdjacentPosts(post);
  const related = getRelatedPosts(post, 3);
  const isDraft = post.status === "draft";
  const url = absoluteUrl(`/blog/${post.slug}`);

  const meta = [
    { label: "Author", value: site.author },
    { label: "Published", value: formatDate(post.published_at ?? post.created_at) },
    { label: "Updated", value: formatDate(post.updated_at) },
    { label: "Reading", value: `${post.reading_minutes} min` },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    author: { "@type": "Person", name: site.author, url: absoluteUrl("/about") },
    publisher: { "@type": "Person", name: site.author },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: post.cover ? absoluteUrl(post.cover) : undefined,
    keywords: post.tags.map((tag) => tag.name).join(", "),
    articleSection: post.category?.name,
    wordCount: post.content.split(/\s+/).length,
  };

  return (
    <>
      <ReadingProgress />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="container-page">
        <header className="pb-8 pt-10 md:pt-14">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint"
          >
            <Link href="/blog" className="transition-colors hover:text-fg">
              Writing
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/blog?category=${post.category?.slug ?? ""}`}
              className="text-muted transition-colors hover:text-fg"
            >
              {post.category?.name ?? "Article"}
            </Link>
            {isDraft && (
              <span className="ml-1 rounded-[2px] border border-signal/40 px-1 py-0.5 text-signal">
                draft preview
              </span>
            )}
          </nav>

          <h1 className="mt-6 max-w-[24ch] text-[clamp(2.05rem,4.6vw,3.35rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-fg">
            {post.title}
          </h1>

          <p className="mt-5 max-w-[62ch] text-[15px] leading-[1.7] text-muted md:text-[16px]">
            {post.description}
          </p>

          <dl className="mt-9 grid grid-cols-2 gap-y-5 border-t border-line/[0.09] pt-5 sm:grid-cols-4 sm:gap-0">
            {meta.map((item, index) => (
              <div
                key={item.label}
                className={
                  index > 0 ? "sm:border-l sm:border-line/[0.08] sm:pl-5" : "sm:pr-5"
                }
              >
                <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                  {item.label}
                </dt>
                <dd className="mt-1.5 text-[12.5px] text-fg/90">{item.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            {post.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/blog?tag=${tag.slug}`}
                className="rounded-[3px] border border-line/[0.09] px-1.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-faint transition-colors hover:border-line/25 hover:text-fg"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </header>

        {post.cover && (
          <figure className="relative overflow-hidden rounded-sm border border-line/[0.09] bg-elev">
            <img
              src={post.cover}
              alt=""
              className="aspect-[2/1] max-h-[440px] w-full object-cover"
              fetchPriority="high"
            />
            <figcaption className="absolute bottom-3 right-4 font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">
              Fig. 01 — {post.category?.name ?? "Cover"}
            </figcaption>
          </figure>
        )}

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-16">
          <div className="min-w-0 max-w-[720px]">
            <Toc items={doc.toc} variant="inline" />
            <ArticleContent parts={doc.parts} readingMinutes={post.reading_minutes} />

            <div className="mt-14 border-t border-line/[0.09] pt-6">
              <ShareRow url={url} title={post.title} />
            </div>

            <div className="mt-10 flex flex-col gap-4 rounded-sm border border-line/[0.09] bg-elev/40 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                  Written by
                </p>
                <p className="mt-1.5 text-[14px] font-medium text-fg">{site.author}</p>
                <p className="mt-1 text-[12px] text-muted">{site.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={site.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-[3px] border border-line/10 px-2.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted transition-colors hover:border-line/25 hover:text-fg"
                >
                  <Github className="h-3 w-3" />
                  GitHub
                </a>
                <a
                  href={`mailto:${site.email}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[3px] border border-line/10 px-2.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted transition-colors hover:border-line/25 hover:text-fg"
                >
                  <Mail className="h-3 w-3" />
                  Email
                </a>
              </div>
            </div>

            {(prev || next) && (
              <nav
                aria-label="Adjacent articles"
                className="mt-12 grid gap-4 border-t border-line/[0.09] pt-6 sm:grid-cols-2"
              >
                {prev ? (
                  <Link
                    href={`/blog/${prev.slug}`}
                    className="group flex flex-col gap-2 border border-line/[0.07] p-4 transition-colors hover:border-line/20"
                  >
                    <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                      <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
                      Newer
                    </span>
                    <span className="text-[13.5px] font-medium leading-snug text-fg transition-colors group-hover:text-accent">
                      {prev.title}
                    </span>
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link
                    href={`/blog/${next.slug}`}
                    className="group flex flex-col items-end gap-2 border border-line/[0.07] p-4 text-right transition-colors hover:border-line/20"
                  >
                    <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                      Older
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <span className="text-[13.5px] font-medium leading-snug text-fg transition-colors group-hover:text-accent">
                      {next.title}
                    </span>
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </div>

          <aside className="relative hidden lg:block">
            <Toc items={doc.toc} />
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section className="container-page mt-24">
          <Reveal>
            <div className="border-t border-line/[0.09] pt-5">
              <div className="flex items-baseline gap-4">
                <span className="label">Related</span>
                <h2 className="text-[20px] font-semibold tracking-tight text-fg">
                  Keep reading
                </h2>
              </div>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item, index) => (
              <Reveal key={item.id} delay={index * 60}>
                <PostCard post={item} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
