import type { SupabaseClient } from "@supabase/supabase-js";
import { encryptTokenSafe, decryptTokenSafe } from "@/lib/crypto";
import {
  getAppUrl,
  getOuraClientCredentials,
  hasOuraOAuthEnv,
} from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";
import type { Integration } from "@/types";

export { hasOuraOAuthEnv as isOuraOAuthConfigured };

const OURA_AUTHORIZE = "https://cloud.ouraring.com/oauth/authorize";
const OURA_TOKEN = "https://api.ouraring.com/oauth/token";
const OURA_SCOPES = ["email", "personal", "daily", "heartrate", "workout"];

interface OuraTokenResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

function getRedirectUri(): string {
  return `${getAppUrl()}/api/oauth/oura/callback`;
}

export function getOuraAuthUrl(state: string): string {
  const { clientId } = getOuraClientCredentials();
  const url = new URL(OURA_AUTHORIZE);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", getRedirectUri());
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
    throw new Error(`Oura token error: ${res.status} ${await res.text()}`);
  }

  return res.json() as Promise<OuraTokenResponse>;
}

export async function exchangeOuraCode(code: string) {
  const data = await requestOuraToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
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
  if (!stored.includes(":")) {
    return stored;
  }
  return decryptTokenSafe(stored);
}

export async function getOuraAccessToken(
  integration: Integration,
  supabase?: SupabaseClient,
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

  if (integration.access_token_enc && expiresAt > Date.now() + 60_000) {
    return decryptStoredToken(integration.access_token_enc);
  }

  const tokens = await refreshOuraAccessToken(refreshToken);
  const db = supabase ?? (await createServiceClient());
  const { error } = await db
    .from("integrations")
    .update({
      access_token_enc: encryptTokenSafe(tokens.accessToken),
      refresh_token_enc: encryptTokenSafe(tokens.refreshToken),
      token_expires_at: tokens.expiresAt,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", integration.id);

  if (error) throw error;

  return tokens.accessToken;
}
