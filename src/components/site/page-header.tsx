import type { ReactNode } from "react";

import { Eyebrow } from "./section-heading";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  children,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  meta?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "relative overflow-hidden border-b border-line/[0.07] pb-10 pt-12 md:pt-16",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-[320px] w-[320px] rounded-full opacity-60 blur-[70px]"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--accent) / 0.10), transparent 70%)",
        }}
        aria-hidden="true"
      />
      <Eyebrow>{eyebrow}</Eyebrow>
      <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
        <h1 className="max-w-[22ch] text-[clamp(2rem,4.8vw,3.1rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-fg">
          {title}
        </h1>
        {meta && (
          <div className="shrink-0 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-faint">
            {meta}
          </div>
        )}
      </div>
      {description && (
        <p className="mt-5 max-w-[58ch] text-[13.5px] leading-[1.75] text-muted">
          {description}
        </p>
      )}
      {children}
    </header>
  );
}
