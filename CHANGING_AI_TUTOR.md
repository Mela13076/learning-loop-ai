# Feature Proposal: Replace AI Tutor Chat with Guided AI Learning Coach

## Overview

The current AI Tutor implementation functions as a lightweight topic-scoped chat experience.

Users can submit arbitrary questions and receive progressively stronger assistance:

1. Explanation
2. Hint
3. Example
4. Answer

The current system is intentionally lightweight and topic-scoped, but it still presents itself as a chat interface.

## Problem

Several issues have been identified with the current approach:

### User Experience

Users are unclear about how the tutor should be used.

Common questions include:

> "What am I supposed to ask?"

> "How does this help me learn the topic?"

The chat interface encourages users to think of the feature as a generic AI assistant rather than a structured learning experience.

### Product Differentiation

Generic AI chat experiences are now common.

Learning Loop AI should not compete by providing another chatbot.

Instead, it should provide guided learning experiences that:

* Teach concepts
* Check understanding
* Reinforce learning
* Encourage active recall
* Guide learners through topics

### Cost Control

Open-ended chat creates unpredictable AI usage.

Users can continue asking unrelated questions indefinitely.

This increases:

* Token consumption
* Infrastructure costs
* Complexity of moderation

without necessarily improving learning outcomes.

## New Direction

Replace:

```text
Ask AI Tutor
```

with:

```text
AI Learning Coach
```

or

```text
Teach Me This Topic
```

The AI should become a structured learning experience rather than an open chat.

## Learning Philosophy

The AI should use a guided coaching model:

* Explain concepts
* Ask questions
* Encourage reasoning
* Provide examples
* Reinforce understanding

The AI should avoid immediately giving answers whenever possible.

The goal is:

```text
Learn
↓
Understand
↓
Practice
↓
Master
```

not:

```text
Ask Question
↓
Receive Answer
```

## New User Flow

Each topic already contains:

* Overview
* Key Concepts
* Learning Resources

The AI Learning Coach will be tied directly to the topic's Key Concepts.

Example:

```text
CSS Fundamentals

Key Concepts

✓ Selectors
✓ Box Model
✓ Flexbox
✓ Grid
✓ Responsive Design
```

Each concept can be selected individually.

Example:

```text
[Learn Selectors]
[Learn Box Model]
[Learn Flexbox]
```

## Concept Session Flow

A learning session focuses on one concept at a time.

Example:

```text
Concept:
CSS Selectors
```

### Step 1

AI provides a short explanation.

Example:

```text
CSS selectors tell the browser which HTML elements should receive styles.
```

### Step 2

User chooses a learning action.

Buttons:

```text
Explain Concept
Show Example
Quiz Me
```

### Explain Concept

Provides a slightly deeper explanation.

Example:

```text
Element selectors target all matching HTML tags.

Example:

p {
  color: blue;
}
```

No open chat is required.

### Show Example

Provides a practical example.

Example:

```html
<p>Hello World</p>
```

```css
p {
  color: red;
}
```

Followed by a short explanation.

### Quiz Me

Provides a concept-specific question.

Example:

```text
Which selector targets an element with class="card"?

A. #card
B. .card
C. card
D. <card>
```

User selects an answer.

AI evaluates the response.

### Correct Answer

Example:

```text
Correct.

The . symbol is used to target classes.
```

### Incorrect Answer

Example:

```text
Not quite.

Hint:
Think about how CSS distinguishes classes from IDs.
```

Buttons:

```text
Try Again
Show Hint
Show Explanation
```

## Removing Freeform Chat

The new system should avoid unrestricted text conversations.

Instead, learning actions should be guided through buttons.

Primary actions:

```text
Explain Concept
Show Example
Quiz Me
```

Optional actions:

```text
Try Again
Show Hint
Show Explanation
Next Concept
Finish Session
```

## Hint Behavior

Hints should only appear during quizzes.

Example:

Question:

```text
Which selector targets an element with class="card"?
```

Hint:

```text
Classes and IDs use special symbols.
Think about which symbol comes before a class name.
```

Hints should never immediately reveal the answer.

## Session Length

The experience should remain short.

Target:

* 2–5 minutes per concept
* 1–3 quiz questions per concept
* 3–6 AI responses total

This prevents long AI conversations while maintaining educational value.

## Future Progress Tracking

Potential future additions:

