import type { Metadata } from "next";

import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { listCategoriesWithCounts, listTagsWithCounts } from "@/lib/db/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Fields & tags" };

export default function AdminTaxonomyPage() {
  return (
    <TaxonomyManager
      categories={listCategoriesWithCounts()}
      tags={listTagsWithCounts()}
    />
  );
}
