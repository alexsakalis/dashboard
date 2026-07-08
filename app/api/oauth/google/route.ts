import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/integrations/google/client";
import { getAppUrl } from "@/lib/env";

export async function GET() {
  const appUrl = getAppUrl();

  try {
    const state = crypto.randomUUID();
    const url = getGoogleAuthUrl(state);

    const response = NextResponse.redirect(url);
    response.cookies.set("google_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
    });

    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Google OAuth not configured";
    return NextResponse.redirect(
      `${appUrl}/settings/integrations?error=${encodeURIComponent(message)}`,
    );
  }
}
