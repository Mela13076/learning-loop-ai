"use client"

import { useState } from "react"

interface NoteEntry {
  id: string
  notes: string | null
  durationMinutes: number
  endedAt: Date | null
}

interface SessionNotesListProps {
  initialNotes: NoteEntry[]
}

const TRUNCATE_LENGTH = 160

function formatDate(date: Date | null): string {
  if (!date) return "Unknown date"
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function SessionNotesList({ initialNotes }: SessionNotesListProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modalNote, setModalNote] = useState<NoteEntry | null>(null)

  if (notes.length === 0) return null

  async function handleSaveEdit(id: string) {
    setSavingId(id)
    try {
      const res = await fetch(`/api/study-sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: editText }),
      })
      if (res.ok) {
        setNotes((prev) =>
          prev
            .map((n) => (n.id === id ? { ...n, notes: editText.trim() || null } : n))
            .filter((n) => n.notes !== null)
        )
        setEditingId(null)
      }
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/study-sessions/${id}`, { method: "DELETE" })
      if (res.ok || res.status === 204) {
        setNotes((prev) => prev.filter((n) => n.id !== id))
        if (modalNote?.id === id) setModalNote(null)
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {/* Scrollable list — fixed height shows ~3 notes, scrolls for more */}
      <div className="max-h-100 overflow-y-auto space-y-4 pr-1">
        {notes.map((note, i) => {
          const text = note.notes ?? ""
          const isTruncated = text.length > TRUNCATE_LENGTH
          const isEditing = editingId === note.id

          return (
            <div key={note.id}>
              {/* Meta row */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(note.endedAt)}</span>
                  <span>·</span>
                  <span>{formatMinutes(note.durationMinutes)} session</span>
                </div>

                {!isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingId(note.id)
                        setEditText(text)
                      }}
                      className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void handleDelete(note.id)}
                      disabled={deletingId === note.id}
                      className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                    >
                      {deletingId === note.id ? "…" : "Delete"}
                    </button>
                  </div>
                )}
              </div>

              {/* Note content */}
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => void handleSaveEdit(note.id)}
                      disabled={savingId === note.id}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      {savingId === note.id ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-primary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {isTruncated ? (
                    <>
                      {text.slice(0, TRUNCATE_LENGTH)}
                      {"… "}
                      <button
                        onClick={() => setModalNote(note)}
                        className="font-medium text-primary hover:underline"
                      >
                        Read more
                      </button>
                    </>
                  ) : (
                    text
                  )}
                </p>
              )}

              {i < notes.length - 1 && (
                <hr className="mt-4 border-primary/50" />
              )}
            </div>
          )
        })}
      </div>

      {/* Read-more modal */}
      {modalNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setModalNote(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-primary/50 bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="text-xs text-muted-foreground">
                <span>{formatDate(modalNote.endedAt)}</span>
                <span className="mx-2">·</span>
                <span>{formatMinutes(modalNote.durationMinutes)} session</span>
              </div>
              <button
                onClick={() => setModalNote(null)}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Full note text — scrollable if very long */}
            <div className="max-h-[60vh] overflow-y-auto">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {modalNote.notes}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
