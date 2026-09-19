import { timingSafeEqual } from "crypto";
import { getCronSecret } from "@/lib/env";

const BEARER_PREFIX = "Bearer ";

export function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith(BEARER_PREFIX)) {
    return false;
  }

  let expectedSecret: string;
  try {
    expectedSecret = getCronSecret();
  } catch {
    return false;
  }

  const providedSecret = authHeader.slice(BEARER_PREFIX.length);
  const provided = Buffer.from(providedSecret);
  const expected = Buffer.from(expectedSecret);

  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}
