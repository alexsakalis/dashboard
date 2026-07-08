import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 proxy entry (replaces middleware.ts).
 * Runs on Vercel production as "Proxy (Middleware)".
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Skip static assets, Next internals, favicon/icons, manifest, and
     * common public file extensions so auth logic never runs on them.
     */
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|icons/|manifest.json|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|css|js)$).*)",
  ],
};
