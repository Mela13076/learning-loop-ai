import { CheckCircle2 } from "lucide-react";
import type { KeyConcept } from "@/lib/topic-content";

interface KeyConceptsCardProps {
  concepts: KeyConcept[];
}

export function KeyConceptsCard({ concepts }: KeyConceptsCardProps) {
  if (concepts.length === 0) return null;

  return (
    <section className="rounded-xl border border-primary/50 bg-card p-6">
      <h2 className="mb-4 font-semibold text-sm uppercase tracking-wider text-muted-foreground">
        Key Concepts
      </h2>

      <div className="space-y-4">
        {concepts.map((concept) => (
          <div key={concept.title} className="flex items-start gap-3">
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
    </section>
  );
}
