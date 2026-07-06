import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isAuthDisabled } from "@/lib/auth-config";
import { getSupabasePublicEnv } from "@/lib/env";

export async function createClient() {
  if (isAuthDisabled()) {
    return createServiceClient();
  }

  const { url, anonKey } = getSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    },
  );
}

export async function createServiceClient() {
  const { createClient: createSupabaseClient } = await import(
    "@supabase/supabase-js"
  );
  const { url } = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createSupabaseClient(url, serviceRoleKey);
}
