"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { changePasswordAction } from "@/lib/actions/auth";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-ghost h-8 text-[11.5px]">
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
      Update password
    </button>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState<
    { error?: string; success?: string } | null,
    FormData
  >(changePasswordAction, null);

  return (
    <form action={formAction}>
      <h2 className="border-b border-line/[0.08] pb-2.5 text-[13px] font-medium text-fg">
        Password
      </h2>
      <p className="mt-3 max-w-[52ch] text-[11.5px] leading-relaxed text-muted">
        Passwords are hashed with scrypt (N=16384) and a per-user salt. Changing it
        here does not invalidate existing sessions.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
            Current
          </span>
          <input name="current" type="password" required className="field h-8 text-[12px]" />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
            New (10+ chars)
          </span>
          <input name="next" type="password" required minLength={10} className="field h-8 text-[12px]" />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
            Confirm
          </span>
          <input name="confirm" type="password" required minLength={10} className="field h-8 text-[12px]" />
        </label>
      </div>

      {state?.error && (
        <p className="mt-3 font-mono text-[10px] text-[#E88BA0]">{state.error}</p>
      )}
      {state?.success && (
        <p className="mt-3 font-mono text-[10px] text-accent">{state.success}</p>
      )}

      <div className="mt-4">
        <Submit />
      </div>
    </form>
  );
}
