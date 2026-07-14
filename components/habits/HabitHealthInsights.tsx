import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HabitHealthInsights({ insights }: { insights: string[] }) {
  if (insights.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Health patterns</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {insights.map((line) => (
            <li key={line} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {line}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
