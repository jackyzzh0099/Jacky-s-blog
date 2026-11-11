"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { DangerButton, InlineNotice } from "./bits";
import { deleteCategory, deleteTag, saveCategory, saveTag } from "@/lib/actions/taxonomy";
import type { CategoryWithCount, TagWithCount } from "@/lib/db/types";

const ACCENTS = ["#7E8EFF", "#5FD3E8", "#A98BFF", "#E88BA0", "#6FCF97", "#E2B06A", "#8A8F98"];

export function TaxonomyManager({
  categories,
  tags,
}: {
  categories: CategoryWithCount[];
  tags: TagWithCount[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );

  const [form, setForm] = useState({
    name: "",
    description: "",
    accent: ACCENTS[0],
  });
  const [editing, setEditing] = useState<CategoryWithCount | null>(null);
  const [tagName, setTagName] = useState("");
  const [editingTag, setEditingTag] = useState<TagWithCount | null>(null);

  function submitCategory() {
    startTransition(async () => {
      const result = await saveCategory({
        id: editing?.id,
        name: form.name,
        description: form.description,
        accent: form.accent,
        sortOrder: editing?.sortOrder,
      });
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error ?? "Could not save." });
        return;
      }
      setMessage({ tone: "success", text: editing ? "Field updated." : "Field created." });
      setForm({ name: "", description: "", accent: ACCENTS[0] });
      setEditing(null);
      router.refresh();
    });
  }

  return (
    <div>
      <div>
        <p className="label">Library</p>
        <h1 className="mt-2.5 text-[24px] font-semibold tracking-tight text-fg">
          Fields &amp; tags
        </h1>
        <p className="mt-1.5 max-w-[62ch] text-[12.5px] leading-relaxed text-muted">
          Fields are the eight top-level areas of the site. Tags are free-form and
          can be created straight from the article editor — this page is for
          renaming and pruning.
        </p>
      </div>

      {message && (
        <div className="mt-4">
          <InlineNotice tone={message.tone}>{message.text}</InlineNotice>
        </div>
      )}

      <div className="mt-7 grid gap-8 lg:grid-cols-2">
        {/* Categories */}
        <section>
          <div className="flex items-center justify-between border-b border-line/[0.08] pb-2.5">
            <h2 className="text-[13px] font-medium text-fg">
              Fields <span className="text-faint">({categories.length})</span>
            </h2>
            {pending && <Loader2 className="h-3 w-3 animate-spin text-faint" />}
          </div>

          <div className="mt-4 rounded-sm border border-line/[0.08] p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {ACCENTS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, accent: color }))}
                  aria-label={`Use ${color}`}
                  className="h-4 w-4 rounded-full border transition-transform"
                  style={{
                    backgroundColor: color,
                    borderColor: form.accent === color ? "rgb(var(--fg))" : "transparent",
                    transform: form.accent === color ? "scale(1.15)" : undefined,
                  }}
                />
              ))}
            </div>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Field name"
              className="field mt-3 h-8 text-[12px]"
            />
            <input
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="One-line description shown on the home page"
              className="field mt-2 h-8 text-[12px]"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={submitCategory}
                disabled={pending || !form.name.trim()}
                className="btn btn-primary h-7 text-[10.5px] disabled:opacity-40"
              >
                <Plus className="h-3 w-3" />
                {editing ? "Update field" : "Add field"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm({ name: "", description: "", accent: ACCENTS[0] });
                  }}
                  className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint hover:text-fg"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </div>

          <ul className="mt-3">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between gap-3 border-b border-line/[0.06] py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: category.accent || "#8A8F98" }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] text-fg">{category.name}</p>
                    <p className="truncate font-mono text-[9px] text-faint">
                      /blog?category={category.slug} · {category.postCount} article
                      {category.postCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(category);
                      setForm({
                        name: category.name,
                        description: category.description,
                        accent: category.accent || ACCENTS[0],
                      });
                    }}
                    className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted hover:text-fg"
                  >
                    Edit
                  </button>
                  <DangerButton
                    action={async () => {
                      const result = await deleteCategory(category.id);
                      if (result.ok) router.refresh();
                      return result;
                    }}
                    label="Del"
                    confirmLabel="Sure?"
                    icon={false}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Tags */}
        <section>
          <div className="flex items-center justify-between border-b border-line/[0.08] pb-2.5">
            <h2 className="text-[13px] font-medium text-fg">
              Tags <span className="text-faint">({tags.length})</span>
            </h2>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              value={editingTag ? editingTag.name : tagName}
              onChange={(event) =>
                editingTag
                  ? setEditingTag({ ...editingTag, name: event.target.value })
                  : setTagName(event.target.value)
              }
              placeholder="New tag name"
              className="field h-8 flex-1 text-[12px]"
            />
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await saveTag({
                    id: editingTag?.id,
                    name: editingTag ? editingTag.name : tagName,
                  });
                  if (!result.ok) {
                    setMessage({ tone: "error", text: result.error ?? "Could not save." });
                    return;
                  }
                  setTagName("");
                  setEditingTag(null);
                  setMessage({ tone: "success", text: "Tag saved." });
                  router.refresh();
                })
              }
              className="btn btn-ghost h-8 text-[10.5px]"
            >
              {editingTag ? "Update" : "Add"}
            </button>
            {editingTag && (
              <button
                type="button"
                onClick={() => setEditingTag(null)}
                className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint"
              >
                Cancel
              </button>
            )}
          </div>

          <ul className="mt-3 max-h-[520px] overflow-y-auto pr-1">
            {tags.map((tag) => (
              <li
                key={tag.id}
                className="flex items-center justify-between gap-3 border-b border-line/[0.06] py-2"
              >
                <span className="min-w-0 truncate text-[12.5px] text-fg/90">
                  #{tag.name}
                  <span className="ml-2 font-mono text-[9px] text-faint">
                    {tag.postCount}
                  </span>
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTag(tag)}
                    className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted hover:text-fg"
                  >
                    Rename
                  </button>
                  <DangerButton
                    action={async () => {
                      const result = await deleteTag(tag.id);
                      if (result.ok) router.refresh();
                      return result;
                    }}
                    label="Del"
                    confirmLabel="Sure?"
                    icon={false}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
