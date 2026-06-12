import Link from "next/link";
import type { Difficulty } from "@/generated/prisma/enums";
import { ProgressBar } from "@/components/topics/ProgressBar";

interface LearningPathCardProps {
  id: string;
  title: string;
  description: string;
  level: Difficulty;
  topicCount: number;
  completedCount?: number;
  inProgressCount?: number;
}

const LEVEL_BADGE: Record<Difficulty, string> = {
  BEGINNER: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  INTERMEDIATE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  ADVANCED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

const LEVEL_LABEL: Record<Difficulty, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export function LearningPathCard({
  id,
  title,
  description,
  level,
  topicCount,
  completedCount = 0,
  inProgressCount = 0,
}: LearningPathCardProps) {
  const progressPct =
    topicCount > 0 ? Math.round((completedCount / topicCount) * 100) : 0;
  const hasStarted = completedCount > 0 || inProgressCount > 0;

  return (
    <Link
      href={`/paths/${id}`}
      className="flex flex-col rounded-xl border border-border bg-card p-6 hover:border-teal-600/50 hover:bg-muted/30 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold text-lg leading-snug">{title}</h2>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${LEVEL_BADGE[level]}`}
        >
          {LEVEL_LABEL[level]}
        </span>
      </div>

      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
        {description}
      </p>

      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
        <span>{topicCount} topics</span>
        {hasStarted && (
          <>
            <span>·</span>
            <span>
              {completedCount} mastered
              {inProgressCount > 0 ? `, ${inProgressCount} in progress` : ""}
            </span>
          </>
        )}
      </div>

      {hasStarted && (
        <div className="mt-3">
          <ProgressBar value={progressPct} size="sm" />
        </div>
      )}
    </Link>
  );
}
