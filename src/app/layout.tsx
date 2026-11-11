import type { Metadata, Viewport } from "next";

import "./globals.css";
import "katex/dist/katex.min.css";

import { SiteChrome } from "@/components/site/site-chrome";
import { getSiteSettings, socialLinks } from "@/lib/site";
import { absoluteUrl } from "@/lib/utils";

const themeScript = `
(function() {
  try {
    var param = new URLSearchParams(location.search).get('theme');
    if (param === 'light' || param === 'dark') localStorage.setItem('jb-theme', param);
    var stored = localStorage.getItem('jb-theme');
    var prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    var theme = stored || (prefersLight ? 'light' : 'dark');
    var root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.dataset.theme = theme;
  } catch (e) {}
})();
`;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08090B" },
    { media: "(prefers-color-scheme: light)", color: "#FAFAF7" },
  ],
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const site = getSiteSettings();
  const url = absoluteUrl("/");

  return {
    metadataBase: new URL(url),
    title: {
      default: `${site.name} — ${site.tagline}`,
      template: `%s — ${site.name}`,
    },
    description: site.description,
    applicationName: site.name,
    authors: [{ name: site.author, url: absoluteUrl("/about") }],
    creator: site.author,
    keywords: [
      "computer science",
      "systems programming",
      "cybersecurity",
      "machine learning",
      "embedded systems",
      "photography",
      "technical blog",
    ],
    alternates: {
      canonical: "/",
      types: { "application/rss+xml": "/feed.xml" },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: site.name,
      title: `${site.name} — ${site.tagline}`,
      description: site.description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${site.name} — ${site.tagline}`,
      description: site.description,
      creator: "@jacky",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const site = getSiteSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..700;1,14..32,400..500&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+SC:wght@400;500;700&display=swap"
        />
      </head>
      <body className="min-h-screen bg-bg text-fg antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-fg focus:px-4 focus:py-2 focus:text-sm focus:text-bg"
        >
          Skip to content
        </a>

        <SiteChrome site={site} links={socialLinks(site)}>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
