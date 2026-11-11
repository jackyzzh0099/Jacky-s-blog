import { cn } from "@/lib/utils";

/** Brand mark: a notched frame with an aperture crosshair and one accent blade. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={cn("h-[22px] w-[22px]", className)}
    >
      <path
        d="M3 8.5V6a3 3 0 0 1 3-3h2.5M19.5 3H22a3 3 0 0 1 3 3v2.5M25 19.5V22a3 3 0 0 1-3 3h-2.5M8.5 25H6a3 3 0 0 1-3-3v-2.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.75"
      />
      <circle cx="14" cy="14" r="4.2" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M14 5.6V9.2M14 18.8v3.6M5.6 14h3.6M18.8 14h3.6"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M17.6 10.4a4.2 4.2 0 0 1 0 7.2"
        stroke="rgb(var(--accent))"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({
  shortName,
  className,
}: {
  shortName: string;
  className?: string;
}) {
  return (
    <span className={cn("flex items-baseline gap-1.5", className)}>
      <span className="text-[15px] font-semibold tracking-tight text-fg">
        {shortName}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
        .blog
      </span>
    </span>
  );
}
