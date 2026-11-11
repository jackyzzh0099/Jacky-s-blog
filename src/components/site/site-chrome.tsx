"use client";

import { usePathname } from "next/navigation";

import { CommandPalette } from "./command-palette";
import { Footer } from "./footer";
import { Header } from "./header";
import type { SiteSettings } from "@/lib/site";

/**
 * The public chrome (header, footer, search palette) must not render inside
 * the admin workspace, which has its own shell. Keeping the decision here
 * avoids duplicating the whole site tree into a second route group.
 */
export function SiteChrome({
  site,
  links,
  children,
}: {
  site: SiteSettings;
  links: { label: string; href: string }[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <>
      <Header siteName={site.name} shortName={site.shortName} />
      <main id="main">{children}</main>
      <Footer site={site} links={links} />
      <CommandPalette />
    </>
  );
}
