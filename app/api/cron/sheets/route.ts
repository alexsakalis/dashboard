import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  pullFinanceFromSheet,
  pushFinanceToSheet,
  ensureSheetHeaders,
} from "@/lib/integrations/google/client";

function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createServiceClient();
    const { data: integrations, error } = await supabase
      .from("integrations")
      .select("*")
      .eq("provider", "google")
      .eq("status", "active");

    if (error) throw error;

    let synced = 0;
    for (const integration of integrations ?? []) {
      if (!integration.config?.spreadsheet_id) continue;

      try {
        await ensureSheetHeaders(integration);

        const sheetEntries = await pullFinanceFromSheet(
          integration,
          integration.user_id,
        );

        for (const entry of sheetEntries) {
          const { data: existing } = await supabase
            .from("finance_entries")
            .select("*")
            .eq("row_id", entry.row_id)
            .maybeSingle();

          if (!existing) {
            await supabase.from("finance_entries").insert({
              ...entry,
              user_id: integration.user_id,
            });
          } else if (
            new Date(entry.updated_at) > new Date(existing.updated_at) &&
            entry.sync_source === "sheet"
          ) {
            await supabase
              .from("finance_entries")
              .update({
                date: entry.date,
                amount: entry.amount,
                category: entry.category,
                merchant: entry.merchant,
                account: entry.account,
                notes: entry.notes,
                entry_type: entry.entry_type,
                updated_at: entry.updated_at,
                sync_source: "sheet",
              })
              .eq("row_id", entry.row_id);
          }
        }

        const { data: appEntries } = await supabase
          .from("finance_entries")
          .select("*")
          .eq("user_id", integration.user_id)
          .eq("sync_source", "app");

        if (appEntries?.length) {
          const { data: allEntries } = await supabase
            .from("finance_entries")
            .select("*")
            .eq("user_id", integration.user_id)
            .order("date", { ascending: false });

          if (allEntries) {
            await pushFinanceToSheet(integration, allEntries);
          }
        }

        await supabase.from("finance_sync_log").insert({
          user_id: integration.user_id,
          direction: "pull",
          rows_affected: sheetEntries.length,
          status: "success",
        });

        await supabase
          .from("integrations")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", integration.id);

        synced++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        await supabase.from("finance_sync_log").insert({
          user_id: integration.user_id,
          direction: "pull",
          rows_affected: 0,
          status: "error",
          error: message,
        });
        console.error(`Sheets sync failed for user ${integration.user_id}:`, err);
      }
    }

    return NextResponse.json({ synced, total: integrations?.length ?? 0 });
  } catch (error) {
    console.error("Sheets cron error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
