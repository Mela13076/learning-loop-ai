"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SessionSummaryCard } from "@/components/ai/SessionSummaryCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Topic {
  id: string;
  title: string;
  pathTitle: string;
  estimatedMinutes: number;
}

interface StudyTimerProps {
  topics: Topic[];
  initialTopicId?: string;
  returnToTopicId?: string;
}

type TimerMode = "POMODORO" | "DEEP_WORK" | "CUSTOM";
type Phase = "focus" | "break";
type SessionState = "idle" | "running" | "paused" | "break" | "ended";
type SaveState = "idle" | "saving" | "saved" | "error";
type SummaryState = "idle" | "loading" | "ready" | "error";

interface SummaryData {
  summary: string
  keyTakeaways: string[]
  weakAreas: string[]
  recommendedNext: string
}

interface ModeConfig {
  label: string;
  description: string;
  focusMinutes: number;
  breakMinutes: number;
  bestFor: string;
}

const MODE_CONFIGS: Record<TimerMode, ModeConfig> = {
  POMODORO: {
    label: "Pomodoro",
    description: "25 min focus · 5 min break",
    focusMinutes: 25,
    breakMinutes: 5,
    bestFor:
      "best for shorter study sessions, review blocks, and active recall without mental fatigue",
  },
  DEEP_WORK: {
    label: "Deep Work",
    description: "50 min focus · 10 min break",
    focusMinutes: 50,
    breakMinutes: 10,
    bestFor:
      "best for coding, problem solving, and harder CS topics that need longer concentration",
  },
  CUSTOM: {
    label: "Custom",
    description: "Set your own times",
    focusMinutes: 30,
    breakMinutes: 5,
    bestFor:
      "best when you want full control over session length, including no-break study sessions",
  },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StudyTimer({
  topics,
  initialTopicId,
  returnToTopicId,
}: StudyTimerProps) {
  const [mode, setMode] = useState<TimerMode>("POMODORO");
  const [hoveredMode, setHoveredMode] = useState<TimerMode | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [phase, setPhase] = useState<Phase>("focus");
  const [secondsLeft, setSecondsLeft] = useState(
    MODE_CONFIGS.POMODORO.focusMinutes * 60
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId ?? "");
  const [notes, setNotes] = useState("");
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string>("");
  const [summaryState, setSummaryState] = useState<SummaryState>("idle");
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  // Custom mode input values (in minutes)
  const [customFocus, setCustomFocus] = useState(30);
  const [customBreak, setCustomBreak] = useState(5);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Timestamps recorded at session start/end — not state so they don't trigger re-renders
  const startedAtRef = useRef<Date | null>(null);
  const endedAtRef = useRef<Date | null>(null);
  const phaseRef = useRef<Phase>("focus");
  const secondsLeftRef = useRef(MODE_CONFIGS.POMODORO.focusMinutes * 60);

  const activeConfig: ModeConfig =
    mode === "CUSTOM"
      ? { ...MODE_CONFIGS.CUSTOM, focusMinutes: customFocus, breakMinutes: customBreak }
      : MODE_CONFIGS[mode];
  const focusSeconds = activeConfig.focusMinutes * 60;
  const breakSeconds = activeConfig.breakMinutes * 60;

  useEffect(() => {
    phaseRef.current = phase;
    secondsLeftRef.current = secondsLeft;
  }, [phase, secondsLeft]);

  // Countdown tick
  useEffect(() => {
    if (sessionState === "running") {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        const currentSeconds = secondsLeftRef.current;

        if (currentSeconds > 1) {
          const nextSeconds = currentSeconds - 1;
          secondsLeftRef.current = nextSeconds;
          setSecondsLeft(nextSeconds);
          return;
        }

        if (phaseRef.current === "focus") {
          setPomodoroCount((count) => count + 1);

          if (breakSeconds === 0) {
            endedAtRef.current = new Date();
            secondsLeftRef.current = 0;
            setSecondsLeft(0);
            setSessionState("ended");
            return;
          }

          phaseRef.current = "break";
          secondsLeftRef.current = breakSeconds;
          setPhase("break");
          setSessionState("break");
          setSecondsLeft(breakSeconds);
          return;
        }

        phaseRef.current = "focus";
        secondsLeftRef.current = focusSeconds;
        setPhase("focus");
        setSecondsLeft(focusSeconds);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [breakSeconds, focusSeconds, sessionState]);

  const syncIdleTimerState = useCallback((nextFocusMinutes: number) => {
    if (sessionState !== "idle") {
      return;
    }

    phaseRef.current = "focus";
    secondsLeftRef.current = nextFocusMinutes * 60;
    setPhase("focus");
    setSecondsLeft(nextFocusMinutes * 60);
  }, [sessionState]);

  const handleModeChange = useCallback((nextMode: TimerMode) => {
    setMode(nextMode);
    const nextFocusMinutes =
      nextMode === "CUSTOM" ? customFocus : MODE_CONFIGS[nextMode].focusMinutes;
    syncIdleTimerState(nextFocusMinutes);
  }, [customFocus, syncIdleTimerState]);

  const handleCustomFocusChange = useCallback((value: number) => {
    const nextFocus = Math.max(1, value);
    setCustomFocus(nextFocus);
    syncIdleTimerState(nextFocus);
  }, [syncIdleTimerState]);

  const handleCustomBreakChange = useCallback((value: number) => {
    setCustomBreak(Math.max(0, value));
  }, []);

  const handleStart = useCallback(() => {
    startedAtRef.current = new Date();
    endedAtRef.current = null;
    phaseRef.current = "focus";
    secondsLeftRef.current = focusSeconds;
    setSessionState("running");
    setPhase("focus");
    setSecondsLeft(focusSeconds);
    setElapsedSeconds(0);
    setPomodoroCount(0);
    setSaveState("idle");
    setSaveError("");
  }, [focusSeconds]);

  const handlePause = useCallback(() => setSessionState("paused"), []);
  const handleResume = useCallback(() => setSessionState("running"), []);
  const handleStartBreak = useCallback(() => setSessionState("running"), []);

  const handleEndSession = useCallback(() => {
    endedAtRef.current = new Date();
    secondsLeftRef.current = 0;
    setSessionState("ended");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleReset = useCallback(() => {
    startedAtRef.current = null;
    endedAtRef.current = null;
    phaseRef.current = "focus";
    secondsLeftRef.current = focusSeconds;
    setSessionState("idle");
    setPhase("focus");
    setSecondsLeft(focusSeconds);
    setElapsedSeconds(0);
    setPomodoroCount(0);
    setNotes("");
    setSaveState("idle");
    setSaveError("");
    setSummaryState("idle");
    setSummaryData(null);
  }, [focusSeconds]);

  const handleSave = useCallback(async () => {
    if (!startedAtRef.current || !endedAtRef.current) return;
    setSaveState("saving");
    setSaveError("");

    const durationMinutes = Math.max(1, Math.floor(elapsedSeconds / 60));

    try {
      const res = await fetch("/api/study-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationMinutes,
          timerMode: mode,
          topicId: selectedTopicId || undefined,
          notes: notes.trim() || undefined,
          startedAt: startedAtRef.current.toISOString(),
          endedAt: endedAtRef.current.toISOString(),
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save session");
      }

      setSaveState("saved");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong");
      setSaveState("error");
      return;
    }

    // Auto-generate AI summary only if a topic was selected AND notes were written
    if (selectedTopicId && notes.trim()) {
      setSummaryState("loading");
      try {
        const res = await fetch("/api/ai/session-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId: selectedTopicId,
            durationMinutes,
            notes: notes.trim() || undefined,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as SummaryData;
          setSummaryData(data);
          setSummaryState("ready");
        } else {
          setSummaryState("error");
        }
      } catch {
        setSummaryState("error");
      }
    }
  }, [elapsedSeconds, mode, notes, selectedTopicId]);

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const selectedTopic = topics.find((t) => t.id === selectedTopicId);
  const returnToTopic = topics.find((t) => t.id === returnToTopicId);
  const modeHint = MODE_CONFIGS[hoveredMode ?? mode];

  // Ring progress
  const totalSeconds =
    phase === "focus"
      ? activeConfig.focusMinutes * 60
      : activeConfig.breakMinutes * 60;
  const progress = sessionState === "idle" ? 0 : 1 - secondsLeft / totalSeconds;
  const circumference = 2 * Math.PI * 110;
  const strokeDash = circumference * progress;

  // ---------------------------------------------------------------------------
  // Idle setup screen
  // ---------------------------------------------------------------------------

  if (sessionState === "idle") {
    return (
      <div className="max-w-xl mx-auto space-y-8">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Timer Mode
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(MODE_CONFIGS) as TimerMode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                onMouseEnter={() => setHoveredMode(m)}
                onMouseLeave={() => setHoveredMode(null)}
                onFocus={() => setHoveredMode(m)}
                onBlur={() => setHoveredMode(null)}
                className={[
                  "rounded-xl border-2 p-4 text-left transition-all",
                  mode === m
                    ? "border-primary bg-[var(--accent-soft)]"
                    : "border-gray-200 dark:border-gray-700 hover:border-primary/50",
                ].join(" ")}
              >
                <div className="font-semibold text-sm">{MODE_CONFIGS[m].label}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {MODE_CONFIGS[m].description}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-primary/20 bg-[var(--accent-soft)]/60 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {modeHint.label}
            </span>{" "}
            is {modeHint.bestFor}.
          </div>

          {mode === "CUSTOM" && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Focus duration (minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={customFocus}
                  onChange={(e) => handleCustomFocusChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Break duration (minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={customBreak}
                  onChange={(e) => handleCustomBreakChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Use <span className="font-medium text-foreground">0</span> for no breaks.
                </p>
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Topic (optional)
          </h2>
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="">— No topic selected —</option>
            {groupTopicsByPath(topics).map(({ pathTitle, topics: pts }) => (
              <optgroup key={pathTitle} label={pathTitle}>
                {pts.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.estimatedMinutes} min)
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <Button
          size="lg"
          className="w-full py-6 text-base"
          onClick={handleStart}
        >
          Start Session
        </Button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Ended screen
  // ---------------------------------------------------------------------------

  if (sessionState === "ended") {
    return (
      <div className="max-w-xl mx-auto space-y-6 text-center">
        {saveState === "saved" && returnToTopic && (
          <div className="flex justify-start">
            <a
              href={`/topics/${returnToTopic.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black shadow-sm transition-colors hover:bg-gray-100"
            >
              ← Back to Topic
            </a>
          </div>
        )}

        {/* Session complete card */}
        <div className="rounded-2xl border-2 border-primary bg-[var(--accent-soft)] p-8">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-2xl font-bold mb-1">Session Complete!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You studied for{" "}
            <span className="font-semibold text-primary">
              {elapsedMinutes} minute{elapsedMinutes !== 1 ? "s" : ""}
            </span>
            {selectedTopic && (
              <>
                {" "}on{" "}
                <span className="font-semibold">{selectedTopic.title}</span>
              </>
            )}
            .
            {pomodoroCount > 0 &&
              ` ${pomodoroCount} focus block${pomodoroCount !== 1 ? "s" : ""} completed.`}
          </p>
        </div>

        {/* Saved confirmation */}
        {saveState === "saved" && (
          <div className="rounded-lg border border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700 px-4 py-3 text-sm text-green-700 dark:text-green-300">
            Session saved successfully!
          </div>
        )}

        {/* Save error */}
        {saveState === "error" && (
          <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {saveError}
          </div>
        )}

        {/* Notes */}
        <div className="text-left">
          <label className="block text-sm font-medium mb-2">Session Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={saveState === "saved"}
            rows={4}
            placeholder="What did you learn? Any questions? Notes for next time…"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm resize-none disabled:opacity-50"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Notes are saved with your session so you can review them later.{" "}
            {saveState !== "saved" && (
              <span className="text-primary">
                Adding notes also unlocks an AI-generated session summary.
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" onClick={handleReset}>
            Start New Session
          </Button>
          <Button
            className="disabled:opacity-60"
            onClick={() => void handleSave()}
            disabled={saveState === "saving" || saveState === "saved"}
          >
            {saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
              ? "Saved ✓"
              : saveState === "error"
              ? "Try Again"
              : "Save Session"}
          </Button>
        </div>

        {/* AI summary — loading */}
        {summaryState === "loading" && (
          <div className="rounded-2xl border border-primary/50 bg-card px-6 py-8 text-center">
            <div className="mx-auto mb-3 size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Generating session summary…</p>
          </div>
        )}

        {/* AI summary — ready */}
        {summaryState === "ready" && summaryData && (
          <SessionSummaryCard
            summary={summaryData}
            topicId={selectedTopic?.id}
            topicTitle={selectedTopic?.title}
          />
        )}

        {/* AI summary — error (silent, non-blocking) */}
        {summaryState === "error" && (
          <p className="text-xs text-muted-foreground">
            Couldn&apos;t generate an AI summary for this session.
          </p>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Active / Break / Paused screen
  // ---------------------------------------------------------------------------

  const isBreak = sessionState === "break" || phase === "break";
  const isPaused = sessionState === "paused";

  return (
    <div className="max-w-lg mx-auto space-y-8 text-center">
      {/* Phase badge */}
      <div className="flex justify-center">
        <span
          className={[
            "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold",
            isBreak
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
              : "bg-[var(--accent-soft)] text-primary",
          ].join(" ")}
        >
          <span
            className={[
              "h-2 w-2 rounded-full",
              isBreak
                ? "bg-blue-500"
                : isPaused
                ? "bg-yellow-500"
                : "bg-primary animate-pulse",
            ].join(" ")}
          />
          {isPaused ? "Paused" : isBreak ? "Break Time" : "Focus"}
          {!isBreak && !isPaused && mode !== "CUSTOM" && (
            <span className="ml-1 font-normal text-xs opacity-70">
              · {MODE_CONFIGS[mode].label}
            </span>
          )}
        </span>
      </div>

      {/* Circular timer */}
      <div className="flex justify-center">
        <div className="relative w-60 sm:w-70">
          <svg viewBox="0 0 280 280" className="w-full h-auto -rotate-90">
            <circle
              cx="140"
              cy="140"
              r="110"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="140"
              cy="140"
              r="110"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              className={
                isBreak
                  ? "text-blue-500"
                  : isPaused
                  ? "text-yellow-500"
                  : "text-primary"
              }
              style={{ transition: "stroke-dasharray 0.8s ease" }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-mono font-bold tracking-tight tabular-nums">
              {formatTime(secondsLeft)}
            </span>
            {selectedTopic && (
              <span className="mt-2 text-xs text-gray-500 max-w-40 truncate">
                {selectedTopic.title}
              </span>
            )}
            {pomodoroCount > 0 && (
              <span className="mt-1 text-xs text-gray-400">
                {pomodoroCount} block{pomodoroCount !== 1 ? "s" : ""} done
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {sessionState === "break" ? (
          <>
            <Button variant="outline" onClick={handleStartBreak}>
              Start Break
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleEndSession}
            >
              End Session
            </Button>
          </>
        ) : isPaused ? (
          <>
            <Button
              className=""
              onClick={handleResume}
            >
              Resume
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleEndSession}
            >
              End Session
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={handlePause}>
              Pause
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleEndSession}
            >
              End Session
            </Button>
          </>
        )}
      </div>

      {/* Notes input */}
      <div className="text-left">
        <label className="block text-sm font-medium mb-2">
          Session Notes{" "}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Jot down key concepts, questions, or ideas as you go…"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm resize-none"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Notes are saved with your session for future reference and unlock an AI summary when your session ends.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function groupTopicsByPath(
  topics: Topic[]
): { pathTitle: string; topics: Topic[] }[] {
  const map = new Map<string, Topic[]>();
  for (const t of topics) {
    const arr = map.get(t.pathTitle) ?? [];
    arr.push(t);
    map.set(t.pathTitle, arr);
  }
  return Array.from(map.entries()).map(([pathTitle, topics]) => ({
    pathTitle,
    topics,
  }));
}
