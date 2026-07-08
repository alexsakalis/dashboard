import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTED_TOKEN_PATTERN = /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i;

function getKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY?.trim();
  if (!secret || secret.includes("your-")) {
    throw new Error("TOKEN_ENCRYPTION_KEY is not set");
  }
  return scryptSync(secret, "dashboard-salt", 32);
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptToken(ciphertext: string): string {
  const key = getKey();
  const [ivHex, tagHex, encryptedHex] = ciphertext.split(":");
  if (!ivHex || !tagHex || !encryptedHex) {
    throw new Error("Invalid encrypted token format");
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/** Decrypt OAuth tokens stored on integration rows. Supports legacy plaintext values. */
export function decryptIntegrationToken(stored: string): string {
  if (!stored) {
    throw new Error("OAuth token missing. Reconnect this integration in Settings.");
  }

  if (!ENCRYPTED_TOKEN_PATTERN.test(stored)) {
    return stored;
  }

  try {
    return decryptToken(stored);
  } catch {
    throw new Error(
      "Could not decrypt stored OAuth token. Disconnect and reconnect this integration, or verify TOKEN_ENCRYPTION_KEY matches the value used when you connected.",
    );
  }
}

export function encryptTokenSafe(plaintext: string): string {
  try {
    return encryptToken(plaintext);
  } catch {
    return plaintext;
  }
}

export function decryptTokenSafe(ciphertext: string): string {
  try {
    return decryptIntegrationToken(ciphertext);
  } catch {
    return ciphertext;
  }
}
