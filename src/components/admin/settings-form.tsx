"use client";

import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { InlineNotice } from "./bits";
import { saveSettings } from "@/lib/actions/settings";
import type { SiteSettings } from "@/lib/site";

const GROUPS: { title: string; fields: { key: keyof SiteSettings; label: string; hint?: string; area?: boolean }[] }[] = [
  {
    title: "Identity",
    fields: [
      { key: "name", label: "Site name" },
      { key: "shortName", label: "Wordmark" },
      { key: "tagline", label: "Tagline" },
      { key: "description", label: "Description", hint: "Used for SEO and social cards", area: true },
      { key: "author", label: "Author" },
      { key: "role", label: "Role" },
      { key: "location", label: "Location" },
      { key: "established", label: "Established" },
      { key: "version", label: "Version" },
      { key: "footerNote", label: "Footer note" },
    ],
  },
  {
    title: "Elsewhere",
    fields: [
      { key: "email", label: "Email" },
      { key: "github", label: "GitHub URL" },
      { key: "x", label: "X URL" },
      { key: "instagram", label: "Instagram URL" },
      { key: "rss", label: "RSS path" },
    ],
  },
];

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [values, setValues] = useState<SiteSettings>(settings);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await saveSettings(values as unknown as Record<string, string>);
          if (!result.ok) {
            setNotice({ tone: "error", text: result.error ?? "Could not save." });
            return;
          }
          setNotice({ tone: "success", text: "Settings saved and revalidated." });
          router.refresh();
        });
      }}
    >
      {notice && (
        <div className="mb-4">
          <InlineNotice tone={notice.tone}>{notice.text}</InlineNotice>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="border-b border-line/[0.08] pb-2.5 text-[13px] font-medium text-fg">
              {group.title}
            </h2>
            <div className="mt-4 space-y-3">
              {group.fields.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-1.5 flex items-baseline justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                    {field.label}
                    {field.hint && (
                      <span className="normal-case tracking-normal text-faint/70">
                        {field.hint}
                      </span>
                    )}
                  </span>
                  {field.area ? (
                    <textarea
                      value={values[field.key]}
                      onChange={(event) =>
                        setValues((prev) => ({ ...prev, [field.key]: event.target.value }))
                      }
                      rows={3}
                      className="field resize-none text-[12px]"
                    />
                  ) : (
                    <input
                      value={values[field.key]}
                      onChange={(event) =>
                        setValues((prev) => ({ ...prev, [field.key]: event.target.value }))
                      }
                      className="field h-8 text-[12px]"
                    />
                  )}
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-3 border-t border-line/[0.08] pt-4">
        <button type="submit" disabled={pending} className="btn btn-primary h-8 text-[11.5px]">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Save settings
        </button>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
          Changes apply to every page immediately
        </span>
      </div>
    </form>
  );
}
