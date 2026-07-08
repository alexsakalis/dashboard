import type { ProviderDefinition, SyncContext, SyncResult } from "@/lib/integrations/types";
import type { Integration } from "@/types";

/**
 * Apple Health placeholder provider.
 *
 * Future ingestion paths:
 * - Health Auto Export webhook
 * - Apple Shortcuts POST endpoint
 * - CSV/XML batch import route
 * - Companion app sync
 */
export const appleHealthProvider: ProviderDefinition = {
  provider: "apple_health",
  displayName: "Apple Health",

  isConfigured() {
    return true;
  },

  isEnabled(integration: Integration) {
    return integration.enabled !== false;
  },

  async sync(_ctx: SyncContext): Promise<SyncResult> {
    return {
      provider: "apple_health",
      status: "skipped",
      message: "Apple Health import not configured",
      durationMs: 0,
    };
  },
};
