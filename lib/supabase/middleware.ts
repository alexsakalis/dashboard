import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAuthDisabled } from "@/lib/auth-config";
import { isEmailAllowed } from "@/lib/auth";
import { hasSupabasePublicEnv, getSupabasePublicEnv } from "@/lib/env";
import {
  isAuthPage,
  isProtectedRoute,
  isPublicRoute,
  shouldSkipAuth,
} from "@/lib/supabase/auth-routes";

/**
 * Copy refreshed Supabase session cookies onto a redirect response.
 * Without this, token refresh in getUser() is lost and the browser/session
 * can flip between authenticated and anonymous on every request (redirect loop).
 */
function redirectWithSessionCookies(
  request: NextRequest,
  supabaseResponse: NextResponse,
  pathname: string,
  searchParams?: Record<string, string>,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }
  }

  // Avoid redirect loops: never redirect to the same path + query we are on.
  if (
    url.pathname === request.nextUrl.pathname &&
    url.search === request.nextUrl.search
  ) {
    return supabaseResponse;
  }

  const redirectResponse = NextResponse.redirect(url);
  // Preserve full cookie attributes (httpOnly, secure, sameSite) — required on Vercel.
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and public files never need auth checks.
  if (shouldSkipAuth(pathname)) {
    return NextResponse.next({ request });
  }

  // Missing Supabase env: only public routes work; everything else shows setup error.
  if (!hasSupabasePublicEnv()) {
    if (isPublicRoute(pathname)) {
      return NextResponse.next({ request });
    }

    if (pathname === "/login" && request.nextUrl.searchParams.has("error")) {
      return NextResponse.next({ request });
    }

    return redirectWithSessionCookies(request, NextResponse.next({ request }), "/login", {
      error: "server_config",
    });
  }

  // Local dev bypass: auth pages redirect home; all other routes pass through.
  if (isAuthDisabled()) {
    if (isAuthPage(pathname) && pathname !== "/") {
      return redirectWithSessionCookies(
        request,
        NextResponse.next({ request }),
        "/",
      );
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const { url, anonKey } = getSupabasePublicEnv();

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    // getUser() validates the JWT and refreshes expired tokens via setAll above.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Allowlisted emails only — sign out and send back to login.
    if (user && !isEmailAllowed(user.email ?? "")) {
      await supabase.auth.signOut();

      return redirectWithSessionCookies(request, supabaseResponse, "/login", {
        error: "unauthorized",
      });
    }

    // Protected dashboard/API routes: require a valid session.
    if (!user && isProtectedRoute(pathname)) {
      return redirectWithSessionCookies(request, supabaseResponse, "/login");
    }

    return supabaseResponse;
  } catch (error) {
    console.error("Middleware Supabase error:", error);

    // On errors, still allow public/auth routes so login and callbacks stay reachable.
    if (isPublicRoute(pathname) || isAuthPage(pathname)) {
      return NextResponse.next({ request });
    }

    if (pathname === "/login") {
      return NextResponse.next({ request });
    }

    return redirectWithSessionCookies(request, NextResponse.next({ request }), "/login", {
      error: "server_config",
    });
  }
}
