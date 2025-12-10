'use server';

import { autoTagEntry } from '@/ai/flows/auto-tagging-entries';
import type { Entry, EntryCategory } from './types';

export async function addEntry(content: string): Promise<Entry> {
    if (!content.trim()) {
        throw new Error('Content cannot be empty.');
    }

    const { category } = await autoTagEntry(content);
    
    const newEntry: Entry = {
        id: crypto.randomUUID(),
        createdAt: new Date(),
        content,
        category: category as EntryCategory,
    };
    
    return newEntry;
}
