const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

type OAuthStatePayload = {
  state: string;
  userId: string;
};

export function createOAuthStateCookieValue(
  state: string,
  userId: string,
): string {
  return Buffer.from(JSON.stringify({ state, userId }), "utf8").toString(
    "base64url",
  );
}

export function parseOAuthStateCookieValue(
  value: string | undefined,
): OAuthStatePayload | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<OAuthStatePayload>;

    if (typeof parsed.state !== "string" || parsed.state.length === 0) {
      return null;
    }

    if (typeof parsed.userId !== "string" || parsed.userId.length === 0) {
      return null;
    }

    return { state: parsed.state, userId: parsed.userId };
  } catch {
    return null;
  }
}

export function getOAuthStateCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  };
}
