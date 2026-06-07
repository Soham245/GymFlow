import { useState } from "react";
import { MessageSquare, Trash2, Send } from "lucide-react";
import { useMemberNotes, useAddNote, useDeleteNote } from "../hooks/use-members";
import { usePermission } from "@/hooks/use-permission";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeDate } from "@/lib/utils";
import { toast } from "sonner";

interface MemberNotesProps {
  memberId: string;
}

export function MemberNotes({ memberId }: MemberNotesProps) {
  const notes = useMemberNotes(memberId);
  const addNote = useAddNote(memberId);
  const deleteNote = useDeleteNote(memberId);
  const canAddNote = usePermission("members:notes");
  const [content, setContent] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    try {
      await addNote.mutateAsync(trimmed);
      setContent("");
      toast.success("Note added");
    } catch {
      toast.error("Failed to add note");
    }
  }

  async function handleDelete(noteId: string) {
    try {
      await deleteNote.mutateAsync(noteId);
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  }

  return (
    <div className="space-y-4">
      {/* Add note form */}
      {canAddNote && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            placeholder="Add a note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
            className="h-9 flex-1 rounded-lg border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || addNote.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}

      {/* Notes list */}
      {notes.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : notes.isError ? (
        <ErrorState
          title="Couldn't load notes"
          onRetry={() => notes.refetch()}
        />
      ) : notes.data!.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No notes yet"
          description="Notes help you track important member information."
        />
      ) : (
        <div className="space-y-0">
          {notes.data!.map((note, idx) => (
            <div
              key={note.id}
              className="relative border-l-2 border-muted pb-4 pl-4 last:pb-0"
            >
              {/* Timeline dot */}
              <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-muted-foreground" />

              <div className="group">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{note.content}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {note.createdByName ?? "System"} · {formatRelativeDate(note.createdAt)}
                    </p>
                  </div>
                  {canAddNote && (
                    <button
                      onClick={() => handleDelete(note.id)}
                      disabled={deleteNote.isPending}
                      className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      title="Delete note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
