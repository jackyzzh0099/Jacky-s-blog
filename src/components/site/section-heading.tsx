import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function SectionHeading({
  index,
  title,
  description,
  action,
  className,
  children,
}: {
  index: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("border-t border-line/[0.09] pt-5", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex items-baseline gap-4">
          <span className="label pt-px">{index}</span>
          <h2 className="text-[22px] font-semibold leading-none tracking-tighter text-fg md:text-[26px]">
            {title}
          </h2>
        </div>
        {action && (
          <Link
            href={action.href}
            className="group inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-fg"
          >
            {action.label}
            <ArrowUpRight
              className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px"
              strokeWidth={1.8}
            />
          </Link>
        )}
        {children}
      </div>
      {description && (
        <p className="mt-3 max-w-[52ch] pl-0 text-[13px] leading-relaxed text-muted md:pl-[calc(2.5rem+1rem)]">
          {description}
        </p>
      )}
    </div>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-faint",
        className,
      )}
    >
      <span className="h-px w-6 bg-line/25" aria-hidden="true" />
      {children}
    </p>
  );
}
