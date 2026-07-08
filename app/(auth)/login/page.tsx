import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasSupabasePublicEnv } from "@/lib/env";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  // Only leave /login when the server confirms a valid session (not stale cookies).
  if (hasSupabasePublicEnv()) {
    try {
      const user = await getCurrentUser();
      if (user) {
        redirect("/");
      }
    } catch (error) {
      console.error("Login page session check failed:", error);
    }
  }

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
