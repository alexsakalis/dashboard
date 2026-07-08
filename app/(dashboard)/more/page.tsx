import Link from "next/link";
import {
  Activity,
  Calendar,
  ChevronRight,
  DollarSign,
  Settings,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const links = [
  {
    href: "/health",
    label: "Health",
    description: "Sleep, readiness, steps",
    icon: Activity,
  },
  {
    href: "/finance",
    label: "Finance",
    description: "Credit card tracker",
    icon: DollarSign,
  },
  {
    href: "/calendar",
    label: "Calendar",
    description: "Today's events",
    icon: Calendar,
  },
  {
    href: "/habits",
    label: "Habits",
    description: "Daily routines",
    icon: Target,
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Account & integrations",
    icon: Settings,
  },
];

export default function MorePage() {
  return (
    <>
      <PageHeader title="More" />
      <main className="px-4 py-5">
        <Card className="gap-0 overflow-hidden py-0">
          {links.map(({ href, label, description, icon: Icon }, index) => (
            <Link
              key={href}
              href={href}
              className="block transition-colors hover:bg-muted/50 active:bg-muted/70"
            >
              <div
                className={cn(
                  "flex w-full items-center gap-4 px-4 py-3.5",
                  index < links.length - 1 && "border-b border-border",
                )}
              >
                <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </Card>
      </main>
    </>
  );
}
