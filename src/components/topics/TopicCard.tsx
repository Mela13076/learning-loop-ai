import Link from "next/link";
import type { ProgressStatus, Difficulty } from "@/generated/prisma/enums";
import { ProgressBar } from "./ProgressBar";

interface TopicCardProps {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  orderIndex: number;
  status?: ProgressStatus;
  masteryScore?: number;
}

function difficultyLabel(d: Difficulty): string {
  if (d === "BEGINNER") return "Beginner";
  if (d === "INTERMEDIATE") return "Intermediate";
  return "Advanced";
}

const STATUS_CONFIG: Record<
  ProgressStatus,
  { label: string; dotClass: string; textClass: string }
> = {
  NOT_STARTED: {
    label: "Not started",
    dotClass: "bg-muted-foreground/40",
    textClass: "text-muted-foreground",
  },
  IN_PROGRESS: {
    label: "In progress",
    dotClass: "bg-teal-500",
    textClass: "text-teal-600 dark:text-teal-400",
  },
  NEEDS_REVIEW: {
    label: "Needs review",
    dotClass: "bg-yellow-500",
    textClass: "text-yellow-600 dark:text-yellow-400",
  },
  MASTERED: {
    label: "Mastered",
    dotClass: "bg-green-500",
    textClass: "text-green-600 dark:text-green-400",
  },
};

export function TopicCard({
  id,
  title,
  description,
  difficulty,
  estimatedMinutes,
  orderIndex,
  status = "NOT_STARTED",
  masteryScore = 0,
}: TopicCardProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Link
      href={`/topics/${id}`}
      className="block rounded-xl border border-border bg-card p-5 hover:border-teal-600/50 hover:bg-muted/30 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {orderIndex}
          </span>
          <div className="min-w-0">
            <p className="font-semibold leading-snug">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${config.dotClass}`} />
            <span className={`text-xs font-medium ${config.textClass}`}>
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{difficultyLabel(difficulty)}</span>
            <span>·</span>
            <span>{estimatedMinutes}m</span>
          </div>
        </div>
      </div>

      {status !== "NOT_STARTED" && (
        <div className="mt-4">
          <ProgressBar value={masteryScore} size="sm" />
        </div>
      )}
    </Link>
  );
}
