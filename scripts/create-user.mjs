import fs from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    env[trimmed.slice(0, i)] = trimmed.slice(i + 1);
  }
  return env;
}

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error("Usage: npm run create-user -- <password>");
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const env = loadEnv();
const email = env.ALLOWED_EMAILS?.split(",")[0]?.trim();

if (!email) {
  console.error("Set ALLOWED_EMAILS in .env.local first.");
  process.exit(1);
}

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars in .env.local.");
  process.exit(1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data: listData, error: listError } =
  await supabase.auth.admin.listUsers({ perPage: 1000 });

if (listError) {
  console.error("Failed to list users:", listError.message);
  process.exit(1);
}

const existing = listData.users.find(
  (user) => user.email?.toLowerCase() === email.toLowerCase(),
);

if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });

  if (error) {
    console.error("Failed to set password:", error.message);
    process.exit(1);
  }

  console.log(`Password set for existing account: ${email}`);
} else {
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error("Failed to create account:", error.message);
    process.exit(1);
  }

  console.log(`Account created: ${email}`);
}

console.log("Sign in at /login with your email and password.");
