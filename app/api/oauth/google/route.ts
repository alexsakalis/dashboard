import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/integrations/google/client";

export async function GET() {
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
}
