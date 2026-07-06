function resolveSupabaseUrl(): string | undefined {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  return url || undefined;
}

function resolveSupabaseAnonKey(): string | undefined {
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim();
  return anonKey || undefined;
}

export function hasSupabasePublicEnv(): boolean {
  return Boolean(resolveSupabaseUrl() && resolveSupabaseAnonKey());
}

export function getSupabasePublicEnv(): {
  url: string;
  anonKey: string;
} {
  const url = resolveSupabaseUrl();
  const anonKey = resolveSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase URL or anon key. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.",
    );
  }

  return { url, anonKey };
}

export function getDeploymentHealth() {
  return {
    supabaseUrl: Boolean(resolveSupabaseUrl()),
    supabaseAnonKey: Boolean(resolveSupabaseAnonKey()),
    supabasePublic: hasSupabasePublicEnv(),
    supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    appUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim()),
    allowedEmails: Boolean(process.env.ALLOWED_EMAILS?.trim()),
    tokenEncryptionKey:
      Boolean(process.env.TOKEN_ENCRYPTION_KEY?.trim()) &&
      !process.env.TOKEN_ENCRYPTION_KEY?.includes("your-"),
    cronSecret:
      Boolean(process.env.CRON_SECRET?.trim()) &&
      !process.env.CRON_SECRET?.includes("your-"),
  };
}
