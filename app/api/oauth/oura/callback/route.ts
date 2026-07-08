import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { getAppUrl } from "@/lib/env";
import { exchangeOuraCode } from "@/lib/integrations/oura/oauth";
import { saveOuraIntegration } from "@/lib/actions/integrations";

export async function GET(request: Request) {
  const appUrl = getAppUrl();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/settings/integrations?error=${error}`,
    );
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("oura_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(
      `${appUrl}/settings/integrations?error=invalid_state`,
    );
  }

  try {
    await requireUser();

    const tokens = await exchangeOuraCode(code);
    if (!tokens.refreshToken) {
      return NextResponse.redirect(
        `${appUrl}/settings/integrations?error=no_refresh_token`,
      );
    }

    await saveOuraIntegration(
      tokens.refreshToken,
      tokens.accessToken,
      tokens.expiresAt,
    );

    cookieStore.delete("oura_oauth_state");

    return NextResponse.redirect(
      `${appUrl}/settings/integrations?success=oura`,
    );
  } catch (err) {
    console.error("Oura OAuth callback error:", err);
    return NextResponse.redirect(
      `${appUrl}/settings/integrations?error=callback_failed`,
    );
  }
}
