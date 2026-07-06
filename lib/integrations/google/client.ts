import { format } from "date-fns";
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

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google/callback`,
  );
}

export function getGoogleAuthUrl(state: string): string {
  const oauth2 = getOAuthClient();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/calendar.events.readonly",
    ],
    state,
  });
}

export function getSheetsClient(integration: Integration) {
  const oauth2 = getOAuthClient();
  const refreshToken = integration.refresh_token_enc
    ? decryptTokenSafe(integration.refresh_token_enc)
    : null;

  if (!refreshToken) {
    throw new Error("Google refresh token not configured");
  }

  oauth2.setCredentials({ refresh_token: refreshToken });
  return google.sheets({ version: "v4", auth: oauth2 });
}

export function getCalendarClient(integration: Integration) {
  const oauth2 = getOAuthClient();
  const refreshToken = integration.refresh_token_enc
    ? decryptTokenSafe(integration.refresh_token_enc)
    : null;

  if (!refreshToken) {
    throw new Error("Google refresh token not configured");
  }

  oauth2.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: "v3", auth: oauth2 });
}

export async function exchangeGoogleCode(code: string) {
  const oauth2 = getOAuthClient();
  const { tokens } = await oauth2.getToken(code);
  return {
    accessToken: tokens.access_token ?? null,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt: tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : null,
  };
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
  const spreadsheetId = integration.config.spreadsheet_id as string;
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
  const spreadsheetId = integration.config.spreadsheet_id as string;
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
  const spreadsheetId = integration.config.spreadsheet_id as string;
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

export async function fetchCalendarEvents(integration: Integration) {
  const calendar = getCalendarClient(integration);
  const calendarId =
    (integration.config.calendar_id as string) || "primary";
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const response = await calendar.events.list({
    calendarId,
    timeMin: now.toISOString(),
    timeMax: endOfWeek.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 50,
  });

  return (response.data.items ?? []).map((event) => ({
    external_id: event.id ?? crypto.randomUUID(),
    title: event.summary ?? "Untitled",
    start_time:
      event.start?.dateTime ??
      `${event.start?.date}T00:00:00.000Z`,
    end_time:
      event.end?.dateTime ?? `${event.end?.date}T23:59:59.000Z`,
    all_day: !event.start?.dateTime,
    location: event.location ?? null,
    raw_payload: event,
  }));
}

export { encryptTokenSafe };
