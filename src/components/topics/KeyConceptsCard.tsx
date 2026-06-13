"use client";

import { CheckCircle2, ChevronDown, Circle } from "lucide-react";
import { useEffect, useState } from "react";
import type { KeyConcept } from "@/lib/topic-content";

interface KeyConceptsCardProps {
  concepts: KeyConcept[];
  topicId: string;
  topicTitle: string;
}

export function KeyConceptsCard({
  concepts,
  topicId,
  topicTitle,
}: KeyConceptsCardProps) {
  const [completedConcepts, setCompletedConcepts] = useState<string[]>([]);

  useEffect(() => {
    const savedValue = window.localStorage.getItem(
      `topic-key-concepts:${topicId}`
    );

    if (!savedValue) {
      setCompletedConcepts([]);
      return;
    }

    try {
      const parsedValue = JSON.parse(savedValue);
      if (Array.isArray(parsedValue)) {
        const validTitles = new Set(concepts.map((concept) => concept.title));
        setCompletedConcepts(
          parsedValue.filter(
            (title): title is string =>
              typeof title === "string" && validTitles.has(title)
          )
        );
        return;
      }
    } catch {
      // Ignore malformed local storage data and reset to an empty checklist.
    }

    setCompletedConcepts([]);
  }, [concepts, topicId]);

  if (concepts.length === 0) return null;

  function toggleConcept(title: string) {
    setCompletedConcepts((current) => {
      const next = current.includes(title)
        ? current.filter((conceptTitle) => conceptTitle !== title)
        : [...current, title];

      window.localStorage.setItem(
        `topic-key-concepts:${topicId}`,
        JSON.stringify(next)
      );

      return next;
    });
  }

  return (
    <section className="rounded-xl border border-primary/50 bg-card p-6">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
          <div className="space-y-2">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-foreground">
              Key Concepts
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              These are the key concepts you will need to understand for{" "}
              <span className="font-medium text-primary">{topicTitle}</span>.
              Once you are comfortable with them, you will be in a better
              position to study and take quizzes on this topic.
            </p>
          </div>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            {completedConcepts.length} of {concepts.length} concepts covered
          </p>

          {concepts.map((concept) => (
            <div
              key={concept.title}
              className="flex items-start gap-3 rounded-lg border border-primary/30 bg-background/30 px-4 py-3"
            >
              <button
                type="button"
                onClick={() => toggleConcept(concept.title)}
                aria-pressed={completedConcepts.includes(concept.title)}
                aria-label={`Mark ${concept.title} as covered`}
                className="mt-0.5 shrink-0 rounded-full text-primary transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {completedConcepts.includes(concept.title) ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <Circle className="size-5" />
                )}
              </button>
              <div>
                <h3 className="font-medium leading-snug">{concept.title}</h3>
                {concept.description && (
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {concept.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
