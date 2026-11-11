import type { Metadata } from "next";

import { PasswordForm } from "@/components/admin/password-form";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSiteStats } from "@/lib/db/queries";
import { getSiteSettings } from "@/lib/site";
import { resolveDatabasePath } from "@/lib/db/client";
import { getStorageRoot } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings" };

export default function AdminSettingsPage() {
  const site = getSiteSettings();
  const stats = getSiteStats();

  return (
    <div>
      <div>
        <p className="label">Configuration</p>
        <h1 className="mt-2.5 text-[24px] font-semibold tracking-tight text-fg">
          Settings
        </h1>
        <p className="mt-1.5 max-w-[62ch] text-[12.5px] leading-relaxed text-muted">
          Identity and contact details live in the database, so they can change
          without a deploy. Environment-level configuration (database path, storage
          root, upload limits) stays in <span className="font-mono text-fg">.env</span>.
        </p>
      </div>

      <div className="mt-7">
        <SettingsForm settings={site} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <PasswordForm />
        </div>

        <div>
          <h2 className="border-b border-line/[0.08] pb-2.5 text-[13px] font-medium text-fg">
            Runtime
          </h2>
          <dl className="mt-4 space-y-2.5 text-[11.5px]">
            {[
              { k: "Database", v: resolveDatabasePath() },
              { k: "Storage root", v: getStorageRoot() },
              { k: "Upload limit", v: `${process.env.MAX_UPLOAD_MB ?? 8} MB` },
              { k: "Media base URL", v: process.env.MEDIA_PUBLIC_BASE_URL || "/api/media" },
              { k: "Node environment", v: process.env.NODE_ENV ?? "development" },
              { k: "Published articles", v: String(stats.posts) },
              { k: "Drafts", v: String(stats.drafts) },
              { k: "Projects", v: String(stats.projects) },
            ].map((row) => (
              <div
                key={row.k}
                className="flex items-baseline justify-between gap-4 border-b border-line/[0.06] pb-2"
              >
                <dt className="shrink-0 text-muted">{row.k}</dt>
                <dd className="truncate text-right font-mono text-[10px] text-fg" title={row.v}>
                  {row.v}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 border border-line/[0.08] bg-elev/30 p-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
              Backup
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
              Copy <span className="font-mono text-fg/90">storage/</span> as a single
              unit — the SQLite file and the uploads directory must stay in sync.
              <br />
              <span className="font-mono text-[10.5px] text-faint">
                tar -czf jacky-backup-$(date +%F).tgz storage/
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
