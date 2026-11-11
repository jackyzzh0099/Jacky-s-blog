"use client";

import { ArrowRight, Loader2, Lock } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { loginAction, type LoginState } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary w-full">
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Verifying
        </>
      ) : (
        <>
          Enter workspace
          <ArrowRight className="h-3.5 w-3.5" />
        </>
      )}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState | null, FormData>(
    loginAction,
    null,
  );

  return (
    <form action={formAction} className="w-full max-w-[340px]">
      <div className="mb-8">
        <p className="label">Operator access</p>
        <h1 className="mt-3 text-[26px] font-semibold tracking-tight text-fg">
          Sign in
        </h1>
        <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
          The workspace is the only writable surface on this site. Sessions are
          opaque, HttpOnly and expire after seven days.
        </p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="label mb-2 block">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            defaultValue={state?.email ?? ""}
            placeholder="you@example.com"
            className="field"
          />
        </label>

        <label className="block">
          <span className="label mb-2 block">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••••"
            className="field"
          />
        </label>
      </div>

      {state?.error && (
        <p
          role="alert"
          className="mt-4 border border-[#E88BA0]/30 bg-[#E88BA0]/[0.06] px-3 py-2 font-mono text-[10.5px] leading-relaxed text-[#E88BA0]"
        >
          {state.error}
        </p>
      )}

      <div className="mt-6">
        <SubmitButton />
      </div>

      <p className="mt-6 flex items-start gap-2 font-mono text-[9.5px] leading-relaxed tracking-[0.04em] text-faint">
        <Lock className="mt-0.5 h-3 w-3 shrink-0" />
        Credentials are created by <span className="text-muted">npm run db:setup</span>{" "}
        from ADMIN_EMAIL / ADMIN_PASSWORD. Change the password after the first
        login.
      </p>
    </form>
  );
}
