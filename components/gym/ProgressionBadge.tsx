import { Badge } from "@/components/ui/badge";
import type { ProgressionStatus } from "@/types/gym";

const VARIANTS: Record<
  ProgressionStatus,
  { label: string; className: string }
> = {
  improved: { label: "PR", className: "bg-green-500/15 text-green-600" },
  stalled: { label: "Hold", className: "bg-amber-500/15 text-amber-600" },
  regressed: { label: "Down", className: "bg-red-500/15 text-red-600" },
  new: { label: "New", className: "bg-primary/15 text-primary" },
};

export function ProgressionBadge({ status }: { status: ProgressionStatus }) {
  const v = VARIANTS[status];
  return (
    <Badge variant="secondary" className={`text-[10px] ${v.className}`}>
      {v.label}
    </Badge>
  );
}
