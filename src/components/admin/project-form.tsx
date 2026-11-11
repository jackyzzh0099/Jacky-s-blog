"use client";

import { Check, ImagePlus, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { DangerButton, InlineNotice } from "./bits";
import { MediaPicker } from "./media-picker";
import { Mermaid } from "@/components/blog/mermaid";
import { deleteProject, saveProject } from "@/lib/actions/projects";
import { previewMarkdown } from "@/lib/actions/posts";
import type { RenderedPart } from "@/lib/markdown";
import { cn } from "@/lib/utils";

export interface ProjectFormValues {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  cover: string;
  repoUrl: string;
  demoUrl: string;
  stack: string;
  status: "active" | "beta" | "wip" | "archived";
  year: string;
  featured: boolean;
  order: number;
}

const STATUSES: ProjectFormValues["status"][] = ["active", "beta", "wip", "archived"];

export function ProjectForm({ initial }: { initial: ProjectFormValues | null }) {
  const router = useRouter();
  const [form, setForm] = useState<ProjectFormValues>(
    initial ?? {
      title: "",
      slug: "",
      summary: "",
      content: "",
      cover: "",
      repoUrl: "",
      demoUrl: "",
      stack: "",
      status: "active",
      year: String(new Date().getFullYear()),
      featured: false,
      order: 99,
    },
  );
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [preview, setPreview] = useState<RenderedPart[] | null>(null);
  const [picker, setPicker] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error" | "neutral"; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (tab !== "preview") return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const result = await previewMarkdown(form.content);
      if (!cancelled) setPreview(result.ok && result.parts ? result.parts : null);
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [tab, form.content]);

  function submit() {
    startTransition(async () => {
      const result = await saveProject({
        id: form.id,
        title: form.title,
        slug: form.slug || form.title,
        summary: form.summary,
        content: form.content,
        cover: form.cover || null,
        repoUrl: form.repoUrl || null,
        demoUrl: form.demoUrl || null,
        stack: form.stack
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        status: form.status,
        year: form.year,
        featured: form.featured,
        order: Number(form.order) || 99,
      });

      if (!result.ok) {
        setNotice({ tone: "error", text: result.error });
        return;
      }
      setNotice({ tone: "success", text: "Saved and revalidated." });
      setForm((prev) => ({ ...prev, id: result.id, slug: result.slug }));
      if (!form.id) router.replace(`/admin/projects/${result.id}`);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/projects"
            className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint hover:text-fg"
          >
            ← Projects
          </Link>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
            {form.id ? "Edit" : "New"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {form.id && (
            <Link
              href={`/projects/${form.slug}`}
              target="_blank"
              className="inline-flex h-7 items-center gap-1.5 rounded-[3px] border border-line/12 px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted hover:text-fg"
            >
              View
            </Link>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="inline-flex h-7 items-center gap-1.5 rounded-[3px] bg-fg px-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-bg transition-colors hover:bg-accent hover:text-white disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Save project
          </button>
        </div>
      </div>

      <input
        value={form.title}
        onChange={(event) => set("title", event.target.value)}
        placeholder="Project name"
        className="mt-6 w-full bg-transparent text-[clamp(1.6rem,3vw,2.2rem)] font-semibold tracking-[-0.03em] text-fg outline-none placeholder:text-faint/50"
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 overflow-hidden rounded-sm border border-line/[0.09]">
          <div className="flex items-center justify-between border-b border-line/[0.07] px-2 py-1.5">
            <div className="flex">
              {(["write", "preview"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={cn(
                    "h-6 px-2 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors",
                    tab === item ? "bg-line/[0.08] text-fg" : "text-faint hover:text-fg",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <span className="pr-1 font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
              Markdown
            </span>
          </div>

          {tab === "write" ? (
            <textarea
              value={form.content}
              onChange={(event) => set("content", event.target.value)}
              placeholder={"## Overview\n\nWhat it does, why it exists, what it taught you."}
              className="md-editor min-h-[48vh]"
            />
          ) : (
            <div className="max-h-[70vh] min-h-[48vh] overflow-y-auto px-5 py-4">
              {preview ? (
                <div className="prose-jb text-[13.5px]">
                  {preview.map((part, index) =>
                    part.type === "html" ? (
                      <div key={index} dangerouslySetInnerHTML={{ __html: part.html ?? "" }} />
                    ) : (
                      <Mermaid key={`m-${index}`} code={part.code ?? ""} />
                    ),
                  )}
                </div>
              ) : (
                <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
                  Rendering…
                </p>
              )}
            </div>
          )}
        </div>

        <div className="self-start xl:sticky xl:top-20">
          <div className="rounded-sm border border-line/[0.09] p-4">
            <p className="label mb-4">Details</p>

            <label className="mb-3 block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                Slug
              </span>
              <input
                value={form.slug}
                onChange={(event) => set("slug", event.target.value)}
                placeholder="auto from name"
                className="field h-8 text-[11px]"
              />
            </label>

            <label className="mb-3 block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                Summary
              </span>
              <textarea
                value={form.summary}
                onChange={(event) => set("summary", event.target.value)}
                rows={3}
                className="field resize-none text-[12px]"
                placeholder="One sentence that survives being quoted."
              />
            </label>

            <label className="mb-3 block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                Stack (comma separated)
              </span>
              <input
                value={form.stack}
                onChange={(event) => set("stack", event.target.value)}
                placeholder="Rust, eBPF, OpenTelemetry"
                className="field h-8 text-[12px]"
              />
            </label>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                  Status
                </span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    set("status", event.target.value as ProjectFormValues["status"])
                  }
                  className="field h-8 text-[12px]"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                  Year
                </span>
                <input
                  value={form.year}
                  onChange={(event) => set("year", event.target.value)}
                  className="field h-8 text-[12px]"
                />
              </label>
            </div>

            <label className="mb-3 block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                Repository URL
              </span>
              <input
                value={form.repoUrl}
                onChange={(event) => set("repoUrl", event.target.value)}
                placeholder="https://github.com/…"
                className="field h-8 text-[11px]"
              />
            </label>

            <label className="mb-3 block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                Demo URL
              </span>
              <input
                value={form.demoUrl}
                onChange={(event) => set("demoUrl", event.target.value)}
                placeholder="https://…"
                className="field h-8 text-[11px]"
              />
            </label>

            <div className="mb-3">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                Cover
              </span>
              <div className="flex items-center gap-2">
                <div className="h-10 w-16 shrink-0 overflow-hidden rounded-[2px] border border-line/10 bg-elev">
                  {form.cover && (
                    <img src={form.cover} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <input
                  value={form.cover}
                  onChange={(event) => set("cover", event.target.value)}
                  placeholder="/covers/atlas.svg"
                  className="field h-8 min-w-0 flex-1 text-[11px]"
                />
              </div>
              <button
                type="button"
                onClick={() => setPicker(true)}
                className="mt-2 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-faint hover:text-fg"
              >
                <ImagePlus className="h-3 w-3" />
                Pick from library
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-line/[0.07] pt-3">
              <label className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
                  Featured
                </span>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) => set("featured", event.target.checked)}
                  className="h-3.5 w-3.5 accent-[rgb(var(--accent))]"
                />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
                  Order
                </span>
                <input
                  type="number"
                  value={form.order}
                  onChange={(event) => set("order", Number(event.target.value))}
                  className="field h-7 w-14 px-1 text-[11px]"
                />
              </label>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {notice && <InlineNotice tone={notice.tone}>{notice.text}</InlineNotice>}
            {form.id && (
              <div className="border border-line/[0.09] px-3 py-2">
                <DangerButton
                  action={async () => {
                    const result = await deleteProject(form.id as string);
                    if (result.ok) router.replace("/admin/projects");
                    return result;
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <MediaPicker
        open={picker}
        onClose={() => setPicker(false)}
        onSelect={(item) => set("cover", item.url)}
      />
    </div>
  );
}
