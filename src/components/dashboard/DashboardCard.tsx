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
        "rounded-xl border border-border bg-card p-5",
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
            className="text-xs text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
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
