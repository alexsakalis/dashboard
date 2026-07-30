import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getGoogleAuthUrl } from "@/lib/integrations/google/client";
import { getOAuthBaseUrl } from "@/lib/env";
import {
  createOAuthStateCookieValue,
  getOAuthStateCookieOptions,
} from "@/lib/oauth/state";

export async function GET(request: Request) {
  const appUrl = getOAuthBaseUrl(request);
  const oauthBaseUrl = appUrl;
  const user = await requireUser();

  try {
    const state = crypto.randomUUID();
    const url = getGoogleAuthUrl(state, oauthBaseUrl);

    const response = NextResponse.redirect(url);
    response.cookies.set(
      "google_oauth_state",
      createOAuthStateCookieValue(state, user.id),
      getOAuthStateCookieOptions(),
    );

    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Google OAuth not configured";
    return NextResponse.redirect(
      `${appUrl}/settings/integrations?error=${encodeURIComponent(message)}`,
    );
  }
}
