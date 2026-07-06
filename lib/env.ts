export function hasSupabasePublicEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabasePublicEnv(): {
  url: string;
  anonKey: string;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return { url, anonKey };
}

export function getDeploymentHealth() {
  return {
    supabasePublic: hasSupabasePublicEnv(),
    supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    appUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    allowedEmails: Boolean(process.env.ALLOWED_EMAILS),
    tokenEncryptionKey:
      Boolean(process.env.TOKEN_ENCRYPTION_KEY) &&
      !process.env.TOKEN_ENCRYPTION_KEY?.includes("your-"),
    cronSecret:
      Boolean(process.env.CRON_SECRET) &&
      !process.env.CRON_SECRET?.includes("your-"),
  };
}
