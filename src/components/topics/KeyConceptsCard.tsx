import { CheckCircle2, ChevronDown } from "lucide-react";
import type { KeyConcept } from "@/lib/topic-content";

interface KeyConceptsCardProps {
  concepts: KeyConcept[];
  topicTitle: string;
}

export function KeyConceptsCard({
  concepts,
  topicTitle,
}: KeyConceptsCardProps) {
  if (concepts.length === 0) return null;

  return (
    <section className="rounded-xl border border-primary/50 bg-card p-6">
      <details className="group" open>
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
          <div className="space-y-2">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Key Concepts
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              These are the key concepts you will need to understand for{" "}
              <span className="font-medium text-foreground">{topicTitle}</span>.
              Once you are comfortable with them, you will be in a better
              position to study and take quizzes on this topic.
            </p>
          </div>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>

        <div className="space-y-4 mt-4">
          {concepts.map((concept) => (
            <div
              key={concept.title}
              className="flex items-start gap-3 rounded-lg border border-primary/30 bg-background/30 px-4 py-3"
            >
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
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
