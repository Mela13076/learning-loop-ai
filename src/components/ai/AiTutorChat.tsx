"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { HintBox } from "./HintBox"

interface TutorResponse {
  type: "explanation" | "hint" | "example" | "answer"
  content: string
  showAnswerButton: boolean
  guidingQuestion?: string
}

interface Message {
  role: "user" | "ai"
  text?: string
  response?: TutorResponse
}

interface AiTutorChatProps {
  topicId: string
  topicTitle: string
}

export function AiTutorChat({ topicId, topicTitle }: AiTutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [showAnswerButton, setShowAnswerButton] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function sendMessage(questionOverride?: string) {
    const question = questionOverride ?? input.trim()
    if (!question) return

    setInput("")
    setError(null)
    setMessages((prev) => [...prev, { role: "user", text: question }])
    setLoading(true)

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          userQuestion: question,
          attemptCount,
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? "Failed to get a response")
      }

      const data = (await res.json()) as TutorResponse
      setMessages((prev) => [...prev, { role: "ai", response: data }])
      setAttemptCount((c) => c + 1)
      if (data.showAnswerButton) setShowAnswerButton(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Ask any question about <span className="font-medium">{topicTitle}</span>. The tutor will guide you with hints rather than just giving you the answer.
        </p>
      )}

      {/* Chat history */}
      <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] rounded-xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                {msg.text}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="max-w-[90%] space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="grid size-5 place-items-center rounded-full bg-[var(--accent-soft)] font-bold text-[10px] text-primary">
                    AI
                  </span>
                  Tutor
                </div>
                {msg.response && (
                  <HintBox
                    type={msg.response.type}
                    content={msg.response.content}
                    guidingQuestion={msg.response.guidingQuestion}
                  />
                )}
              </div>
            </div>
          )
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm text-muted-foreground">
              <span className="flex gap-1">
                <span className="animate-bounce delay-0 size-1.5 rounded-full bg-muted-foreground/60" />
                <span className="animate-bounce delay-150 size-1.5 rounded-full bg-muted-foreground/60" />
                <span className="animate-bounce delay-300 size-1.5 rounded-full bg-muted-foreground/60" />
              </span>
              Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Show Answer button — unlocked after 4 attempts */}
      {showAnswerButton && (
        <Button
          variant="outline"
          size="sm"
          className="w-full border-green-400 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
          onClick={() => void sendMessage("Please show me the full answer.")}
          disabled={loading}
        >
          Show Answer
        </Button>
      )}

      {/* Input area */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question... (Enter to send)"
          rows={2}
          disabled={loading}
          className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <Button
          onClick={() => void sendMessage()}
          disabled={loading || !input.trim()}
          className="self-end"
        >
          Send
        </Button>
      </div>

      {attemptCount > 0 && !showAnswerButton && (
        <p className="text-xs text-muted-foreground text-center">
          {4 - attemptCount > 0
            ? `${4 - attemptCount} more hint${4 - attemptCount === 1 ? "" : "s"} until "Show Answer" unlocks`
            : "Show Answer unlocked above"}
        </p>
      )}
    </div>
  )
}
