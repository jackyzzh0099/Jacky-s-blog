"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the failure in the console for whoever is debugging it; there is
    // no client-side telemetry on this site by design.
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[70vh] flex-col justify-center py-20">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
        Runtime error / 500
      </p>
      <h1 className="mt-6 max-w-[18ch] text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-fg">
        Something threw where it should not have.
      </h1>
      <p className="mt-5 max-w-[52ch] text-[13.5px] leading-[1.75] text-muted">
        The page failed to render. The error has been logged to the browser
        console; retrying is usually enough. If it keeps happening, the database
        or the Markdown pipeline is the place to look.
      </p>

      {error.digest && (
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
          digest {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary h-9 text-[12px]">
          Try again
        </button>
        <Link href="/" className="btn btn-ghost h-9 text-[12px]">
          Back to the index
        </Link>
      </div>
    </div>
  );
}
