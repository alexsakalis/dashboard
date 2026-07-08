import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DashboardSummary,
  Integration,
  ProviderSyncStatus,
  SyncTrigger,
} from "@/types";

export type { SyncTrigger, ProviderSyncStatus };

export interface SyncContext {
  integration: Integration;
  supabase: SupabaseClient;
  userId: string;
  trigger: SyncTrigger;
}

export interface SyncResult {
  provider: string;
  status: ProviderSyncStatus;
  message: string;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

export interface SummaryContext {
  userId: string;
  supabase: SupabaseClient;
}

export interface ProviderDefinition {
  provider: string;
  displayName: string;
  isConfigured(): boolean;
  isEnabled(integration: Integration): boolean;
  sync(ctx: SyncContext): Promise<SyncResult>;
  contributeToSummary?(
    ctx: SummaryContext,
  ): Promise<Partial<DashboardSummary>>;
}

export interface RunIntegrationsOptions {
  providers?: string[];
  trigger?: SyncTrigger;
}

export interface RunSummary {
  success: boolean;
  durationMs: number;
  usersProcessed: number;
  results: SyncResult[];
  errors: string[];
}

export function isReauthError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("expired") ||
    lower.includes("reconnect") ||
    lower.includes("invalid_grant") ||
    lower.includes("could not decrypt") ||
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("denied access")
  );
}
