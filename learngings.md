# Topic Mastery and Concept Progress Spec

## Goal

Persist key concept completion per signed-in user, count that completion toward topic mastery, and require a passing final quiz before a topic can reach `100%` and `MASTERED`.

## Product Rules

- Key concept completion is account-backed, not device-local.
- Covered concepts contribute `20%` of topic mastery.
- Study time contributes `20%` of topic mastery.
- Quiz repetition/count contributes `15%` of topic mastery.
- Quiz performance quality contributes `45%` of topic mastery.
- A topic can rise to at most `99%` without the final mastery gate.
- A topic reaches `100%` and `MASTERED` only after:
  - the weighted mastery score is at least `80`
  - the learner passes at least one `ADVANCED` quiz
  - that quiz contains `15` questions
  - the quiz score is at least `80%`
- The app should only recommend moving to the next topic once the topic is actually `MASTERED`, not just because a single quiz score is high.

## Data Model

Stored on `UserTopicProgress`:

- `coveredConceptTitles: String[]`
- `finalQuizPassed: Boolean`
- `finalQuizPassedAt: DateTime?`

Existing fields still used:

- `status`
- `masteryScore`
- `totalStudyMinutes`
- `quizzesCompleted`
- `averageQuizScore`

## Mastery Formula

Weighted inputs:

- Quiz quality: `(averageQuizScore / 100) * 45`
- Study time: `min(totalStudyMinutes / studyMinutesTarget, 1) * 20`
- Quiz count: `min(quizzesCompleted / 5, 1) * 15`
- Covered concepts: `(coveredConceptCount / totalConceptCount) * 20`

Study time target:

- `studyMinutesTarget = max(30, topic.estimatedMinutes * 2)`
- Example: a `45` minute topic reaches full study-time credit at `90` minutes, not `600`

Derived behavior:

- No activity => `NOT_STARTED`, `0%`
- Weighted score below mastery gate => capped at `99%`
- Weighted score below `40` with at least one quiz => `NEEDS_REVIEW`
- Any other active topic => `IN_PROGRESS`
- Final quiz gate passed and weighted score at least `80` => `MASTERED`, `100%`

## Server Write Paths

All relevant routes recompute mastery from one shared server helper:

- `POST /api/study-sessions`
  - increments study minutes
  - recalculates mastery
- `DELETE /api/study-sessions/[id]`
  - recalculates study minutes from remaining sessions
  - recalculates mastery
- `POST /api/quizzes/[id]/submit`
  - updates quiz count and average score
  - detects final-quiz pass
  - recalculates mastery
- `PATCH /api/topics/[id]/concepts`
  - toggles one covered concept for the current user
  - recalculates mastery

## Topic Page Behavior

- The key concepts checklist renders from server-backed progress.
- Clicking a concept circle performs an optimistic UI update and then persists through `PATCH /api/topics/[id]/concepts`.
- Toggling a concept should not collapse the Key Concepts section while the save completes.
- The topic progress panel shows mastery and, until the final gate is passed, explains that `100%` requires passing an advanced 15-question quiz with at least `80%`.
- The topic progress panel includes an info icon that opens a mastery breakdown.
- The mastery breakdown shows all weighted categories with live progress:
  - Quiz performance quality: `45%`
  - Study time: `20%`
  - Quiz repetition/count: `15%`
  - Covered concepts: `20%`
- The study-time portion of the breakdown should use the per-topic study target, not a fixed global minute count.

## Quiz Results and Recommendation Behavior

- The quiz results "What to do next" card must use actual topic progress status, not only the latest quiz score.
- The "Next Topic" CTA should only render when `UserTopicProgress.status === "MASTERED"`.
- AI recommendation logic should treat `MASTERED` as the gate for `"next_topic"`.
- If the topic is not mastered, recommendation logic must never return `"next_topic"`.

## Notes

- Concept completion is stored by concept title for MVP simplicity.
- If topic concept titles become mutable later, each concept should gain a stable ID and the stored progress should move from titles to IDs.
