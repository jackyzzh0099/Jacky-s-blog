"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  authenticate,
  checkLoginRate,
  clearLoginFailures,
  createSession,
  destroySession,
  recordLoginFailure,
  requireUser,
} from "@/lib/auth";
import { findUserById, updateUserPassword } from "@/lib/db/queries";
import { hashPassword, verifyPassword } from "@/lib/password";

export interface LoginState {
  error?: string;
  email?: string;
}

const credentials = z.object({
  email: z.string().trim().min(3, "Enter your email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function loginAction(
  _prev: LoginState | null,
  formData: FormData,
): Promise<LoginState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
      email: String(formData.get("email") ?? ""),
    };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    "local";

  const limit = checkLoginRate(ip);
  if (!limit.allowed) {
    return {
      error: `Too many attempts. Try again in about ${limit.retryInMinutes} minute(s).`,
      email: parsed.data.email,
    };
  }

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) {
    recordLoginFailure(ip);
    return {
      error: "Those credentials do not match an account.",
      email: parsed.data.email,
    };
  }

  clearLoginFailures(ip);
  await createSession(user, headerList.get("user-agent"));
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

export async function changePasswordAction(
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const user = await requireUser();

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (next.length < 10) {
    return { error: "The new password must be at least 10 characters." };
  }
  if (next !== confirm) {
    return { error: "The new passwords do not match." };
  }

  const record = findUserById(user.id);
  if (!record || !verifyPassword(current, record.password_hash)) {
    return { error: "Your current password is incorrect." };
  }

  updateUserPassword(user.id, hashPassword(next));
  return { success: "Password updated. Other sessions stay valid until they expire." };
}
