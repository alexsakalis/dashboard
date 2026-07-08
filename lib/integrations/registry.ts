import { appleHealthProvider } from "@/lib/integrations/providers/apple-health";
import { googleCalendarProvider } from "@/lib/integrations/providers/google-calendar";
import { ouraProvider } from "@/lib/integrations/providers/oura";
import type { ProviderDefinition } from "@/lib/integrations/types";

const providers: ProviderDefinition[] = [
  ouraProvider,
  googleCalendarProvider,
  appleHealthProvider,
];

export function getProvider(key: string): ProviderDefinition | undefined {
  return providers.find((p) => p.provider === key);
}

export function getConfiguredProviders(): ProviderDefinition[] {
  return providers.filter((p) => p.isConfigured());
}

export function getAllProviders(): ProviderDefinition[] {
  return providers;
}

export function getAllProviderKeys(): string[] {
  return providers.map((p) => p.provider);
}

export function getProviderDisplayName(key: string): string {
  return getProvider(key)?.displayName ?? key;
}
