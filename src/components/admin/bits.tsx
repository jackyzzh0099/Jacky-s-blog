"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-card p-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
        {label}
      </p>
      <p className="mt-3 text-[26px] font-medium leading-none tabular tracking-tight text-fg">
        {typeof value === "number" ? String(value).padStart(2, "0") : value}
      </p>
      {hint && (
        <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.1em] text-faint">
          {hint}
        </p>
      )}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const published = status === "published";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[2px] border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]",
        published
          ? "border-accent/30 bg-accent/[0.07] text-accent"
          : "border-signal/30 bg-signal/[0.06] text-signal",
      )}
    >
      <span
        className={cn(
          "h-1 w-1 rounded-full",
          published ? "bg-accent" : "bg-signal",
        )}
      />
      {published ? "Published" : "Draft"}
    </span>
  );
}

/** Two-step destructive action — no native dialogs. */
export function DangerButton({
  action,
  label = "Delete",
  confirmLabel = "Confirm delete",
  className,
  icon = true,
}: {
  action: () => Promise<{ ok: boolean; error?: string }>;
  label?: string;
  confirmLabel?: string;
  className?: string;
  icon?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(timer);
  }, [armed]);

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!armed) {
            setArmed(true);
            setError(null);
            return;
          }
          startTransition(async () => {
            const result = await action();
            if (!result.ok) setError(result.error ?? "That did not work.");
            setArmed(false);
          });
        }}
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-[3px] border px-2 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors",
          armed
            ? "border-[#E88BA0]/50 bg-[#E88BA0]/10 text-[#E88BA0]"
            : "border-line/10 text-faint hover:border-line/25 hover:text-fg",
          className,
        )}
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          icon && <Trash2 className="h-3 w-3" />
        )}
        {armed ? confirmLabel : label}
      </button>
      {error && (
        <span className="max-w-[240px] font-mono text-[9px] leading-relaxed text-[#E88BA0]">
          {error}
        </span>
      )}
    </span>
  );
}

export function InlineNotice({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "error";
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "border px-3 py-2 font-mono text-[10px] leading-relaxed",
        tone === "success" && "border-accent/30 bg-accent/[0.06] text-accent",
        tone === "error" && "border-[#E88BA0]/35 bg-[#E88BA0]/[0.06] text-[#E88BA0]",
        tone === "neutral" && "border-line/12 bg-line/[0.03] text-muted",
      )}
    >
      {children}
    </p>
  );
}
