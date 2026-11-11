import { NextResponse, type NextRequest } from "next/server";

import { getMediaByKey } from "@/lib/db/queries";
import { readUpload } from "@/lib/storage";

/** Serves uploaded media from the storage adapter with locked-down headers. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const key = segments.join("/");

  if (!key || key.includes("..") || key.startsWith("/")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const record = getMediaByKey(key);
  if (!record) return new NextResponse("Not found", { status: 404 });

  const buffer = await readUpload(key);
  if (!buffer) return new NextResponse("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": record.mime,
    "Content-Length": String(buffer.byteLength),
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": `inline; filename="${record.filename.replace(/"/g, "")}"`,
  });

  // SVG can carry active content; even after sanitising, refuse to let it
  // execute by serving it under a policy that allows nothing but rendering.
  if (record.mime === "image/svg+xml") {
    headers.set(
      "Content-Security-Policy",
      "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox",
    );
  }

  return new NextResponse(new Uint8Array(buffer), { status: 200, headers });
}
