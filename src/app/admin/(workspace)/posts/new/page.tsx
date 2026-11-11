import type { Metadata } from "next";

import { PostEditor } from "@/components/admin/post-editor";
import { listCategories, listTagsWithCounts } from "@/lib/db/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New article" };

export default function NewPostPage() {
  const categories = listCategories().map((category) => ({
    id: category.id,
    name: category.name,
  }));
  const tags = listTagsWithCounts()
    .slice(0, 40)
    .map((tag) => tag.name);

  return <PostEditor initial={null} categories={categories} tagSuggestions={tags} />;
}
