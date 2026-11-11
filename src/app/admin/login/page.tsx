import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { Mark } from "@/components/site/mark";
import { getSessionUser } from "@/lib/auth";
import { getSiteStats } from "@/lib/db/queries";
import { getSiteSettings } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/admin");

  const site = getSiteSettings();
  let stats = { posts: 0, drafts: 0, projects: 0, categories: 0, tags: 0 };
  try {
    stats = getSiteStats();
  } catch {
    /* database may not be initialised yet */
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-line/[0.07] p-10 lg:flex">
        <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-60" />
        <div className="noise" aria-hidden="true" />

        <Link href="/" className="relative flex items-center gap-2.5">
          <Mark className="text-fg" />
          <span className="text-[15px] font-semibold tracking-tight text-fg">
            {site.name}
          </span>
        </Link>

        <div className="relative max-w-[42ch]">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
            Content workspace / restricted
          </p>
          <p className="mt-5 text-[26px] leading-[1.35] tracking-[-0.02em] text-fg">
            A writing environment, not a page builder. Markdown in, sanitised
            HTML out, with the database as the only source of truth.
          </p>
          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-line/[0.09] pt-5">
            {[
              { k: "Articles", v: stats.posts },
              { k: "Drafts", v: stats.drafts },
              { k: "Projects", v: stats.projects },
            ].map((item) => (
              <div key={item.k}>
                <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                  {item.k}
                </dt>
                <dd className="mt-1.5 text-[18px] tabular text-fg">
                  {String(item.v).padStart(2, "0")}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="relative font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
          v{site.version} · SQLite · local-first
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <LoginForm />
      </div>
    </div>
  );
}
