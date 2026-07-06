"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      className="w-full"
      disabled={isPending}
      onClick={() => startTransition(async () => await signOut())}
    >
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
