/**
 * Server-enforced upper bounds for client-provided request values.
 * Keep these independent of UI validation: API callers are untrusted.
 */
export const MAX_STUDY_NOTES_LENGTH = 10_000
export const MAX_QUIZ_ANSWERS = 15
export const MAX_QUIZ_ANSWER_LENGTH = 5_000
export const MAX_CONCEPT_DESCRIPTION_LENGTH = 5_000
export const MAX_WEAK_TOPICS = 20
export const MAX_TOPIC_LABEL_LENGTH = 200
export const MAX_RECENT_QUIZ_SCORES = 50
