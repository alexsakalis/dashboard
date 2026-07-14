import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

export function HabitStreakDots({
  streak,
  recentCompletions,
}: {
  streak: number;
  recentCompletions: string[];
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const days = Array.from({ length: 7 }, (_, index) =>
    format(subDays(new Date(), 6 - index), "yyyy-MM-dd"),
  );
  const completed = new Set(recentCompletions);

  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="flex gap-1">
        {days.map((date) => (
          <span
            key={date}
            className={cn(
              "h-2 w-2 rounded-full",
              completed.has(date)
                ? "bg-primary"
                : date === today
                  ? "bg-muted-foreground/25 ring-1 ring-primary/30"
                  : "bg-muted-foreground/15",
            )}
            title={format(new Date(`${date}T12:00:00`), "MMM d")}
          />
        ))}
      </div>
      {streak > 0 && (
        <span className="text-[11px] text-muted-foreground">{streak}d streak</span>
      )}
    </div>
  );
}
