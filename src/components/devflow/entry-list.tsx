"use client";

import type { Entry } from "@/lib/types";
import { EntryCard } from "./entry-card";
import { AnimatePresence, motion } from "framer-motion";


interface EntryListProps {
  entries: Entry[];
}

export function EntryList({ entries }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
        <h3 className="text-lg font-medium">No Entries Found</h3>
        <p className="mt-2 text-sm">Your brain dump is empty. Start by typing above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
