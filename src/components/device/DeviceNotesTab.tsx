"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface UINote {
  notes: string;
  user_full_name: string;
  created_at: string;
  id?: string;
}

interface DeviceNotesTabProps {
  notes: UINote[];
  newNote: string;
  setNewNote: (v: string) => void;
  notesLoading: boolean;
  notesError: string | null;
  onAddNote: () => void;
}

export function DeviceNotesTab({
  notes,
  newNote,
  setNewNote,
  notesLoading,
  notesError,
  onAddNote,
}: DeviceNotesTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add a Note</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your note here..."
              className="min-h-[100px]"
              value={newNote}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNote(e.target.value)}
            />
            <div className="flex justify-end">
              <Button onClick={onAddNote} disabled={!newNote.trim() || notesLoading}>
                {notesLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Note"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes History</CardTitle>
        </CardHeader>
        <CardContent>
          {notesLoading && !notes.length ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : notesError ? (
            <div className="text-destructive text-sm py-4">{notesError}</div>
          ) : notes.length === 0 ? (
            <div className="text-muted-foreground text-sm py-4">No notes yet.</div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 h-full w-0.5 bg-border -translate-x-1/2" />
              <div className="space-y-8">
                {notes.map((note, index) => {
                  const noteDate = new Date(note.created_at);
                  const formattedDate = noteDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div key={note.id || index} className="relative pl-10">
                      <div className="absolute left-0 top-1/2 h-4 w-4 rounded-full bg-primary border-4 border-background z-10 -translate-x-1/2 -translate-y-1/2" />
                      <div className="bg-muted/30 rounded-lg p-4 border border-border hover:bg-muted/50 transition-colors">
                        <p className="whitespace-pre-line text-foreground">{note.notes}</p>
                        <div className="mt-2 flex items-center justify-end gap-2">
                          <span className="text-xs text-muted-foreground">{note.user_full_name}</span>
                          <span className="text-xs text-muted-foreground">&bull;</span>
                          <span className="text-xs text-muted-foreground">{formattedDate}</span>
                        </div>
                      </div>
                      {index < notes.length - 1 && (
                        <div className="absolute left-0 top-8 h-[calc(100%+1rem)] w-0.5 bg-border -translate-x-1/2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
