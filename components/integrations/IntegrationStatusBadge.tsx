import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export function IntegrationStatusBadge({
  status,
  synced,
  message,
}: {
  status?: string;
  synced?: string | null;
  message?: string | null;
}) {
  if (!status) {
    return <Badge variant="secondary">Not connected</Badge>;
  }

  const variant =
    status === "active"
      ? "default"
      : status === "reauth_required"
        ? "secondary"
        : "destructive";

  return (
    <div className="text-right">
      <Badge variant={variant}>{status.replace("_", " ")}</Badge>
      {synced && (
        <p className="mt-1 text-xs text-muted-foreground">
          Synced {formatDistanceToNow(new Date(synced), { addSuffix: true })}
        </p>
      )}
      {message && (
        <p className="mt-1 max-w-[12rem] truncate text-xs text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
