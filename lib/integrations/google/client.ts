import { addDays, startOfDay } from "date-fns";
import { google } from "googleapis";
import { decryptIntegrationToken, encryptTokenSafe } from "@/lib/crypto";
import {
  getAppUrl,
  getGoogleClientCredentials,
  hasGoogleOAuthEnv,
} from "@/lib/env";
import type { Integration } from "@/types";

export { hasGoogleOAuthEnv as isGoogleOAuthConfigured };

function getRedirectUri(baseUrl?: string): string {
  const origin = baseUrl ?? getAppUrl();
  return `${origin}/api/oauth/google/callback`;
}

function getOAuthClient(baseUrl?: string) {
  const { clientId, clientSecret } = getGoogleClientCredentials();
  return new google.auth.OAuth2(clientId, clientSecret, getRedirectUri(baseUrl));
}

function formatGoogleApiError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  if (lower.includes("invalid_grant") || lower.includes("token has been expired")) {
    return "Google session expired. Disconnect and reconnect Google in Settings.";
  }
  if (lower.includes("insufficient") || lower.includes("permission")) {
    return "Google denied access. Reconnect and approve all requested permissions.";
  }
  return message;
}

export function getGoogleAuthUrl(state: string, baseUrl?: string): string {
  const oauth2 = getOAuthClient(baseUrl);
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.readonly"],
    state,
  });
}

function getAuthenticatedClient(integration: Integration) {
  const oauth2 = getOAuthClient();
  const refreshToken = integration.refresh_token_enc
    ? decryptIntegrationToken(integration.refresh_token_enc)
    : null;

  if (!refreshToken) {
    throw new Error(
      "Google OAuth session missing. Disconnect and connect again via Settings → Integrations.",
    );
  }

  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

export function getCalendarClient(integration: Integration) {
  return google.calendar({ version: "v3", auth: getAuthenticatedClient(integration) });
}

export function getGoogleOAuth2Client(integration: Integration) {
  return getAuthenticatedClient(integration);
}

export async function exchangeGoogleCode(code: string, baseUrl?: string) {
  try {
    const oauth2 = getOAuthClient(baseUrl);
    const { tokens } = await oauth2.getToken(code);
    return {
      accessToken: tokens.access_token ?? null,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
    };
  } catch (err) {
    throw new Error(formatGoogleApiError(err));
  }
}

function mapGoogleEvent(
  event: {
    id?: string | null;
    summary?: string | null;
    start?: { dateTime?: string | null; date?: string | null } | null;
    end?: { dateTime?: string | null; date?: string | null } | null;
    location?: string | null;
  },
  calendarId: string,
) {
  const allDay = Boolean(event.start?.date && !event.start?.dateTime);
  const startDate = event.start?.date ?? event.start?.dateTime?.slice(0, 10);
  const endDate = event.end?.date ?? event.end?.dateTime?.slice(0, 10) ?? startDate;

  return {
    external_id: `${calendarId}:${event.id ?? crypto.randomUUID()}`,
    title: event.summary ?? "Untitled",
    start_time: allDay
      ? `${startDate}T12:00:00.000Z`
      : (event.start?.dateTime ?? `${startDate}T12:00:00.000Z`),
    end_time: allDay
      ? `${endDate}T12:00:00.000Z`
      : (event.end?.dateTime ?? `${endDate}T12:00:00.000Z`),
    all_day: allDay,
    location: event.location ?? null,
    raw_payload: event,
  };
}

async function listCalendarIds(
  calendar: ReturnType<typeof getCalendarClient>,
  configuredId?: string,
): Promise<string[]> {
  if (configuredId && configuredId !== "all") {
    return [configuredId];
  }

  try {
    const response = await calendar.calendarList.list({ minAccessRole: "reader" });
    const ids = (response.data.items ?? [])
      .filter((cal) => cal.id && cal.selected !== false)
      .map((cal) => cal.id!);

    if (ids.length > 0) return ids;
  } catch {
    // Fall back to primary if calendar list is unavailable.
  }

  return ["primary"];
}

export async function fetchCalendarEvents(integration: Integration) {
  const oauth2 = getAuthenticatedClient(integration);
  const calendar = google.calendar({ version: "v3", auth: oauth2 });
  const configuredId = integration.config.calendar_id as string | undefined;
  const calendarIds = await listCalendarIds(calendar, configuredId);

  const timeMin = startOfDay(new Date()).toISOString();
  const timeMax = addDays(startOfDay(new Date()), 14).toISOString();
  const events = [];

  for (const calendarId of calendarIds) {
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 100,
    });

    for (const event of response.data.items ?? []) {
      if (event.status === "cancelled") continue;
      events.push(mapGoogleEvent(event, calendarId));
    }
  }

  return {
    events,
    refreshedCredentials: oauth2.credentials,
  };
}

export { encryptTokenSafe };
