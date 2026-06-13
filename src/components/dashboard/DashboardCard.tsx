import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
  className?: string;
}

export function DashboardCard({
  title,
  action,
  children,
  className,
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-primary/50 bg-card p-5",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h2>
        {action && (
          <Link
            href={action.href}
            className="text-xs text-primary transition-colors hover:opacity-80"
          >
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

interface StatValueProps {
  value: string | number;
  label?: string;
}

export function StatValue({ value, label }: StatValueProps) {
  return (
    <div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      {label && (
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      )}
    </div>
  );
}
