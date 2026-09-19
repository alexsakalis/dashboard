export function getSafeRedirectPath(
  nextPath: string | null,
  fallback = "/",
): string {
  if (!nextPath?.startsWith("/") || nextPath.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(nextPath, "https://dashboard.local");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
