export type ActivityEventKind =
  | "task"
  | "habit"
  | "workout"
  | "sync"
  | "calendar"
  | "journal"
  | "score";

export interface ActivityEvent {
  id: string;
  kind: ActivityEventKind;
  title: string;
  subtitle?: string;
  timestamp: string;
  href?: string;
  emoji?: string;
  points?: number;
}
