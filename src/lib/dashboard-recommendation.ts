import type { ProgressStatus } from "@/generated/prisma/enums";

interface Topic {
  id: string;
  title: string;
  estimatedMinutes: number;
}

interface LearningPath {
  title: string;
  topics: Topic[];
}

type Recommendation =
  | { kind: "empty" | "all_mastered" }
  | {
      kind: "topic";
      topic: Topic & { pathTitle: string };
      actionLabel: "Continue topic" | "Review topic" | "Start topic";
    };

// Paths and topics arrive in curriculum order. Preserve that order for ties,
// but prioritize unfinished work across all paths before starting a new topic.
export function getDashboardRecommendation(
  learningPaths: LearningPath[],
  progressByTopicId: ReadonlyMap<string, { status: ProgressStatus }>,
): Recommendation {
  const topics = learningPaths.flatMap((path) =>
    path.topics.map((topic) => ({ ...topic, pathTitle: path.title })),
  );
  if (topics.length === 0) return { kind: "empty" };

  const priorities = [
    ["IN_PROGRESS", "Continue topic"],
    ["NEEDS_REVIEW", "Review topic"],
    ["NOT_STARTED", "Start topic"],
  ] as const;

  for (const [status, actionLabel] of priorities) {
    const topic = topics.find(
      (candidate) =>
        (progressByTopicId.get(candidate.id)?.status ?? "NOT_STARTED") === status,
    );
    if (topic) return { kind: "topic", topic, actionLabel };
  }

  // All other ProgressStatus values were considered above.
  return { kind: "all_mastered" };
}
