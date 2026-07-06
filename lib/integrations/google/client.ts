import { addDays, startOfDay } from "date-fns";
import { google } from "googleapis";
import { decryptTokenSafe, encryptTokenSafe } from "@/lib/crypto";
import type { FinanceEntry, Integration } from "@/types";

const SHEET_COLUMNS = [
  "row_id",
  "date",
  "amount",
  "category",
  "merchant",
  "account",
  "notes",
  "entry_type",
  "updated_at",
  "sync_source",
] as const;

function getRedirectUri(): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google/callback`;
}

export function getGoogleClientCredentials(): {
  clientId: string;
  clientSecret: string;
} {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret || clientId.includes("your-")) {
    throw new Error(
      "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local from Google Cloud Console.",
    );
  }
  return { clientId, clientSecret };
}

export function isGoogleOAuthConfigured(): boolean {
  try {
    getGoogleClientCredentials();
    return true;
  } catch {
    return false;
  }
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

function getOAuthClient() {
  const { clientId, clientSecret } = getGoogleClientCredentials();
  return new google.auth.OAuth2(clientId, clientSecret, getRedirectUri());
}

export function getGoogleAuthUrl(state: string): string {
  const oauth2 = getOAuthClient();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
    state,
  });
}

function getAuthenticatedClient(integration: Integration) {
  const oauth2 = getOAuthClient();
  const refreshToken = integration.refresh_token_enc
    ? decryptTokenSafe(integration.refresh_token_enc)
    : null;

  if (!refreshToken) {
    throw new Error(
      "Google OAuth session missing. Disconnect and connect again via Settings → Integrations.",
    );
  }

  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

export function getSheetsClient(integration: Integration) {
  return google.sheets({ version: "v4", auth: getAuthenticatedClient(integration) });
}

export function getCalendarClient(integration: Integration) {
  return google.calendar({ version: "v3", auth: getAuthenticatedClient(integration) });
}

export async function exchangeGoogleCode(code: string) {
  try {
    const oauth2 = getOAuthClient();
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

function rowToEntry(
  userId: string,
  row: string[],
  headerMap: Record<string, number>,
): FinanceEntry | null {
  const rowId = row[headerMap.row_id];
  const date = row[headerMap.date];
  const amount = row[headerMap.amount];

  if (!rowId || !date || !amount) return null;

  return {
    id: rowId,
    user_id: userId,
    row_id: rowId,
    date,
    amount: parseFloat(amount),
    category: row[headerMap.category] || null,
    merchant: row[headerMap.merchant] || null,
    account: row[headerMap.account] || null,
    notes: row[headerMap.notes] || null,
    entry_type: (row[headerMap.entry_type] as FinanceEntry["entry_type"]) || "expense",
    updated_at: row[headerMap.updated_at] || new Date().toISOString(),
    sync_source: (row[headerMap.sync_source] as "app" | "sheet") || "sheet",
    version: 1,
  };
}

function entryToRow(entry: FinanceEntry): string[] {
  return [
    entry.row_id,
    entry.date,
    String(entry.amount),
    entry.category ?? "",
    entry.merchant ?? "",
    entry.account ?? "",
    entry.notes ?? "",
    entry.entry_type,
    entry.updated_at,
    entry.sync_source,
  ];
}

export async function pullFinanceFromSheet(
  integration: Integration,
  userId: string,
): Promise<FinanceEntry[]> {
  const sheets = getSheetsClient(integration);
  const spreadsheetId = extractSpreadsheetId(
    integration.config.spreadsheet_id as string,
  );
  const sheetName = (integration.config.sheet_name as string) || "Transactions";

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:J`,
  });

  const rows = response.data.values ?? [];
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.toLowerCase());
  const headerMap = Object.fromEntries(
    SHEET_COLUMNS.map((col) => [col, headers.indexOf(col)]),
  ) as Record<(typeof SHEET_COLUMNS)[number], number>;

  return rows
    .slice(1)
    .map((row) => rowToEntry(userId, row, headerMap))
    .filter((e): e is FinanceEntry => e !== null);
}

export async function pushFinanceToSheet(
  integration: Integration,
  entries: FinanceEntry[],
): Promise<number> {
  if (entries.length === 0) return 0;

  const sheets = getSheetsClient(integration);
  const spreadsheetId = extractSpreadsheetId(
    integration.config.spreadsheet_id as string,
  );
  const sheetName = (integration.config.sheet_name as string) || "Transactions";

  const headerRow = [...SHEET_COLUMNS];
  const dataRows = entries.map(entryToRow);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [headerRow, ...dataRows],
    },
  });

  return entries.length;
}

export async function ensureSheetHeaders(integration: Integration) {
  const sheets = getSheetsClient(integration);
  const spreadsheetId = extractSpreadsheetId(
    integration.config.spreadsheet_id as string,
  );
  const sheetName = (integration.config.sheet_name as string) || "Transactions";

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:J1`,
  });

  if (!existing.data.values?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [[...SHEET_COLUMNS]] },
    });
  }
}

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? trimmed;
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
  const calendar = getCalendarClient(integration);
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

  return events;
}

export { encryptTokenSafe };
