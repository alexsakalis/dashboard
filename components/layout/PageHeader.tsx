import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-background/85 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl supports-backdrop-filter:bg-background/60",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-[1.35rem] font-semibold tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
