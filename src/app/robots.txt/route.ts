import { absoluteUrl } from "@/lib/utils";

export function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/

Sitemap: ${absoluteUrl("/sitemap.xml")}
Host: ${absoluteUrl("/")}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
