/**
 * Route classification for Supabase auth middleware.
 *
 * Public routes are always allowed through without a session.
 * Auth pages (/login, /signup) are public but handle their own
 * "already signed in" redirect on the server.
 * Everything else is treated as a protected dashboard or API route.
 */

const AUTH_PAGES = ["/login", "/signup"] as const;

const PUBLIC_PATHS = [
  "/auth/callback",
  "/api/auth/callback",
  "/api/cron/sync",
  "/api/health",
] as const;

const PUBLIC_PREFIXES = ["/api/cron/", "/api/oauth/"] as const;

export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isPublicRoute(pathname: string): boolean {
  if (isAuthPage(pathname)) return true;

  if (PUBLIC_PATHS.some((path) => pathname === path)) return true;

  if (pathname.startsWith("/auth/callback")) return true;
  if (pathname.startsWith("/api/auth/callback")) return true;
  if (pathname.startsWith("/api/cron/sync")) return true;

  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isProtectedRoute(pathname: string): boolean {
  return !isPublicRoute(pathname);
}

/** True when middleware should not run auth logic (static assets). */
export function shouldSkipAuth(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.png" ||
    pathname.startsWith("/icons/") ||
    pathname === "/manifest.json" ||
    pathname === "/manifest.webmanifest" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|css|js)$/i.test(
      pathname,
    )
  );
}
