"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isEmailAllowed } from "@/lib/auth";
import { hasSupabasePublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function signInWithPassword(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  if (!isEmailAllowed(email)) {
    return { error: "This email is not authorized" };
  }

  if (!hasSupabasePublicEnv()) {
    return {
      error:
        "Server misconfigured. Set NEXT_PUBLIC_SUPABASE_URL (with https://) and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign in failed";
    if (
      message.includes("NEXT_PUBLIC_SUPABASE") ||
      message.includes("Invalid supabaseUrl") ||
      message.includes("valid URL")
    ) {
      return {
        error:
          "Server misconfigured. Set NEXT_PUBLIC_SUPABASE_URL to your full Supabase URL (https://xyz.supabase.co) in Vercel.",
      };
    }
    return { error: message };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
