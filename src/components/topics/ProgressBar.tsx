interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
  size?: "sm" | "md";
}

export function ProgressBar({ value, className = "", size = "md" }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const height = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className={`w-full rounded-full bg-muted ${height} ${className}`}>
      <div
        className={`rounded-full bg-primary transition-all duration-300 ${height}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
