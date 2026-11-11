export default function Loading() {
  return (
    <div className="container-page flex min-h-[62vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span
          className="h-4 w-4 animate-spin rounded-full border border-line/20 border-t-accent"
          aria-hidden="true"
        />
        <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-faint">
          Loading
        </span>
      </div>
    </div>
  );
}
