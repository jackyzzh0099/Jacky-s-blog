import Link from "next/link";

const SUGGESTIONS = [
  { href: "/blog", label: "Writing", hint: "Every article, filtered by field" },
  { href: "/projects", label: "Projects", hint: "Five builds, documented" },
  { href: "/archive", label: "Archive", hint: "The chronology" },
];

export default function NotFound() {
  return (
    <div className="container-page relative flex min-h-[72vh] flex-col justify-center py-20">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] grid-backdrop opacity-70"
        aria-hidden="true"
      />
      <div className="relative">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
          Error 404 / Route not found
        </p>
        <h1 className="mt-6 max-w-[16ch] text-[clamp(2.6rem,8vw,5.4rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-fg">
          Lost in the <span className="text-muted">/dev/null.</span>
        </h1>
        <p className="mt-6 max-w-[46ch] text-[14px] leading-[1.75] text-muted">
          This page was dereferenced. The link may be stale, or the route may
          never have existed — both happen. These are known-good addresses.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {SUGGESTIONS.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col justify-between border-t border-line/[0.12] pt-4"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[9.5px] text-faint">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint opacity-0 transition-opacity group-hover:opacity-100">
                  ↗
                </span>
              </div>
              <div className="mt-6">
                <p className="text-[15px] font-medium text-fg transition-colors group-hover:text-accent">
                  {item.label}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                  {item.hint}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link href="/" className="btn btn-primary h-9 text-[12px]">
            Back to the index
          </Link>
          <Link href="/search" className="btn btn-ghost h-9 text-[12px]">
            Search the site
          </Link>
        </div>
      </div>
    </div>
  );
}
