"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

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
}

type TimerMode = "POMODORO" | "DEEP_WORK" | "CUSTOM";
type Phase = "focus" | "break";
type SessionState = "idle" | "running" | "paused" | "break" | "ended";
type SaveState = "idle" | "saving" | "saved" | "error";

interface ModeConfig {
  label: string;
  description: string;
  focusMinutes: number;
  breakMinutes: number;
}

const MODE_CONFIGS: Record<TimerMode, ModeConfig> = {
  POMODORO: {
    label: "Pomodoro",
    description: "25 min focus · 5 min break",
    focusMinutes: 25,
    breakMinutes: 5,
  },
  DEEP_WORK: {
    label: "Deep Work",
    description: "50 min focus · 10 min break",
    focusMinutes: 50,
    breakMinutes: 10,
  },
  CUSTOM: {
    label: "Custom",
    description: "Set your own times",
    focusMinutes: 30,
    breakMinutes: 5,
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

export function StudyTimer({ topics, initialTopicId }: StudyTimerProps) {
  const [mode, setMode] = useState<TimerMode>("POMODORO");
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

  // Custom mode input values (in minutes)
  const [customFocus, setCustomFocus] = useState(30);
  const [customBreak, setCustomBreak] = useState(5);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Timestamps recorded at session start/end — not state so they don't trigger re-renders
  const startedAtRef = useRef<Date | null>(null);
  const endedAtRef = useRef<Date | null>(null);

  const activeConfig: ModeConfig =
    mode === "CUSTOM"
      ? { ...MODE_CONFIGS.CUSTOM, focusMinutes: customFocus, breakMinutes: customBreak }
      : MODE_CONFIGS[mode];

  // Sync secondsLeft when mode/custom values change and we're idle
  useEffect(() => {
    if (sessionState === "idle") {
      setSecondsLeft(activeConfig.focusMinutes * 60);
      setPhase("focus");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, customFocus, customBreak, sessionState]);

  // Countdown tick
  useEffect(() => {
    if (sessionState === "running") {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
        setElapsedSeconds((prev) => prev + 1);
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
  }, [sessionState]);

  // Phase transition when timer hits zero
  useEffect(() => {
    if (secondsLeft === 0 && sessionState === "running") {
      if (phase === "focus") {
        setPomodoroCount((c) => c + 1);
        setPhase("break");
        setSessionState("break");
        setSecondsLeft(activeConfig.breakMinutes * 60);
      } else {
        setPhase("focus");
        setSessionState("running");
        setSecondsLeft(activeConfig.focusMinutes * 60);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const handleStart = useCallback(() => {
    startedAtRef.current = new Date();
    endedAtRef.current = null;
    setSessionState("running");
    setPhase("focus");
    setSecondsLeft(activeConfig.focusMinutes * 60);
    setElapsedSeconds(0);
    setPomodoroCount(0);
    setSaveState("idle");
    setSaveError("");
  }, [activeConfig.focusMinutes]);

  const handlePause = useCallback(() => setSessionState("paused"), []);
  const handleResume = useCallback(() => setSessionState("running"), []);
  const handleStartBreak = useCallback(() => setSessionState("running"), []);

  const handleEndSession = useCallback(() => {
    endedAtRef.current = new Date();
    setSessionState("ended");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleReset = useCallback(() => {
    startedAtRef.current = null;
    endedAtRef.current = null;
    setSessionState("idle");
    setPhase("focus");
    setSecondsLeft(activeConfig.focusMinutes * 60);
    setElapsedSeconds(0);
    setPomodoroCount(0);
    setNotes("");
    setSaveState("idle");
    setSaveError("");
  }, [activeConfig.focusMinutes]);

  const handleSave = useCallback(async () => {
    if (!startedAtRef.current || !endedAtRef.current) return;
    setSaveState("saving");
    setSaveError("");

    try {
      const res = await fetch("/api/study-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationMinutes: Math.max(1, Math.floor(elapsedSeconds / 60)),
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
    }
  }, [elapsedSeconds, mode, notes, selectedTopicId]);

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const selectedTopic = topics.find((t) => t.id === selectedTopicId);

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
                onClick={() => setMode(m)}
                className={[
                  "rounded-xl border-2 p-4 text-left transition-all",
                  mode === m
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-900/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-teal-300",
                ].join(" ")}
              >
                <div className="font-semibold text-sm">{MODE_CONFIGS[m].label}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {MODE_CONFIGS[m].description}
                </div>
              </button>
            ))}
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
                  onChange={(e) =>
                    setCustomFocus(Math.max(1, Number(e.target.value)))
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Break duration (minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={customBreak}
                  onChange={(e) =>
                    setCustomBreak(Math.max(1, Number(e.target.value)))
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                />
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
          className="w-full bg-teal-600 hover:bg-teal-700 text-white text-base py-6"
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
        {/* Summary card */}
        <div className="rounded-2xl border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/20 p-8">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-2xl font-bold mb-1">Session Complete!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You studied for{" "}
            <span className="font-semibold text-teal-600">
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

        {/* Error */}
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" onClick={handleReset}>
            Start New Session
          </Button>
          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60"
            onClick={handleSave}
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
              : "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
          ].join(" ")}
        >
          <span
            className={[
              "h-2 w-2 rounded-full",
              isBreak
                ? "bg-blue-500"
                : isPaused
                ? "bg-yellow-500"
                : "bg-teal-500 animate-pulse",
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
        <div className="relative">
          <svg width="280" height="280" className="-rotate-90">
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
                  : "text-teal-500"
              }
              style={{ transition: "stroke-dasharray 0.8s ease" }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-mono font-bold tracking-tight tabular-nums">
              {formatTime(secondsLeft)}
            </span>
            {selectedTopic && (
              <span className="mt-2 text-xs text-gray-500 max-w-[160px] truncate">
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
              className="bg-teal-600 hover:bg-teal-700 text-white"
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
