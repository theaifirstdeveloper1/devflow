"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Entry, EntryCategory } from '@/lib/types';
import { getEntries } from '@/lib/entry-service';
import { localSearch } from '@/lib/search-utils';
import { Header } from '@/components/devflow/header';
import { QuickCapture } from '@/components/devflow/quick-capture';
import { EntryList } from '@/components/devflow/entry-list';
import { CategoryFilters } from '@/components/devflow/category-filters';
import { Loader2 } from 'lucide-react';

export default function Home() {
  // State
  const [entries, setEntries] = useState<Entry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load entries from Firestore
  const loadEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const fetchedEntries = await getEntries({
        limit: 100,
        orderByField: 'createdAt',
        orderByDirection: 'desc',
      });

      setEntries(fetchedEntries);
      console.log(`✅ Loaded ${fetchedEntries.length} entries from Firestore`);

    } catch (err) {
      console.error('Failed to load entries:', err);
      setError('Failed to load entries. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Handle new entry added
  const handleEntryAdded = useCallback((newEntry: Entry) => {
    setEntries(prevEntries => [newEntry, ...prevEntries]);
  }, []);

  // Optimistic delete
  const handleDeleteEntry = useCallback(async (entryId: string) => {
    // Optimistically remove from UI
    setEntries(prevEntries => prevEntries.filter(e => e.id !== entryId));
  }, []);

  // Optimistic toggle completion
  const handleToggleCompletion = useCallback(async (entryId: string, newIsCompleted: boolean) => {
    // Optimistically update UI
    setEntries(prevEntries =>
      prevEntries.map(e =>
        e.id === entryId ? { ...e, isCompleted: newIsCompleted } : e
      )
    );
  }, []);

  // Calculate entry counts per category
  const entryCounts = useMemo(() => {
    const counts: Record<EntryCategory | 'all', number> = {
      all: entries.length,
      code_snippet: 0,
      learning_note: 0,
      idea: 0,
      bug_fix: 0,
      general: 0,
      task: 0,
    };

    entries.forEach(entry => {
      counts[entry.category]++;
    });

    return counts;
  }, [entries]);

  // Filter entries by category and search
  const filteredEntries = useMemo(() => {
    let result = entries;

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(e => e.category === selectedCategory);
    }

    // Search filter (local search for instant results)
    if (searchQuery.trim()) {
      result = localSearch(searchQuery, result);
    }

    return result;
  }, [entries, selectedCategory, searchQuery]);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="space-y-6">
        {/* Quick Capture */}
        <QuickCapture onEntryAdded={handleEntryAdded} />

        {/* Category Filters */}
        <CategoryFilters
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          entryCounts={entryCounts}
        />

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading your brain dump...</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Entries list */}
        {!isLoading && !error && (
          <>
            {/* Results count */}
            {searchQuery && (
              <p className="text-sm text-muted-foreground">
                Found {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
                {selectedCategory !== 'all' && ` in ${selectedCategory.replace(/_/g, ' ')}`}
              </p>
            )}

            {filteredEntries.length === 0 && (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground text-lg mb-2">
                  {searchQuery
                    ? 'No entries found matching your search.'
                    : selectedCategory !== 'all'
                      ? `No ${selectedCategory.replace(/_/g, ' ')} entries yet.`
                      : 'No entries yet!'
                  }
                </p>
                <p className="text-muted-foreground text-sm">
                  {searchQuery
                    ? 'Try a different search term or category.'
                    : 'Start dumping your thoughts above.'
                  }
                </p>
              </div>
            )}

            {filteredEntries.length > 0 && (
              <EntryList
                entries={filteredEntries}
                onDeleteEntry={handleDeleteEntry}
                onToggleCompletion={handleToggleCompletion}
                onRefresh={loadEntries}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
