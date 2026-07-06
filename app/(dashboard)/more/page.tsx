import Link from "next/link";
import {
  Activity,
  Calendar,
  ChevronRight,
  DollarSign,
  Settings,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

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
    description: "Spending & income",
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
    icon: Activity,
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
      <main className="px-4 py-4">
        <div className="space-y-2">
          {links.map(({ href, label, description, icon: Icon }) => (
            <Link key={href} href={href}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
