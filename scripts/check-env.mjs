#!/usr/bin/env node
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const REQUIRED_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
  "ALLOWED_EMAILS",
  "TOKEN_ENCRYPTION_KEY",
  "CRON_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "OURA_CLIENT_ID",
  "OURA_CLIENT_SECRET",
];

const OPTIONAL_ALIASES = ["SUPABASE_URL"];

function loadEnvFile(path) {
  const env = {};
  if (!fs.existsSync(path)) return env;

  for (const line of fs.readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    env[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }

  return env;
}

function main() {
  const env = loadEnvFile(".env.local");
  const missing = REQUIRED_KEYS.filter((key) => !env[key]?.trim());

  if (missing.length > 0) {
    console.error("Missing keys in .env.local:");
    for (const key of missing) console.error(`  - ${key}`);
    process.exit(1);
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (
    supabaseUrl &&
    !/^https?:\/\//i.test(supabaseUrl) &&
    !/^[a-z0-9-]+\.supabase\.co\/?$/i.test(supabaseUrl)
  ) {
    console.warn(
      "Warning: NEXT_PUBLIC_SUPABASE_URL should be a full https URL, e.g. https://xyz.supabase.co",
    );
  }

  console.log("Local .env.local looks complete.");
  console.log("");
  console.log(
    "Production uses Vercel environment variables, not .env.local.",
  );
  console.log(
    "Copy the same keys to Vercel → Project → Settings → Environment Variables → Production.",
  );
  console.log("");
  console.log("Required keys:");
  for (const key of REQUIRED_KEYS) console.log(`  ${key}`);
  console.log("");
  console.log("Optional aliases:");
  for (const key of OPTIONAL_ALIASES) console.log(`  ${key}`);
  console.log("");
  console.log(
    "Set NEXT_PUBLIC_APP_URL to your production URL on Vercel, e.g. https://your-app.vercel.app",
  );
  console.log("");
  console.log("After updating Vercel env vars, redeploy the project.");

  const vercel = spawnSync("npx", ["vercel", "--version"], {
    stdio: "pipe",
    encoding: "utf8",
  });

  if (vercel.status === 0) {
    console.log("");
    console.log(
      "Optional: run `npx vercel env pull .env.vercel` after linking the project to inspect production values.",
    );
  }
}

main();
