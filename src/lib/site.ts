import { readSettings } from "./db/queries";

export interface SocialLink {
  label: string;
  href: string;
}

export interface SiteSettings {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  author: string;
  role: string;
  location: string;
  email: string;
  github: string;
  x: string;
  instagram: string;
  rss: string;
  established: string;
  version: string;
  footerNote: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  name: "Jacky's Blog",
  shortName: "Jacky",
  tagline: "Exploring the foundations of technology.",
  description:
    "A working notebook on computer science, systems security, machine learning, embedded hardware and the craft of building software — written by Jacky.",
  author: "Jacky",
  role: "Systems engineer · CS student",
  location: "Shenzhen, CN",
  email: "hello@jacky.dev",
  github: "https://github.com/jacky",
  x: "https://x.com/jacky",
  instagram: "https://instagram.com/jacky",
  rss: "/feed.xml",
  established: "2026",
  version: "1.0.0",
  footerNote: "Built from scratch. No template, no page builder.",
};

const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[];

/** Defaults merged with values edited in /admin/settings. */
export function getSiteSettings(): SiteSettings {
  let stored: Record<string, string> = {};
  try {
    stored = readSettings();
  } catch {
    stored = {};
  }

  const merged = { ...DEFAULT_SETTINGS };
  for (const key of SETTING_KEYS) {
    const value = stored[key];
    if (typeof value === "string" && value.trim().length > 0) {
      merged[key] = value;
    }
  }
  return merged;
}

export function socialLinks(settings: SiteSettings): SocialLink[] {
  return [
    { label: "GitHub", href: settings.github },
    { label: "X", href: settings.x },
    { label: "Instagram", href: settings.instagram },
    { label: "Email", href: `mailto:${settings.email}` },
    { label: "RSS", href: settings.rss },
  ].filter((link) => Boolean(link.href));
}

