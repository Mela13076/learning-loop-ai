import { ChevronDown, ExternalLink } from "lucide-react";
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
      <details className="group" open>
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
          <div className="space-y-2">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Learning Resources
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              These are a few resources to help you get started as you learn and
              practice these new concepts. The app is here to guide you in the
              right direction and help you test your knowledge, not replace the
              learning material itself.
            </p>
          </div>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>

        <div className="space-y-4 mt-4">
          {resources.map((resource) => (
            <details
              key={`${resource.title}-${resource.url}`}
              className="group rounded-lg border border-primary/30 bg-background/30 px-4 py-3"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium leading-snug">{resource.title}</h3>
                    <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium text-primary">
                      {resource.type}
                    </span>
                  </div>
                </div>

                <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>

              <div className="mt-3 space-y-3">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {resource.description}
                </p>

                {resource.beginnerValue && (
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {resource.beginnerValue}
                  </p>
                )}

                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Open resource
                  <ExternalLink className="size-4" />
                </a>
              </div>
            </details>
          ))}
        </div>
      </details>
    </section>
  );
}
