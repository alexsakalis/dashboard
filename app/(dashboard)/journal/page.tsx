import { format } from "date-fns";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  getJournalEntry,
  getRecentJournalEntries,
  getWeeklyReview,
} from "@/lib/actions/notes";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { WeeklyReviewPanel } from "@/components/journal/WeeklyReviewPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function JournalToday() {
  const today = format(new Date(), "yyyy-MM-dd");
  const entry = await getJournalEntry(today);

  return <JournalEditor date={today} initialBody={entry?.body ?? ""} />;
}

async function JournalHistory() {
  const entries = await getRecentJournalEntries();

  if (entries.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No past entries yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <Card key={entry.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {format(new Date(`${entry.date}T12:00:00`), "EEEE, MMM d")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {entry.body || "Empty entry"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function JournalReview() {
  const review = await getWeeklyReview();
  return <WeeklyReviewPanel review={review} />;
}

export default function JournalPage() {
  return (
    <>
      <PageHeader title="Journal" subtitle="Daily notes & weekly review" />
      <main className="px-4 py-4">
        <Tabs defaultValue="today">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="today" className="flex-1">
              Today
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              History
            </TabsTrigger>
            <TabsTrigger value="review" className="flex-1">
              Review
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            <Suspense fallback={<CardSkeleton />}>
              <JournalToday />
            </Suspense>
          </TabsContent>

          <TabsContent value="history">
            <Suspense fallback={<CardSkeleton />}>
              <JournalHistory />
            </Suspense>
          </TabsContent>

          <TabsContent value="review">
            <Suspense fallback={<CardSkeleton />}>
              <JournalReview />
            </Suspense>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Also see{" "}
          <Link href="/health" className="underline underline-offset-2">
            Health
          </Link>{" "}
          for recovery trends.
        </p>
      </main>
    </>
  );
}
