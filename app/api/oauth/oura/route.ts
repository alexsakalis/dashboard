import { NextResponse } from "next/server";
import { getOuraAuthUrl } from "@/lib/integrations/oura/oauth";

export async function GET() {
  try {
    const state = crypto.randomUUID();
    const url = getOuraAuthUrl(state);

    const response = NextResponse.redirect(url);
    response.cookies.set("oura_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Oura OAuth not configured";
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=${encodeURIComponent(message)}`,
    );
  }
}
