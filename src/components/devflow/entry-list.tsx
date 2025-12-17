"use client";

import type { Entry } from "@/lib/types";
import { EntryCard } from "./entry-card";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { clearAllEntriesAction } from "@/lib/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";


interface EntryListProps {
  entries: Entry[];
  onRefresh?: () => void;
  onDeleteEntry?: (entryId: string) => void;
  onToggleCompletion?: (entryId: string, isCompleted: boolean) => void;
}

export function EntryList({ entries, onRefresh, onDeleteEntry, onToggleCompletion }: EntryListProps) {
  const [isPending, startTransition] = useTransition();

  const handleClearAll = () => {
    startTransition(async () => {
      await clearAllEntriesAction();
    });
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
        <h3 className="text-lg font-medium">No Entries Found</h3>
        <p className="mt-2 text-sm">Your brain dump is empty. Start by typing above!</p>
      </div>
    );
  }

  const activeEntries = entries.filter(e => !e.isCompleted);
  const completedEntries = entries.filter(e => e.isCompleted);

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all your entries from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {isPending ? "Deleting..." : "Delete Everything"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Active Entries */}
      <div className="space-y-4">
        {activeEntries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onRefresh={onRefresh}
            onDeleteEntry={onDeleteEntry}
            onToggleCompletion={onToggleCompletion}
          />
        ))}
      </div>

      {/* Completed Entries Section */}
      {completedEntries.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-border">
          <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
            Completed <span className="text-sm bg-muted px-2 py-0.5 rounded-full">{completedEntries.length}</span>
          </h3>
          <div className="space-y-4 opacity-80 hover:opacity-100 transition-opacity">
            {completedEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onRefresh={onRefresh}
                onDeleteEntry={onDeleteEntry}
                onToggleCompletion={onToggleCompletion}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
