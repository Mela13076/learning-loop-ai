"use client";

import { CheckCircle2, ChevronDown, Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { KeyConcept } from "@/lib/topic-content";

interface KeyConceptsCardProps {
  concepts: KeyConcept[];
  initialCoveredConceptTitles: string[];
  topicId: string;
  topicTitle: string;
}

export function KeyConceptsCard({
  concepts,
  initialCoveredConceptTitles,
  topicId,
  topicTitle,
}: KeyConceptsCardProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [completedConcepts, setCompletedConcepts] = useState<string[]>(
    initialCoveredConceptTitles
  );
  const [pendingTitle, setPendingTitle] = useState<string | null>(null);

  if (concepts.length === 0) return null;

  async function toggleConcept(title: string) {
    const isCompleted = completedConcepts.includes(title);
    const next = isCompleted
      ? completedConcepts.filter((conceptTitle) => conceptTitle !== title)
      : [...completedConcepts, title];

    setCompletedConcepts(next);
    setPendingTitle(title);

    try {
      const response = await fetch(`/api/topics/${topicId}/concepts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          completed: !isCompleted,
        }),
      });

      if (!response.ok) {
        setCompletedConcepts(completedConcepts);
        return;
      }

      startRefresh(() => {
        router.refresh();
      });
    } finally {
      setPendingTitle(null);
    }
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
                aria-label={
                  completedConcepts.includes(concept.title)
                    ? `Mark ${concept.title} as not covered`
                    : `Mark ${concept.title} as covered`
                }
                disabled={pendingTitle === concept.title || isRefreshing}
                className="mt-0.5 shrink-0 rounded-full text-primary transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
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
