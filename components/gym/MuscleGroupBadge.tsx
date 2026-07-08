import { Badge } from "@/components/ui/badge";

export function MuscleGroupBadge({ group }: { group: string | null }) {
  if (!group) return null;
  return (
    <Badge variant="secondary" className="text-[10px] capitalize">
      {group}
    </Badge>
  );
}