```ts
ConceptProgress {
  id
  userId
  topicId
  conceptName

  timesStudied
  quizzesCompleted
  masteryScore
  lastStudiedAt
}
```

This is not required for MVP.

## Technical Direction

Current implementation:

```text
Topic
↓
User Question
↓
AI Tutor
↓
Response
```

Proposed implementation:

```text
Topic
↓
Select Concept
↓
Learning Action
↓
AI Learning Coach
↓
Structured Response
```

The AI should receive:

* Topic title
* Concept title
* Concept description
* Selected action

Example:

```json
{
  "topic": "CSS Fundamentals",
  "concept": "Selectors",
  "action": "quiz"
}
```

This creates deterministic and low-cost AI interactions while maintaining educational value.

## AI Architecture and Mock Mode Requirements

### Goal

The AI Learning Coach must support both:

1. Real AI responses (Anthropic)
2. Mock AI responses (development/testing)

This allows frontend and UI development to continue without consuming API credits.

The existing architecture already supports this pattern and should be extended rather than replaced.

## Current State

The current AI Tutor implementation uses:

```text
Frontend
↓
/api/ai/tutor
↓
getTutorResponse()
↓
Mock Mode OR Anthropic
```

Mock mode is currently controlled through:

```text
AI_MODE=mock
```

and returns deterministic canned responses.

This architecture should be preserved.

## New AI Learning Coach Architecture

The new Learning Coach should continue using an abstraction layer.

Example:

```text
Frontend
↓
/api/ai/coach
↓
getLearningCoachResponse()
↓
Mock Mode OR Anthropic
```

The UI should never know whether the response came from:

* Mock AI
* Anthropic

The response contract should remain identical.

## Response Format

The API should return structured responses rather than raw chat text.

Example:

```ts
{
  type: "explanation",
  title: "CSS Selectors",
  content: "...",
  nextActions: [
    "show-example",
    "quiz"
  ]
}
```

Example:

```ts
{
  type: "quiz",
  question: "...",
  options: [
    "...",
    "...",
    "...",
    "..."
  ],
  correctAnswer: 1
}
```

The frontend should render based on response type.

## Mock Mode Requirements

Mock mode should support every learning action.

Supported actions:

```text
Explain Concept
Show Example
Quiz Me
Show Hint
Try Again
Next Concept
```

Mock mode should generate deterministic responses.

Example:

```json
{
  "action": "explain",
  "concept": "Selectors"
}
```

Always returns:

```json
{
  "type": "explanation",
  "content": "Selectors tell CSS which HTML elements should receive styles."
}
```

This ensures:

* UI can be built without Anthropic access
* Developers can work offline
* Tests remain deterministic
* No token costs during development

## Mock Content Source

Create a dedicated mock data file.

Example:

```txt
src/lib/ai/mock-learning-coach.ts
```

Structure:

```ts
const MOCK_LESSONS = {
  selectors: {
    explanation: "...",
    example: "...",
    quiz: {...},
    hint: "..."
  }
}
```

This file should contain several complete concept flows for testing.

## Environment Configuration

Supported modes:

```env
AI_MODE=mock
AI_MODE=anthropic
```

Default:

```env
AI_MODE=mock
```

The application should remain fully functional in mock mode.

A developer should be able to:

* Browse topics
* Open concept lessons
* Complete quizzes
* Navigate concept flows

without requiring an Anthropic API key.

## Development Workflow

Frontend Development:

```text
AI_MODE=mock
```

Benefits:

* No API costs
* Faster iteration
* Deterministic behavior
* Easier debugging

Production:

```text
AI_MODE=anthropic
```

Benefits:

* Dynamic explanations
* Dynamic examples
* Dynamic quizzes
* Personalized coaching

## Definition of Done

The AI Learning Coach is complete when:

✓ Mock mode supports all lesson actions

✓ Anthropic mode supports all lesson actions

✓ Frontend works identically in both modes

✓ No UI development requires API credits

✓ Developers can test complete learning flows locally

✓ The response contract remains consistent regardless of AI provider


## Success Criteria

This feature is successful when:

* Users understand how to use the AI feature immediately.
* AI interactions remain short and focused.
* Learning is centered around key concepts.
* The platform feels like a guided learning experience rather than a generic chatbot.
* AI costs remain predictable.
* Users can move seamlessly from:

  * Learning Resources
  * Key Concepts
  * AI Learning Coach
  * Quiz Generation
  * Progress Tracking
