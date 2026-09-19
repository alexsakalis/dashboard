import assert from "node:assert/strict";
import test from "node:test";
import {
  getCronSecret,
  getDeploymentHealth,
  getTokenEncryptionSecret,
} from "../lib/env.ts";
import { getSafeRedirectPath } from "../lib/safe-redirect.ts";

const ORIGINAL_ENV = { ...process.env };

function restoreEnv() {
  process.env = { ...ORIGINAL_ENV };
}

test.afterEach(restoreEnv);

test("cron secret rejects missing and placeholder values", () => {
  delete process.env.CRON_SECRET;
  assert.throws(() => getCronSecret(), /Missing CRON_SECRET/);

  process.env.CRON_SECRET = "   ";
  assert.throws(() => getCronSecret(), /Missing CRON_SECRET/);

  process.env.CRON_SECRET = "your-32-byte-hex-key";
  assert.throws(() => getCronSecret(), /Missing CRON_SECRET/);
  assert.equal(getDeploymentHealth().cronSecret, false);
});

test("cron secret accepts trimmed non-placeholder values", () => {
  process.env.CRON_SECRET = "  real-cron-secret  ";
  assert.equal(getCronSecret(), "real-cron-secret");
  assert.equal(getDeploymentHealth().cronSecret, true);
});

test("token encryption secret rejects missing and placeholder values", () => {
  delete process.env.TOKEN_ENCRYPTION_KEY;
  assert.throws(
    () => getTokenEncryptionSecret(),
    /Missing TOKEN_ENCRYPTION_KEY/,
  );

  process.env.TOKEN_ENCRYPTION_KEY = "your-32-byte-hex-key";
  assert.throws(
    () => getTokenEncryptionSecret(),
    /Missing TOKEN_ENCRYPTION_KEY/,
  );
  assert.equal(getDeploymentHealth().tokenEncryptionKey, false);
});

test("token encryption secret accepts trimmed non-placeholder values", () => {
  process.env.TOKEN_ENCRYPTION_KEY = "  real-token-secret  ";
  assert.equal(getTokenEncryptionSecret(), "real-token-secret");
  assert.equal(getDeploymentHealth().tokenEncryptionKey, true);
});

test("safe redirect path only allows same-origin relative paths", () => {
  assert.equal(getSafeRedirectPath(null), "/");
  assert.equal(getSafeRedirectPath("@attacker.example"), "/");
  assert.equal(getSafeRedirectPath("//attacker.example/path"), "/");
  assert.equal(getSafeRedirectPath("https://attacker.example/path"), "/");
  assert.equal(
    getSafeRedirectPath("/settings/integrations?connected=1#status"),
    "/settings/integrations?connected=1#status",
  );
});
