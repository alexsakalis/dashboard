function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.includes("your-")) return undefined;
  return trimmed;
}

function resolveEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = trimEnv(process.env[name]);
    if (value) return value;
  }
  return undefined;
}

export function getEnvConfigLocation(): string {
  return process.env.VERCEL === "1"
    ? "Vercel → Project → Settings → Environment Variables (Production), then redeploy"
    : ".env.local in the project root, then restart the dev server";
}

function resolveSupabaseUrl(): string | undefined {
  return resolveEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
}

function resolveSupabaseAnonKey(): string | undefined {
  return resolveEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY");
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
      `Missing Supabase URL or anon key. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in ${getEnvConfigLocation()}.`,
    );
  }

  return { url, anonKey };
}

export function getServiceRoleKey(): string {
  const key = resolveEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SERVICE_KEY",
    "SERVICE_ROLE_KEY",
  );

  if (!key) {
    throw new Error(
      `Missing SUPABASE_SERVICE_ROLE_KEY. Set it in ${getEnvConfigLocation()}.`,
    );
  }

  return key;
}

export function hasServiceRoleKey(): boolean {
  try {
    getServiceRoleKey();
    return true;
  } catch {
    return false;
  }
}

export function getGoogleClientCredentials(): {
  clientId: string;
  clientSecret: string;
} {
  const clientId = resolveEnv("GOOGLE_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = resolveEnv(
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_OAUTH_CLIENT_SECRET",
  );

  if (!clientId || !clientSecret) {
    throw new Error(
      `Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in ${getEnvConfigLocation()}.`,
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
  const clientId = resolveEnv("OURA_CLIENT_ID", "OURA_OAUTH_CLIENT_ID");
  const clientSecret = resolveEnv(
    "OURA_CLIENT_SECRET",
    "OURA_OAUTH_CLIENT_SECRET",
  );

  if (!clientId || !clientSecret) {
    throw new Error(
      `Missing Oura OAuth credentials. Set OURA_CLIENT_ID and OURA_CLIENT_SECRET in ${getEnvConfigLocation()}.`,
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

export function getAppUrl(): string {
  const url = resolveEnv("NEXT_PUBLIC_APP_URL", "VERCEL_URL");
  if (!url) {
    throw new Error(
      `Missing NEXT_PUBLIC_APP_URL. Set it in ${getEnvConfigLocation()}.`,
    );
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url.replace(/\/$/, "");
  }

  return `https://${url.replace(/\/$/, "")}`;
}

export function getIntegrationEnvStatus() {
  const missing: string[] = [];

  if (!hasServiceRoleKey()) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!hasGoogleOAuthEnv()) {
    missing.push("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET");
  }
  if (!hasOuraOAuthEnv()) {
    missing.push("OURA_CLIENT_ID", "OURA_CLIENT_SECRET");
  }
  if (!trimEnv(process.env.NEXT_PUBLIC_APP_URL)) {
    missing.push("NEXT_PUBLIC_APP_URL");
  }
  if (
    !trimEnv(process.env.TOKEN_ENCRYPTION_KEY) ||
    process.env.TOKEN_ENCRYPTION_KEY?.includes("your-")
  ) {
    missing.push("TOKEN_ENCRYPTION_KEY");
  }

  return {
    configLocation: getEnvConfigLocation(),
    isProduction: process.env.VERCEL === "1",
    googleOAuth: hasGoogleOAuthEnv(),
    ouraOAuth: hasOuraOAuthEnv(),
    serviceRole: hasServiceRoleKey(),
    missing: [...new Set(missing)],
  };
}

export function getDeploymentHealth() {
  return {
    supabaseUrl: Boolean(resolveSupabaseUrl()),
    supabaseAnonKey: Boolean(resolveSupabaseAnonKey()),
    supabasePublic: hasSupabasePublicEnv(),
    supabaseServiceRole: hasServiceRoleKey(),
    googleOAuth: hasGoogleOAuthEnv(),
    ouraOAuth: hasOuraOAuthEnv(),
    appUrl: Boolean(trimEnv(process.env.NEXT_PUBLIC_APP_URL)),
    allowedEmails: Boolean(trimEnv(process.env.ALLOWED_EMAILS)),
    tokenEncryptionKey:
      Boolean(trimEnv(process.env.TOKEN_ENCRYPTION_KEY)) &&
      !process.env.TOKEN_ENCRYPTION_KEY?.includes("your-"),
    cronSecret:
      Boolean(trimEnv(process.env.CRON_SECRET)) &&
      !process.env.CRON_SECRET?.includes("your-"),
  };
}
