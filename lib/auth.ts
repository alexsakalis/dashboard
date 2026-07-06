import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export function isEmailAllowed(email: string): boolean {
  const allowlist = process.env.ALLOWED_EMAILS;
  if (!allowlist) return true;
  const allowed = allowlist.split(",").map((e) => e.trim().toLowerCase());
  return allowed.includes(email.toLowerCase());
}
