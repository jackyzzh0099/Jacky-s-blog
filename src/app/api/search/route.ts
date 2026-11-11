import { NextResponse, type NextRequest } from "next/server";

import { searchEverything } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const started = Date.now();
  const query = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 120).trim();

  if (query.length < 1) {
    return NextResponse.json(
      { query, hits: [], took: 0 },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const hits = searchEverything(query, 8).map((hit) => ({
    id: hit.id,
    type: hit.type,
    title: hit.title,
    excerpt: hit.excerpt,
    href: hit.href,
    category: hit.category,
    date: hit.date,
  }));

  return NextResponse.json(
    { query, hits, took: Date.now() - started },
    { headers: { "Cache-Control": "no-store" } },
  );
}
