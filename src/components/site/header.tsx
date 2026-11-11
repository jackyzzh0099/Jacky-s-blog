"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Mark, Wordmark } from "./mark";
import { ThemeToggle } from "./theme-toggle";
import { NAV_LINKS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Header({
  siteName,
  shortName,
}: {
  siteName: string;
  shortName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const openSearch = () =>
    window.dispatchEvent(new CustomEvent("jb:open-search"));

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-line/[0.07] transition-colors duration-300",
        scrolled
          ? "bg-bg/85 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/70"
          : "bg-bg/40 backdrop-blur-sm",
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          aria-label={`${siteName} — home`}
        >
          <Mark className="text-fg transition-colors duration-300 group-hover:text-accent" />
          <Wordmark shortName={shortName} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative px-3 py-2 text-[13px] transition-colors duration-200",
                isActive(link.href)
                  ? "text-fg"
                  : "text-muted hover:text-fg",
              )}
            >
              {isActive(link.href) && (
                <span className="absolute left-1 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-accent" />
              )}
              <span className={isActive(link.href) ? "pl-2.5" : ""}>
                {link.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={openSearch}
            className="group hidden h-9 items-center gap-2 rounded-sm border border-line/10 pl-2.5 pr-2 text-muted transition-colors hover:border-line/20 hover:text-fg sm:flex"
            aria-label="Search the site"
          >
            <Search className="h-[13px] w-[13px]" strokeWidth={1.7} />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em]">
              Search
            </span>
            <kbd className="ml-1 rounded-[3px] border border-line/10 px-1 py-0.5 font-mono text-[9px] leading-none text-faint group-hover:text-muted">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={openSearch}
            className="flex h-9 w-9 items-center justify-center rounded-sm text-muted transition-colors hover:text-fg sm:hidden"
            aria-label="Search"
          >
            <Search className="h-4 w-4" strokeWidth={1.7} />
          </button>

          <ThemeToggle />

          <Link
            href="/admin"
            className="hidden h-9 items-center rounded-sm px-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint transition-colors hover:text-fg md:flex"
          >
            Admin
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="relative flex h-9 w-9 items-center justify-center rounded-sm text-fg md:hidden"
          >
            <span className="sr-only">Menu</span>
            <span className="flex h-3 w-4 flex-col justify-between">
              <span
                className={cn(
                  "h-px w-full bg-current transition-transform duration-300",
                  open && "translate-y-[5.5px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "h-px w-full bg-current transition-opacity duration-200",
                  open && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "h-px w-full bg-current transition-transform duration-300",
                  open && "-translate-y-[5.5px] -rotate-45",
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-nav"
          className="border-t border-line/[0.07] bg-bg/95 backdrop-blur-xl md:hidden"
        >
          <nav className="container-page flex flex-col py-2" aria-label="Mobile">
            {[{ href: "/", label: "Home" }, ...NAV_LINKS].map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between border-b border-line/[0.06] py-3.5 text-[15px] text-fg last:border-0"
              >
                <span>{link.label}</span>
                <span className="font-mono text-[10px] text-faint">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </Link>
            ))}
            <div className="flex items-center justify-between py-4">
              <Link
                href="/admin"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted"
              >
                Admin workspace
              </Link>
              <span className="font-mono text-[10px] text-faint">⌘K search</span>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
