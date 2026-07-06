"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isEmailAllowed } from "@/lib/auth";
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

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign in failed";
    if (message.includes("NEXT_PUBLIC_SUPABASE")) {
      return { error: "Server misconfigured. Set Supabase env vars in Vercel." };
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
