import type { ProgressStatus } from "@/generated/prisma/enums";

export const TOPIC_MASTERY_CONFIG = {
  weights: {
    quizQuality: 45,
    studyTime: 20,
    quizCount: 15,
    coveredConcepts: 20,
  },
  minimumStudyMinutesForFullCredit: 30,
  studyMinutesMultiplier: 2,
  quizzesForFullCredit: 5,
  masteryThreshold: 80,
  finalQuiz: {
    difficulty: "ADVANCED",
    questionCount: 15,
    passingScore: 80,
  },
} as const;

interface TopicMasteryInput {
  averageQuizScore: number;
  coveredConceptCount: number;
  finalQuizPassed: boolean;
  quizzesCompleted: number;
  topicEstimatedMinutes: number;
  totalConceptCount: number;
  totalStudyMinutes: number;
}

interface SanitizeCoveredConceptTitlesInput {
  coveredConceptTitles: string[];
  validConceptTitles: string[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getStudyMinutesTarget(topicEstimatedMinutes: number): number {
  return Math.max(
    TOPIC_MASTERY_CONFIG.minimumStudyMinutesForFullCredit,
    topicEstimatedMinutes * TOPIC_MASTERY_CONFIG.studyMinutesMultiplier
  );
}

function getTopicMasteryBreakdown(input: TopicMasteryInput) {
  const studyMinutesTarget = getStudyMinutesTarget(input.topicEstimatedMinutes);
  const quizQualityRatio = clamp(input.averageQuizScore, 0, 100) / 100;
  const studyTimeRatio = clamp(
    input.totalStudyMinutes / studyMinutesTarget,
    0,
    1
  );
  const quizCountRatio = clamp(
    input.quizzesCompleted / TOPIC_MASTERY_CONFIG.quizzesForFullCredit,
    0,
    1
  );
  const coveredConceptRatio =
    input.totalConceptCount > 0
      ? clamp(input.coveredConceptCount / input.totalConceptCount, 0, 1)
      : 0;

  return [
    {
      id: "quizQuality",
      label: "Quiz performance quality",
      weight: TOPIC_MASTERY_CONFIG.weights.quizQuality,
      ratio: quizQualityRatio,
      points: quizQualityRatio * TOPIC_MASTERY_CONFIG.weights.quizQuality,
      detail: `${Math.round(input.averageQuizScore)}% average quiz score`,
    },
    {
      id: "studyTime",
      label: "Study time",
      weight: TOPIC_MASTERY_CONFIG.weights.studyTime,
      ratio: studyTimeRatio,
      points: studyTimeRatio * TOPIC_MASTERY_CONFIG.weights.studyTime,
      detail: `${input.totalStudyMinutes}/${studyMinutesTarget} minutes`,
    },
    {
      id: "quizCount",
      label: "Quiz repetition/count",
      weight: TOPIC_MASTERY_CONFIG.weights.quizCount,
      ratio: quizCountRatio,
      points: quizCountRatio * TOPIC_MASTERY_CONFIG.weights.quizCount,
      detail: `${input.quizzesCompleted}/${TOPIC_MASTERY_CONFIG.quizzesForFullCredit} quizzes`,
    },
    {
      id: "coveredConcepts",
      label: "Covered concepts",
      weight: TOPIC_MASTERY_CONFIG.weights.coveredConcepts,
      ratio: coveredConceptRatio,
      points:
        coveredConceptRatio * TOPIC_MASTERY_CONFIG.weights.coveredConcepts,
      detail: `${input.coveredConceptCount}/${input.totalConceptCount} concepts`,
    },
  ] as const;
}

export function sanitizeCoveredConceptTitles({
  coveredConceptTitles,
  validConceptTitles,
}: SanitizeCoveredConceptTitlesInput): string[] {
  const validTitles = new Set(validConceptTitles);
  const deduped = new Set<string>();

  for (const title of coveredConceptTitles) {
    if (validTitles.has(title)) {
      deduped.add(title);
    }
  }

  return Array.from(deduped);
}

export function isPassingFinalMasteryQuiz(input: {
  difficulty: string;
  questionCount: number;
  scorePercent: number;
}): boolean {
  return (
    input.difficulty === TOPIC_MASTERY_CONFIG.finalQuiz.difficulty &&
    input.questionCount === TOPIC_MASTERY_CONFIG.finalQuiz.questionCount &&
    input.scorePercent >= TOPIC_MASTERY_CONFIG.finalQuiz.passingScore
  );
}

export function computeTopicMastery(input: TopicMasteryInput): {
  masteryScore: number;
  status: ProgressStatus;
  weightedScore: number;
} {
  const breakdown = getTopicMasteryBreakdown(input);

  const weightedScore = Math.round(
    breakdown.reduce((sum, item) => sum + item.points, 0)
  );
  const hasActivity =
    input.totalStudyMinutes > 0 ||
    input.quizzesCompleted > 0 ||
    input.coveredConceptCount > 0;
  const finalGateSatisfied =
    input.finalQuizPassed &&
    weightedScore >= TOPIC_MASTERY_CONFIG.masteryThreshold;

  if (!hasActivity) {
    return {
      masteryScore: 0,
      status: "NOT_STARTED",
      weightedScore,
    };
  }

  if (finalGateSatisfied) {
    return {
      masteryScore: 100,
      status: "MASTERED",
      weightedScore,
    };
  }

  if (input.quizzesCompleted > 0 && weightedScore < 40) {
    return {
      masteryScore: Math.min(weightedScore, 99),
      status: "NEEDS_REVIEW",
      weightedScore,
    };
  }

  return {
    masteryScore: Math.min(weightedScore, 99),
    status: "IN_PROGRESS",
    weightedScore,
  };
}

export function summarizeTopicMastery(input: TopicMasteryInput) {
  const breakdown = getTopicMasteryBreakdown(input).map((item) => ({
    ...item,
    percentComplete: Math.round(item.ratio * 100),
    pointsEarned: Math.round(item.points),
  }));

  return {
    breakdown,
    weightedScore: Math.round(
      breakdown.reduce((sum, item) => sum + item.pointsEarned, 0)
    ),
  };
}
