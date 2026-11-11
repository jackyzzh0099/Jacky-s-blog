import { listAllPublishedDeep, listProjects } from "@/lib/db/queries";
import { absoluteUrl } from "@/lib/utils";

/**
 * Served as a route handler rather than the `sitemap.ts` metadata convention:
 * the metadata loader mis-handles project paths containing an apostrophe.
 */
export const dynamic = "force-dynamic";

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export function GET() {
  const posts = listAllPublishedDeep();
  const projects = listProjects();

  const urls: { loc: string; lastmod: string; priority: string; changefreq: string }[] = [
    { loc: absoluteUrl("/"), lastmod: new Date().toISOString(), priority: "1.0", changefreq: "daily" },
    { loc: absoluteUrl("/blog"), lastmod: new Date().toISOString(), priority: "0.9", changefreq: "daily" },
    { loc: absoluteUrl("/projects"), lastmod: new Date().toISOString(), priority: "0.8", changefreq: "weekly" },
    { loc: absoluteUrl("/archive"), lastmod: new Date().toISOString(), priority: "0.6", changefreq: "weekly" },
    { loc: absoluteUrl("/about"), lastmod: new Date().toISOString(), priority: "0.6", changefreq: "monthly" },
    ...posts.map((post) => ({
      loc: absoluteUrl(`/blog/${post.slug}`),
      lastmod: new Date(post.updated_at).toISOString(),
      priority: post.featured ? "0.85" : "0.7",
      changefreq: "monthly",
    })),
    ...projects.map((project) => ({
      loc: absoluteUrl(`/projects/${project.slug}`),
      lastmod: new Date(project.updated_at).toISOString(),
      priority: "0.65",
      changefreq: "monthly",
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
