import { decryptIntegrationToken, encryptTokenSafe } from "@/lib/crypto";
import {
  getAppUrl,
  getOuraClientCredentials,
  hasOuraOAuthEnv,
} from "@/lib/env";
import { isReauthError } from "@/lib/integrations/types";
import { createServiceClient } from "@/lib/supabase/server";
import type { Integration } from "@/types";

export { hasOuraOAuthEnv as isOuraOAuthConfigured };

const OURA_AUTHORIZE = "https://cloud.ouraring.com/oauth/authorize";
const OURA_TOKEN = "https://api.ouraring.com/oauth/token";
const OURA_SCOPES = ["email", "personal", "daily", "heartrate", "workout"];
const TOKEN_REFRESH_BUFFER_MS = 60_000;
const TOKEN_PERSIST_RETRIES = 3;
const CONCURRENT_REFRESH_RETRIES = 3;
const CONCURRENT_REFRESH_DELAY_MS = 250;

interface OuraTokenResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

function getRedirectUri(baseUrl?: string): string {
  const origin = baseUrl ?? getAppUrl();
  return `${origin}/api/oauth/oura/callback`;
}

export function getOuraAuthUrl(state: string, baseUrl?: string): string {
  const { clientId } = getOuraClientCredentials();
  const url = new URL(OURA_AUTHORIZE);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", getRedirectUri(baseUrl));
  url.searchParams.set("scope", OURA_SCOPES.join(" "));
  url.searchParams.set("state", state);
  return url.toString();
}

async function requestOuraToken(
  body: Record<string, string>,
): Promise<OuraTokenResponse> {
  const { clientId, clientSecret } = getOuraClientCredentials();
  const params = new URLSearchParams({
    ...body,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(OURA_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    const lower = body.toLowerCase();
    if (
      res.status === 401 ||
      lower.includes("invalid_grant") ||
      lower.includes("expired")
    ) {
      throw new Error(
        "Oura session expired. Disconnect and reconnect Oura in Settings.",
      );
    }
    throw new Error(`Oura token error: ${res.status} ${body}`);
  }

  return res.json() as Promise<OuraTokenResponse>;
}

export async function exchangeOuraCode(code: string, baseUrl?: string) {
  const data = await requestOuraToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(baseUrl),
  });

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };
}

async function refreshOuraAccessToken(refreshToken: string) {
  const data = await requestOuraToken({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };
}

function decryptStoredToken(stored: string): string {
  return decryptIntegrationToken(stored);
}

function isAccessTokenFresh(integration: Integration): boolean {
  if (!integration.access_token_enc || !integration.token_expires_at) {
    return false;
  }

  return (
    new Date(integration.token_expires_at).getTime() >
    Date.now() + TOKEN_REFRESH_BUFFER_MS
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadLatestIntegration(
  db: Awaited<ReturnType<typeof createServiceClient>>,
  integrationId: string,
): Promise<Integration | null> {
  const { data, error } = await db
    .from("integrations")
    .select("*")
    .eq("id", integrationId)
    .maybeSingle();

  if (error) throw error;
  return (data as Integration | null) ?? null;
}

async function adoptConcurrentRefresh(
  db: Awaited<ReturnType<typeof createServiceClient>>,
  original: Integration,
): Promise<string | null> {
  for (let attempt = 0; attempt < CONCURRENT_REFRESH_RETRIES; attempt++) {
    const latest = await loadLatestIntegration(db, original.id);
    if (
      latest &&
      latest.refresh_token_enc !== original.refresh_token_enc &&
      isAccessTokenFresh(latest)
    ) {
      return decryptStoredToken(latest.access_token_enc!);
    }

    if (attempt < CONCURRENT_REFRESH_RETRIES - 1) {
      await wait(CONCURRENT_REFRESH_DELAY_MS);
    }
  }

  return null;
}

async function persistRefreshedTokens(
  db: Awaited<ReturnType<typeof createServiceClient>>,
  integration: Integration,
  tokens: Awaited<ReturnType<typeof refreshOuraAccessToken>>,
): Promise<boolean> {
  const update = {
    access_token_enc: encryptTokenSafe(tokens.accessToken),
    refresh_token_enc: encryptTokenSafe(tokens.refreshToken),
    token_expires_at: tokens.expiresAt,
    status: "active",
    updated_at: new Date().toISOString(),
  };

  for (let attempt = 0; attempt < TOKEN_PERSIST_RETRIES; attempt++) {
    const { data, error } = await db
      .from("integrations")
      .update(update)
      .eq("id", integration.id)
      .eq("refresh_token_enc", integration.refresh_token_enc)
      .select("id")
      .maybeSingle();

    if (!error) return Boolean(data);
    if (attempt === TOKEN_PERSIST_RETRIES - 1) throw error;
    await wait(CONCURRENT_REFRESH_DELAY_MS);
  }

  return false;
}

export async function getOuraAccessToken(
  integration: Integration,
): Promise<string> {
  const refreshToken = integration.refresh_token_enc
    ? decryptStoredToken(integration.refresh_token_enc)
    : null;

  if (!refreshToken) {
    throw new Error(
      "Oura OAuth session missing. Disconnect and connect again via Settings → Integrations.",
    );
  }

  const expiresAt = integration.token_expires_at
    ? new Date(integration.token_expires_at).getTime()
    : 0;

  if (
    integration.access_token_enc &&
    expiresAt > Date.now() + TOKEN_REFRESH_BUFFER_MS
  ) {
    return decryptStoredToken(integration.access_token_enc);
  }

  // Always persist refreshed tokens with the service role (works from cron + manual sync).
  const db = await createServiceClient();

  let tokens: Awaited<ReturnType<typeof refreshOuraAccessToken>>;
  try {
    tokens = await refreshOuraAccessToken(refreshToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isReauthError(message)) {
      const adoptedToken = await adoptConcurrentRefresh(db, integration);
      if (adoptedToken) return adoptedToken;
    }
    throw error;
  }

  const persisted = await persistRefreshedTokens(db, integration, tokens);
  if (!persisted) {
    const adoptedToken = await adoptConcurrentRefresh(db, integration);
    if (adoptedToken) return adoptedToken;
    throw new Error("Oura token refresh was superseded by another sync.");
  }

  return tokens.accessToken;
}
