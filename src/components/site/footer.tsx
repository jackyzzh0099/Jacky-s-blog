import { ArrowUpRight, Rss } from "lucide-react";
import Link from "next/link";

import { Mark } from "./mark";
import { NAV_LINKS } from "@/lib/nav";
import type { SiteSettings } from "@/lib/site";

const RESOURCES = [
  { href: "/blog", label: "All writing" },
  { href: "/archive", label: "Chronology" },
  { href: "/projects", label: "Selected work" },
  { href: "/feed.xml", label: "RSS feed" },
  { href: "/sitemap.xml", label: "Sitemap" },
];

export function Footer({
  site,
  links,
}: {
  site: SiteSettings;
  links: { label: string; href: string }[];
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-28 overflow-hidden border-t border-line/[0.08] bg-elev/40">
      <div className="noise" aria-hidden="true" />

      <div className="container-page relative">
        <div className="grid gap-12 py-16 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <Link href="/" className="flex items-center gap-2.5">
              <Mark className="text-fg" />
              <span className="text-[15px] font-semibold tracking-tight">
                {site.name}
              </span>
            </Link>
            <p className="mt-5 max-w-[34ch] text-[13.5px] leading-relaxed text-muted">
              {site.description}
            </p>
            <a
              href={`mailto:${site.email}`}
              className="link-line mt-6 inline-block font-mono text-[11.5px] tracking-[0.04em] text-fg"
            >
              {site.email}
            </a>
          </div>

          <div className="md:col-span-3 md:col-start-7">
            <p className="label mb-4">Navigate</p>
            <ul className="space-y-2.5">
              {[{ href: "/", label: "Index" }, ...NAV_LINKS].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-muted transition-colors hover:text-fg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="label mb-4">Elsewhere</p>
            <ul className="space-y-2.5">
              {links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1 text-[13px] text-muted transition-colors hover:text-fg"
                  >
                    {link.label}
                    <ArrowUpRight
                      className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60"
                      strokeWidth={1.8}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="label mb-4">System</p>
            <ul className="space-y-2.5">
              {RESOURCES.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-muted transition-colors hover:text-fg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-line/[0.07] py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            <span>© {year} {site.author}</span>
            <span className="hidden h-2.5 w-px bg-line/15 sm:block" />
            <span>v{site.version}</span>
            <span className="hidden h-2.5 w-px bg-line/15 sm:block" />
            <span>Est. {site.established}</span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="/feed.xml"
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint transition-colors hover:text-fg"
            >
              <Rss className="h-3 w-3" strokeWidth={1.8} />
              RSS
            </a>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              {site.footerNote}
            </span>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none select-none px-6 pb-2 text-center font-semibold leading-[0.8] tracking-tightest text-fg/[0.028]"
        style={{ fontSize: "clamp(3rem, 15vw, 13rem)" }}
      >
        {site.shortName.toUpperCase()}
      </div>
    </footer>
  );
}
