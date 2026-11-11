import Link from "next/link";
import type { ReactNode } from "react";

export function EmptyState({
  code = "0x00 / EMPTY",
  title,
  description,
  action,
  children,
}: {
  code?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-line/12 px-6 py-20 text-center">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-faint">
        {code}
      </span>
      <h3 className="mt-4 text-[17px] font-medium tracking-tight text-fg">{title}</h3>
      {description && (
        <p className="mt-2 max-w-[38ch] text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      )}
      {action && (
        <Link href={action.href} className="btn btn-ghost mt-6">
          {action.label}
        </Link>
      )}
      {children}
    </div>
  );
}
