import Link from "next/link";
import { ChevronRight, History, LineChart, Scale, LayoutTemplate, Dumbbell, BarChart3, Settings, CalendarDays, Calculator } from "lucide-react";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";
import { getGymDashboard, getLastWorkoutReference, getActiveWorkout } from "@/lib/actions/gym";
import { getGymHealthInsight } from "@/lib/gym/health-insight";
import { StartWorkoutSheet } from "@/components/gym/StartWorkoutSheet";
import { QuickRepeatButtons } from "@/components/gym/QuickRepeatButtons";
import { ActiveWorkoutBanner } from "@/components/gym/ActiveWorkoutBanner";
import { GymHealthInsightCard } from "@/components/gym/GymHealthInsightCard";
import {
  GymDashboardStats,
  LastWorkoutCard,
  RecentPRsList,
} from "@/components/gym/GymDashboardStats";
import { TopProgressingList } from "@/components/gym/TopProgressingList";
import { SPLIT_LABELS } from "@/lib/gym/constants";
import { Card } from "@/components/ui/card";

async function GymDashboardContent() {
  const [summary, activeWorkout] = await Promise.all([
    getGymDashboard(),
    getActiveWorkout(),
  ]);
  const insight = await getGymHealthInsight(summary);
  const lastRef = await getLastWorkoutReference(summary.suggestedSplit);

  const navLinks = [
    { href: "/gym/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/gym/plates", label: "Plate calculator", icon: Calculator },
    { href: "/gym/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/gym/exercises", label: "Exercises", icon: Dumbbell },
    { href: "/gym/history", label: "History", icon: History },
    { href: "/gym/progress", label: "Progress", icon: LineChart },
    { href: "/gym/body-weight", label: "Body weight", icon: Scale },
    { href: "/gym/templates", label: "Templates", icon: LayoutTemplate },
    { href: "/gym/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="space-y-5">
      {activeWorkout && <ActiveWorkoutBanner workout={activeWorkout} />}

      <GymHealthInsightCard insight={insight} />

      <GymDashboardStats summary={summary} />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="section-label">Quick start</h2>
          <StartWorkoutSheet
            defaultSplit={summary.suggestedSplit}
            lastReference={lastRef}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Suggested next: {SPLIT_LABELS[summary.suggestedSplit]}
          {insight.intensity === "heavy" && " · push intensity"}
          {insight.intensity === "light" && " · keep it light"}
          {insight.intensity === "rest" && " · recovery focus"}
        </p>
        <QuickRepeatButtons />
      </div>

      <LastWorkoutCard summary={summary} />
      <TopProgressingList exercises={summary.topProgressing} />
      <RecentPRsList summary={summary} />

      <div className="space-y-2">
        <h2 className="section-label">Explore</h2>
        <Card className="gap-0 overflow-hidden py-0">
          {navLinks.map(({ href, label, icon: Icon }, index) => (
            <Link
              key={href}
              href={href}
              className="block transition-colors hover:bg-muted/50 active:bg-muted/70"
            >
              <div
                className={`flex items-center gap-4 px-4 py-3.5 ${
                  index < navLinks.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="flex-1 font-medium">{label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </Card>
      </div>
    </div>
  );
}

export default function GymPage() {
  return (
    <>
      <PageHeader
        title="Gym"
        subtitle="Training with Oura recovery context"
      />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <GymDashboardContent />
        </Suspense>
      </main>
    </>
  );
}
