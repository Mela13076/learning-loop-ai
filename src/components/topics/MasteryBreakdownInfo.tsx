import { CircleHelp } from "lucide-react";
import { ProgressBar } from "./ProgressBar";

interface MasteryBreakdownItem {
  detail: string;
  label: string;
  percentComplete: number;
  pointsEarned: number;
  weight: number;
}

interface MasteryBreakdownInfoProps {
  breakdown: MasteryBreakdownItem[];
}

export function MasteryBreakdownInfo({
  breakdown,
}: MasteryBreakdownInfoProps) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        <CircleHelp className="size-4" />
        <span className="sr-only">How mastery is calculated</span>
      </summary>

      <div className="absolute right-0 top-8 z-20 w-80 rounded-xl border border-primary/50 bg-card p-4 shadow-lg">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-foreground">
            Mastery Breakdown
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Progress is weighted across study, quiz performance, quiz repetition,
            and covered concepts.
          </p>
        </div>

        <div className="mt-4 space-y-4">
          {breakdown.map((item) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium leading-snug">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {item.pointsEarned}/{item.weight}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.weight}% weight</p>
                </div>
              </div>
              <ProgressBar value={item.percentComplete} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
