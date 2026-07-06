import { Card, CardContent } from "@/components/ui/card";

export function CardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-1/3 rounded bg-muted" />
          <div className="h-8 w-1/2 rounded bg-muted" />
          <div className="h-2 w-full rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
