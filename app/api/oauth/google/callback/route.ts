import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { exchangeGoogleCode } from "@/lib/integrations/google/client";
import { saveGoogleIntegration } from "@/lib/actions/integrations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=${error}`,
    );
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("google_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=invalid_state`,
    );
  }

  try {
    await requireUser();

    const tokens = await exchangeGoogleCode(code);
    if (!tokens.refreshToken) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=no_refresh_token`,
      );
    }

    await saveGoogleIntegration(
      tokens.refreshToken,
      tokens.accessToken,
      tokens.expiresAt,
      { calendar_id: "all" },
    );

    cookieStore.delete("google_oauth_state");

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?success=google`,
    );
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=callback_failed`,
    );
  }
}
