"use client";

/**
 * LoopBackground
 * -----------------------------------------------------------
 * A large, thin, mostly-off-screen loop that rotates slowly,
 * with three glowing points traveling around it
 * (Learn -> Practice -> Apply -> back to Learn).
 *
 * Usage:
 *   Wrap your hero/landing section in a `relative` container
 *   with `overflow-hidden`, drop <LoopBackground /> as the
 *   first child, and give your real content `relative z-10`.
 *
 *   <section className="relative overflow-hidden min-h-screen">
 *     <LoopBackground />
 *     <div className="relative z-10">
 *       ...your actual hero content...
 *     </div>
 *   </section>
 *
 * Respects prefers-reduced-motion automatically via the
 * `motion-reduce:animate-none` utility classes below (Tailwind
 * core — no config changes needed).
 */
export default function LoopBackground({
  color = "#0f9b8e",
  className = "",
}: {
  color?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute top-1/2 left-1/2 z-0 h-[100vmax] w-[100vmax] -translate-x-[58%] -translate-y-[46%] ${className}`}
      //className={`pointer-events-none absolute top-1/2 left-1/2 z-0 h-[min(90vmin,48rem)] w-[min(90vmin,48rem)] -translate-x-1/2 -translate-y-1/2 ${className}`}
    >
      <svg
        viewBox="0 0 1600 1600"
        className="h-full w-full motion-reduce:animate-none"
        style={{
          // animation: "loop-spin 240s linear infinite",
          transformBox: "view-box",
          transformOrigin: "800px 800px",
        }}
      >
        <defs>
          {/* invisible full-circle path that drives the traveling dots */}
          <path
            id="loopMotionPath"
            d="M 1450,800 A 650,650 0 1,1 150,800 A 650,650 0 1,1 1450,800"
            fill="none"
          />
          <radialGradient id="loopDotGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* outer, fainter ring for depth */}
        <circle
          cx="800"
          cy="800"
          r="720"
          fill="none"
          stroke={color}
          strokeOpacity="0.05"
          strokeWidth="2"
        />

        {/* main loop: a circle with a gap, echoing the open-loop
            mark in the logo rather than a closed ring */}
        <circle
          cx="800"
          cy="800"
          r="650"
          fill="none"
          stroke={color}
          strokeOpacity="0.14"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="3550 4084"
          transform="rotate(-35 800 800)"
        />

        {/* three points traveling the loop, evenly staggered on a 24s cycle */}
        {[0, -8, -16].map((offset) => (
          <g key={offset}>
            <circle r="16" fill="url(#loopDotGlow)">
              <animateMotion dur="24s" begin={`${offset}s`} repeatCount="indefinite">
                <mpath href="#loopMotionPath" />
              </animateMotion>
            </circle>
            <circle r="6" fill={color} fillOpacity="0.85">
              <animateMotion dur="24s" begin={`${offset}s`} repeatCount="indefinite">
                <mpath href="#loopMotionPath" />
              </animateMotion>
            </circle>
          </g>
        ))}
      </svg>

      <style jsx>{`
        @keyframes loop-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
