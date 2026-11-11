import type { Metadata } from "next";

import { MediaLibrary } from "@/components/admin/media-library";
import { listMedia } from "@/lib/db/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Media" };

export default function AdminMediaPage() {
  return <MediaLibrary initialItems={listMedia()} />;
}
