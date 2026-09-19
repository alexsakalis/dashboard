import { describe, expect, it } from "vitest";
import { isIntegrationSyncable } from "@/lib/integrations/types";

describe("isIntegrationSyncable", () => {
  it("keeps transient error states retryable", () => {
    expect(isIntegrationSyncable({ enabled: true, status: "error" })).toBe(true);
  });

  it("blocks explicit disables and integrations requiring reauth", () => {
    expect(isIntegrationSyncable({ enabled: false, status: "active" })).toBe(false);
    expect(isIntegrationSyncable({ enabled: true, status: "reauth_required" })).toBe(
      false,
    );
  });
});
