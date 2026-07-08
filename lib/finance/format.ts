import { differenceInCalendarDays, format, parseISO } from "date-fns";

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDueDateLabel(dueDate: string | null): string | null {
  if (!dueDate) return null;

  const due = parseISO(dueDate);
  const days = differenceInCalendarDays(due, new Date());

  if (days < 0) {
    return `${Math.abs(days)}d overdue`;
  }
  if (days === 0) {
    return "Due today";
  }
  if (days === 1) {
    return "Due tomorrow";
  }
  if (days <= 7) {
    return `Due in ${days}d`;
  }

  return format(due, "MMM d");
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value * 100)}%`;
}

export function formatApr(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(2)}% APR`;
}

export function formatLastFour(lastFour: string | null): string {
  if (!lastFour) return "";
  return `•••• ${lastFour}`;
}

export function formatCardLabel(
  name: string,
  provider: string | null,
  lastFour: string | null,
): string {
  const parts = [name];
  if (provider) parts.push(provider);
  if (lastFour) parts.push(formatLastFour(lastFour));
  return parts.join(" · ");
}

export function getCardStatusVariant(
  status: string | null,
): "default" | "secondary" | "destructive" | "outline" {
  if (!status) return "secondary";

  switch (status) {
    case "paid_off":
      return "default";
    case "closed":
      return "secondary";
    case "active":
      return "outline";
    default:
      return "outline";
  }
}

export function getCardStatusLabel(status: string | null): string {
  if (!status) return "Active";
  switch (status) {
    case "paid_off":
      return "Paid off";
    case "closed":
      return "Closed";
    case "active":
      return "Active";
    default:
      return status;
  }
}

/** @deprecated use getCardStatusVariant */
export function getStatusVariant(
  status: string | null,
): "default" | "secondary" | "destructive" | "outline" {
  return getCardStatusVariant(status);
}
