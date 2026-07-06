"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithPassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(signInWithPassword, null);
  const urlError = searchParams.get("error");

  const error =
    state?.error ??
    (urlError === "unauthorized"
      ? "This email is not authorized"
      : urlError === "server_config"
        ? "Server misconfigured. Set Supabase env vars in Vercel."
        : urlError === "auth_callback_error"
          ? "Sign in failed. Try again."
          : null);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Command Center</CardTitle>
          <CardDescription>
            Your personal daily-life dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
