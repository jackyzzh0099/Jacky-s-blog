import type { Metadata } from "next";

import { FilterBar } from "@/components/blog/filter-bar";
import { Pagination } from "@/components/blog/pagination";
import { PostCard } from "@/components/blog/post-card";
import { EmptyState } from "@/components/site/empty-state";
import { PageHeader } from "@/components/site/page-header";
import { Reveal } from "@/components/site/reveal";
import {
  getCategoryBySlug,
  listCategoriesWithCounts,
  listPosts,
  listTagsWithCounts,
} from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Long-form technical writing on operating systems, distributed systems, security, machine learning, embedded hardware and photography.",
  alternates: { canonical: "/blog" },
};

const PER_PAGE = 9;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const read = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const page = Math.max(1, Number(read("page") ?? 1) || 1);
  const category = read("category");
  const tag = read("tag");
  const q = read("q");

  const result = listPosts({ page, perPage: PER_PAGE, category, tag, q });
  const categories = listCategoriesWithCounts();
  const tags = listTagsWithCounts();
  const activeCategory = category ? getCategoryBySlug(category) : null;

  const heading = activeCategory
    ? activeCategory.name
    : tag
      ? `#${tag}`
      : "All writing";

  return (
    <div className="container-page pb-10">
      <PageHeader
        eyebrow="Index / Writing"
        title={heading}
        description={
          activeCategory?.description ??
          "Everything I have published, newest first. Filter by field, tag or keyword — the URL keeps your filters, so results are shareable."
        }
        meta={
          <>
            {result.total} article{result.total === 1 ? "" : "s"}
            <br />
            {categories.length} fields · {tags.length} tags
          </>
        }
      />

      <div className="mt-8">
        <FilterBar
          categories={categories}
          tags={tags}
          showing={result.items.length}
          total={result.total}
        />
      </div>

      {result.items.length > 0 ? (
        <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((post, index) => (
            <Reveal key={post.id} delay={Math.min(index, 5) * 50}>
              <PostCard post={post} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="mt-12">
          <EmptyState
            code="0x00 / NO MATCH"
            title="Nothing matches those filters"
            description="Try a broader keyword, or clear the filters to see the full archive."
            action={{ href: "/blog", label: "Reset the archive" }}
          />
        </div>
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        params={{ category, tag, q }}
        basePath="/blog"
      />
    </div>
  );
}
