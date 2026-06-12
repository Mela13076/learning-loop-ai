import { DashboardCard } from "./DashboardCard";

interface StreakCardProps {
  streak: number;
  lastStudiedAt: Date | null;
}

export function StreakCard({ streak, lastStudiedAt }: StreakCardProps) {
  const lastStudiedLabel = lastStudiedAt
    ? `Last studied ${formatRelativeDate(lastStudiedAt)}`
    : "No sessions yet — start your streak today!";

  return (
    <DashboardCard title="Current Streak">
      <div className="flex items-end gap-2">
        <p className="text-3xl font-bold tracking-tight">{streak}</p>
        <p className="mb-1 text-lg font-medium text-muted-foreground">
          {streak === 1 ? "day" : "days"}
        </p>
        {streak > 0 && (
          <span className="mb-1 text-xl" aria-hidden>
            🔥
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{lastStudiedLabel}</p>
    </DashboardCard>
  );
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  if (date >= todayStart) return "today";
  if (date >= yesterdayStart) return "yesterday";

  const diffMs = todayStart.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return `${diffDays} days ago`;
}
