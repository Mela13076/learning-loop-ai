import { ExternalLink } from "lucide-react";
import type { LearningResource } from "@/lib/topic-content";

interface LearningResourcesCardProps {
  resources: LearningResource[];
}

export function LearningResourcesCard({
  resources,
}: LearningResourcesCardProps) {
  if (resources.length === 0) return null;

  return (
    <section className="rounded-xl border border-primary/50 bg-card p-6">
      <h2 className="mb-4 font-semibold text-sm uppercase tracking-wider text-muted-foreground">
        Learning Resources
      </h2>

      <div className="space-y-4">
        {resources.map((resource, index) => (
          <article key={`${resource.title}-${resource.url}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium leading-snug">{resource.title}</h3>
                  <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium text-primary">
                    {resource.type}
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {resource.description}
                </p>

                {resource.beginnerValue && (
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {resource.beginnerValue}
                  </p>
                )}
              </div>

              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                Open resource
                <ExternalLink className="size-4" />
              </a>
            </div>

            {index < resources.length - 1 && (
              <hr className="mt-4 border-primary/50" />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
