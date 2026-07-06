import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { isAuthDisabled } from "@/lib/auth-config";
import { createClient, createServiceClient } from "@/lib/supabase/server";

let cachedDevUser: User | null = null;

async function getDevUser(): Promise<User> {
  if (cachedDevUser) return cachedDevUser;

  let id = process.env.DEV_USER_ID;
  const email =
    process.env.ALLOWED_EMAILS?.split(",")[0]?.trim() ?? "dev@localhost";

  if (!id) {
    const supabase = await createServiceClient();
    const { data, error } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    if (error) throw error;

    let match = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (!match) {
      const { data: created, error: createError } =
        await supabase.auth.admin.createUser({
          email,
          password: process.env.DEV_AUTH_PASSWORD ?? "dev-only-password",
          email_confirm: true,
        });

      if (createError) {
        const alreadyExists =
          createError.message.toLowerCase().includes("already") ||
          createError.message.toLowerCase().includes("registered");
        if (!alreadyExists) throw createError;

        const { data: retry, error: retryError } =
          await supabase.auth.admin.listUsers({ perPage: 1000 });
        if (retryError) throw retryError;
        match = retry.users.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase(),
        );
        if (!match) throw createError;
      } else {
        match = created.user;
      }
    }

    id = match.id;
  }

  cachedDevUser = {
    id,
    email,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  } as User;

  return cachedDevUser;
}

export async function getCurrentUser() {
  if (isAuthDisabled()) {
    return getDevUser();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export function isEmailAllowed(email: string): boolean {
  const allowlist = process.env.ALLOWED_EMAILS;
  if (!allowlist) return true;
  const allowed = allowlist.split(",").map((e) => e.trim().toLowerCase());
  return allowed.includes(email.toLowerCase());
}
