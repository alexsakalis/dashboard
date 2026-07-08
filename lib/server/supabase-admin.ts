/**
 * Server-only Supabase admin client using the service role key.
 * NEVER import this module from client components ("use client").
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabasePublicEnv } from "@/lib/env";

export async function createAdminClient() {
  const { url } = getSupabasePublicEnv();
  const serviceRoleKey = getServiceRoleKey();
  return createSupabaseClient(url, serviceRoleKey);
}
