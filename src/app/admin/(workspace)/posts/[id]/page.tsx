import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PostEditor, type EditorPost } from "@/components/admin/post-editor";
import {
  getPostById,
  listCategories,
  listTagsWithCounts,
} from "@/lib/db/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit article" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = getPostById(id);
  if (!post) notFound();

  const categories = listCategories().map((category) => ({
    id: category.id,
    name: category.name,
  }));

  const initial: EditorPost = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    description: post.description,
    content: post.content,
    categoryId: post.category_id ?? "",
    tags: post.tags.map((tag) => tag.name),
    cover: post.cover ?? "",
    featured: post.featured,
    status: post.status,
    publishedAt: (post.published_at ?? post.created_at).slice(0, 10),
    updatedAt: post.updated_at,
  };

  return (
    <PostEditor
      initial={initial}
      categories={categories}
      tagSuggestions={listTagsWithCounts()
        .slice(0, 40)
        .map((tag) => tag.name)}
    />
  );
}
