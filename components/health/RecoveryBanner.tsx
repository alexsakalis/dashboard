import { cn } from "@/lib/utils";
import type { RecoveryHint } from "@/lib/health/trends";

const levelStyles = {
  high: "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
  moderate: "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
  low: "border-rose-500/30 bg-rose-500/10 text-rose-950 dark:text-rose-100",
  neutral: "border-border/50 bg-muted/40 text-muted-foreground",
} as const;

export function RecoveryBanner({ hint }: { hint: RecoveryHint }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 text-sm leading-relaxed",
        levelStyles[hint.level],
      )}
    >
      {hint.message}
    </div>
  );
}
