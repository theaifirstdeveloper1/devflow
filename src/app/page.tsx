"use client";

import { useState, useMemo } from 'react';
import type { Entry } from '@/lib/types';
import { Header } from '@/components/devflow/header';
import { QuickCapture } from '@/components/devflow/quick-capture';
import { EntryList } from '@/components/devflow/entry-list';

// Some initial data for demonstration purposes
const initialEntries: Entry[] = [
  {
    id: '1',
    createdAt: new Date(new Date().getTime() - 1000 * 60 * 5),
    content: `function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}`,
    category: 'code_snippet',
  },
  {
    id: '2',
    createdAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 2),
    content: 'Remember to check out the new CSS nesting feature. It could simplify a lot of stylesheets.',
    category: 'learning_note',
  },
    {
    id: '3',
    createdAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24),
    content: 'Idea for a new project: A VS Code extension that uses AI to automatically write documentation for functions.',
    category: 'idea',
  },
];

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [searchQuery, setSearchQuery] = useState('');

  const handleEntryAdded = (newEntry: Entry) => {
    setEntries(prevEntries => [newEntry, ...prevEntries]);
  };

  const filteredEntries = useMemo(() => {
    if (!searchQuery) {
      return entries;
    }
    return entries.filter(entry =>
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [entries, searchQuery]);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div className="space-y-8">
        <QuickCapture onEntryAdded={handleEntryAdded} />
        <EntryList entries={filteredEntries} />
      </div>
    </main>
  );
}
