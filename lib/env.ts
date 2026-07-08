function resolveEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function isPlaceholder(value: string): boolean {
  return value.includes("your-");
}

const OAUTH_ENV_HINT =
  "Set them in .env.local for local dev, or in Vercel → Project → Settings → Environment Variables for production.";

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
    supabaseServiceRole: Boolean(resolveEnv("SUPABASE_SERVICE_ROLE_KEY")),
    appUrl: Boolean(resolveEnv("NEXT_PUBLIC_APP_URL")),
    allowedEmails: Boolean(resolveEnv("ALLOWED_EMAILS")),
    googleOAuth: hasGoogleOAuthEnv(),
    ouraOAuth: hasOuraOAuthEnv(),
    tokenEncryptionKey:
      Boolean(resolveEnv("TOKEN_ENCRYPTION_KEY")) &&
      !resolveEnv("TOKEN_ENCRYPTION_KEY")?.includes("your-"),
    cronSecret:
      Boolean(resolveEnv("CRON_SECRET")) &&
      !resolveEnv("CRON_SECRET")?.includes("your-"),
  };
}

export function getGoogleClientCredentials(): {
  clientId: string;
  clientSecret: string;
} {
  const clientId = resolveEnv("GOOGLE_CLIENT_ID");
  const clientSecret = resolveEnv("GOOGLE_CLIENT_SECRET");

  if (
    !clientId ||
    !clientSecret ||
    isPlaceholder(clientId) ||
    isPlaceholder(clientSecret)
  ) {
    throw new Error(
      `Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET. ${OAUTH_ENV_HINT}`,
    );
  }

  return { clientId, clientSecret };
}

export function hasGoogleOAuthEnv(): boolean {
  try {
    getGoogleClientCredentials();
    return true;
  } catch {
    return false;
  }
}

export function getOuraClientCredentials(): {
  clientId: string;
  clientSecret: string;
} {
  const clientId = resolveEnv("OURA_CLIENT_ID");
  const clientSecret = resolveEnv("OURA_CLIENT_SECRET");

  if (
    !clientId ||
    !clientSecret ||
    isPlaceholder(clientId) ||
    isPlaceholder(clientSecret)
  ) {
    throw new Error(
      `Oura OAuth is not configured. Set OURA_CLIENT_ID and OURA_CLIENT_SECRET. ${OAUTH_ENV_HINT}`,
    );
  }

  return { clientId, clientSecret };
}

export function hasOuraOAuthEnv(): boolean {
  try {
    getOuraClientCredentials();
    return true;
  } catch {
    return false;
  }
}
